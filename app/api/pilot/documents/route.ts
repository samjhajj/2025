import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

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
    const nationalId = formData.get("nationalId") as File
    const insurance = formData.get("insurance") as File

    if (!nationalId || !insurance) {
      return NextResponse.json({ error: "Missing required documents" }, { status: 400 })
    }

    console.log("[v0] Starting document upload for user:", user.id)
    console.log("[v0] National ID:", { name: nationalId.name, size: nationalId.size, type: nationalId.type })
    console.log("[v0] Insurance:", { name: insurance.name, size: insurance.size, type: insurance.type })

    // Upload national ID
    const nationalIdPath = `documents/${user.id}/national-id-${Date.now()}.${nationalId.name.split(".").pop()}`
    console.log("[v0] Uploading national ID to Blob:", nationalIdPath)

    const nationalIdBlob = await put(nationalIdPath, nationalId, {
      access: "public",
      contentType: nationalId.type,
    })

    console.log("[v0] National ID uploaded successfully to Blob:", nationalIdBlob.url)

    // Upload insurance
    const insurancePath = `documents/${user.id}/insurance-${Date.now()}.${insurance.name.split(".").pop()}`
    console.log("[v0] Uploading insurance to Blob:", insurancePath)

    const insuranceBlob = await put(insurancePath, insurance, {
      access: "public",
      contentType: insurance.type,
    })

    console.log("[v0] Insurance uploaded successfully to Blob:", insuranceBlob.url)

    // Record documents in database
    const { error: dbError } = await supabase.from("documents").insert([
      {
        user_id: user.id,
        file_type: "national_id",
        file_name: nationalId.name,
        file_url: nationalIdBlob.url,
        file_size: nationalId.size,
      },
      {
        user_id: user.id,
        file_type: "insurance",
        file_name: insurance.name,
        file_url: insuranceBlob.url,
        file_size: insurance.size,
      },
    ])

    if (dbError) {
      console.error("[v0] Database insert error:", dbError.message)
      return NextResponse.json(
        {
          error: "Failed to record documents in database",
          details: dbError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Documents recorded in database successfully")

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "create",
      entity_type: "document",
      entity_id: user.id,
      description: "Uploaded national ID and insurance documents",
      metadata: { documents: ["national_id", "insurance"] },
    })

    console.log("[v0] Document upload completed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Documents API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
