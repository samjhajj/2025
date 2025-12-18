import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()

    // Extract pilot information
    const pilotInfo = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      street_address: formData.get("street_address") as string,
      city: formData.get("city") as string,
      county: formData.get("county") as string,
      country: formData.get("country") as string,
    }

    // Extract drone information
    const droneData = {
      manufacturer: formData.get("manufacturer") as string,
      model: formData.get("model") as string,
      serial_number: formData.get("serial_number") as string,
      registration_number: formData.get("registration_number") as string,
      weight_kg: Number.parseFloat(formData.get("weight_kg") as string),
      max_altitude_m: Number.parseInt(formData.get("max_altitude_m") as string),
      max_speed_kmh: Number.parseInt(formData.get("max_speed_kmh") as string),
      has_camera: formData.get("has_camera") === "true",
      camera_resolution: formData.get("camera_resolution") as string,
      has_thermal_imaging: formData.get("has_thermal_imaging") === "true",
      is_registered: formData.get("is_registered") === "true",
      registration_date: (formData.get("registration_date") as string) || null,
      registration_expiry: (formData.get("registration_expiry") as string) || null,
    }

    // Extract documents
    const idDocument = formData.get("id_document") as File | null
    const insuranceDocument = formData.get("insurance_document") as File | null

    console.log("[v0] Processing drone registration with pilot info and documents")

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: `${pilotInfo.first_name} ${pilotInfo.last_name}`,
        phone: pilotInfo.phone,
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("[v0] Profile update error:", profileError)
      return NextResponse.json({ error: "Failed to update profile", details: profileError.message }, { status: 500 })
    }

    const { error: pilotProfileError } = await supabase.from("pilot_profiles").upsert({
      user_id: user.id,
      address: pilotInfo.street_address,
      city: pilotInfo.city,
      county: pilotInfo.county,
      country: pilotInfo.country,
      postal_code: "", // Can be added later if needed
    })

    if (pilotProfileError) {
      console.error("[v0] Pilot profile update error:", pilotProfileError)
      return NextResponse.json(
        { error: "Failed to update pilot profile", details: pilotProfileError.message },
        { status: 500 },
      )
    }

    const { error: droneError } = await supabase.from("drones").insert({
      pilot_id: user.id,
      ...droneData,
    })

    if (droneError) {
      console.error("[v0] Drone insert error:", droneError)
      return NextResponse.json({ error: "Failed to add drone", details: droneError.message }, { status: 500 })
    }

    if (idDocument) {
      console.log("[v0] Uploading ID document:", { name: idDocument.name, size: idDocument.size })
      const idBuffer = await idDocument.arrayBuffer()
      const idFileName = `${user.id}/id_${Date.now()}_${idDocument.name}`

      const { error: idUploadError } = await supabase.storage.from("documents").upload(idFileName, idBuffer, {
        contentType: idDocument.type,
        upsert: false,
      })

      if (idUploadError) {
        console.error("[v0] ID upload error:", idUploadError)
        return NextResponse.json(
          { error: "Failed to upload ID document", details: idUploadError.message },
          { status: 500 },
        )
      }

      // Create document record
      const { error: idDocError } = await supabase.from("documents").insert({
        user_id: user.id,
        document_type: "national_id",
        file_name: idDocument.name,
        file_path: idFileName,
        file_size: idDocument.size,
        mime_type: idDocument.type,
        scan_status: "pending",
      })

      if (idDocError) {
        console.error("[v0] ID document record error:", idDocError)
        return NextResponse.json(
          { error: "Failed to record ID document", details: idDocError.message },
          { status: 500 },
        )
      }
    }

    if (insuranceDocument) {
      console.log("[v0] Uploading insurance document:", { name: insuranceDocument.name, size: insuranceDocument.size })
      const insuranceBuffer = await insuranceDocument.arrayBuffer()
      const insuranceFileName = `${user.id}/insurance_${Date.now()}_${insuranceDocument.name}`

      const { error: insuranceUploadError } = await supabase.storage
        .from("documents")
        .upload(insuranceFileName, insuranceBuffer, {
          contentType: insuranceDocument.type,
          upsert: false,
        })

      if (insuranceUploadError) {
        console.error("[v0] Insurance upload error:", insuranceUploadError)
        return NextResponse.json(
          { error: "Failed to upload insurance document", details: insuranceUploadError.message },
          { status: 500 },
        )
      }

      // Create document record
      const { error: insuranceDocError } = await supabase.from("documents").insert({
        user_id: user.id,
        document_type: "insurance",
        file_name: insuranceDocument.name,
        file_path: insuranceFileName,
        file_size: insuranceDocument.size,
        mime_type: insuranceDocument.type,
        scan_status: "pending",
      })

      if (insuranceDocError) {
        console.error("[v0] Insurance document record error:", insuranceDocError)
        return NextResponse.json(
          { error: "Failed to record insurance document", details: insuranceDocError.message },
          { status: 500 },
        )
      }
    }

    console.log("[v0] Drone registration completed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Drone API error:", error)
    return NextResponse.json(
      {
        error: "Failed to add drone",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Drone ID required" }, { status: 400 })
    }

    const { error } = await supabase.from("drones").delete().eq("id", id).eq("pilot_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting drone:", error)
    return NextResponse.json({ error: "Failed to delete drone" }, { status: 500 })
  }
}
