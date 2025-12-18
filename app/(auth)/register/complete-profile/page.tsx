"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, CreditCard, CheckCircle2 } from "lucide-react"

type Step = "address" | "documents" | "payment" | "complete"

export default function CompleteProfilePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>("address")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [addressData, setAddressData] = useState({
    address: "",
    city: "",
    country: "",
    postalCode: "",
  })

  const [documents, setDocuments] = useState({
    nationalId: null as File | null,
    insurance: null as File | null,
  })

  useEffect(() => {
    const checkAuth = async () => {
      console.log("[v0] Complete Profile - Checking authentication")
      try {
        const supabase = getSupabaseBrowserClient()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        console.log("[v0] Complete Profile - User:", user ? "authenticated" : "not authenticated")

        if (authError) {
          console.error("[v0] Complete Profile - Auth error:", authError)
        }

        if (!user) {
          console.log("[v0] Complete Profile - Redirecting to login")
          router.push("/login?redirect=/register/complete-profile")
          return
        }

        setUserId(user.id)
        console.log("[v0] Complete Profile - User ID set:", user.id)
      } catch (err) {
        console.error("[v0] Complete Profile - Unexpected error:", err)
        setError("Failed to verify authentication. Please try logging in again.")
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Complete Profile - Submitting address data")
      const response = await fetch("/api/pilot/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save address")
      }

      console.log("[v0] Complete Profile - Address saved successfully")
      setCurrentStep("documents")
    } catch (err) {
      console.error("[v0] Complete Profile - Address submission error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!documents.nationalId || !documents.insurance) {
      setError("Please upload both required documents")
      return
    }

    setLoading(true)

    try {
      console.log("[v0] Complete Profile - Uploading documents")
      const formData = new FormData()
      formData.append("nationalId", documents.nationalId)
      formData.append("insurance", documents.insurance)

      const response = await fetch("/api/pilot/documents", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload documents")
      }

      console.log("[v0] Complete Profile - Documents uploaded successfully")
      setCurrentStep("payment")
    } catch (err) {
      console.error("[v0] Complete Profile - Document upload error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Complete Profile - Processing payment")
      const response = await fetch("/api/pilot/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 25 }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Payment failed")
      }

      console.log("[v0] Complete Profile - Payment processed successfully")
      setCurrentStep("complete")
    } catch (err) {
      console.error("[v0] Complete Profile - Payment error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getProgress = () => {
    switch (currentStep) {
      case "address":
        return 25
      case "documents":
        return 50
      case "payment":
        return 75
      case "complete":
        return 100
      default:
        return 0
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Registration Complete!</CardTitle>
            <CardDescription>Your profile is now under review by our departments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your profile will be reviewed by Air Defense, Logistics, and Intelligence departments. You'll receive
              notifications once your profile is approved.
            </p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Pilot Profile</CardTitle>
          <CardDescription>Step {getProgress() / 25} of 4</CardDescription>
          <Progress value={getProgress()} className="mt-2" />
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {currentStep === "address" && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={addressData.address}
                  onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={addressData.postalCode}
                    onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={addressData.country}
                  onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Continue"}
              </Button>
            </form>
          )}

          {currentStep === "documents" && (
            <form onSubmit={handleDocumentsSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID / Passport</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <Input
                    id="nationalId"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocuments({ ...documents, nationalId: e.target.files?.[0] || null })}
                    className="cursor-pointer"
                    disabled={loading}
                  />
                  {documents.nationalId && (
                    <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4" />
                      {documents.nationalId.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance">Drone Insurance Certificate</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <Input
                    id="insurance"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocuments({ ...documents, insurance: e.target.files?.[0] || null })}
                    className="cursor-pointer"
                    disabled={loading}
                  />
                  {documents.insurance && (
                    <p className="text-sm text-green-600 mt-2 flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4" />
                      {documents.insurance.name}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Uploading..." : "Continue"}
              </Button>
            </form>
          )}

          {currentStep === "payment" && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Registration Fee</span>
                  <span className="text-2xl font-bold">$25.00</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  One-time registration fee required for pilot profile approval
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>Secure payment processing</span>
                </div>
                <Button onClick={handlePayment} className="w-full" disabled={loading}>
                  {loading ? "Processing..." : "Pay $25.00"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
