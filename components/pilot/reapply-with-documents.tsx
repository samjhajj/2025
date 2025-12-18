"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Upload, FileText, CheckCircle } from "@/components/ui/icons"

interface Props {
  pilotProfile: any
  onSuccess: () => void
}

export function ReapplyWithDocuments({ pilotProfile, onSuccess }: Props) {
  const [step, setStep] = useState<"review" | "upload" | "confirm">("review")
  const [nationalId, setNationalId] = useState<File | null>(null)
  const [insurance, setInsurance] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [reapplying, setReapplying] = useState(false)
  const [error, setError] = useState("")
  const [documentsUploaded, setDocumentsUploaded] = useState(false)

  const handleUploadDocuments = async () => {
    if (!nationalId || !insurance) {
      setError("Please select both National ID and Insurance documents")
      return
    }

    setError("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("nationalId", nationalId)
      formData.append("insurance", insurance)

      const response = await fetch("/api/pilot/documents", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload documents")
      }

      setDocumentsUploaded(true)
      setStep("confirm")
    } catch (err) {
      console.error("[v0] Document upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload documents")
    } finally {
      setUploading(false)
    }
  }

  const handleReapply = async () => {
    setReapplying(true)
    setError("")

    try {
      const response = await fetch("/api/pilot/reapply", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to re-apply")
      }

      onSuccess()
    } catch (err) {
      console.error("[v0] Re-apply error:", err)
      setError(err instanceof Error ? err.message : "Failed to re-apply")
    } finally {
      setReapplying(false)
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Application Rejected
        </CardTitle>
        <CardDescription>
          Your pilot application has been rejected. Please review the feedback, upload updated documents, and re-apply.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Review Feedback */}
        {step === "review" && (
          <>
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Department Feedback:</h3>
              {pilotProfile.air_defense_notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Air Defense:</p>
                  <p className="text-sm text-muted-foreground">{pilotProfile.air_defense_notes}</p>
                </div>
              )}
              {pilotProfile.logistics_notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Logistics:</p>
                  <p className="text-sm text-muted-foreground">{pilotProfile.logistics_notes}</p>
                </div>
              )}
              {pilotProfile.intelligence_notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Intelligence:</p>
                  <p className="text-sm text-muted-foreground">{pilotProfile.intelligence_notes}</p>
                </div>
              )}
            </div>
            <Button onClick={() => setStep("upload")} className="w-full" size="lg">
              Continue to Upload Documents
            </Button>
          </>
        )}

        {/* Step 2: Upload Documents */}
        {step === "upload" && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Please upload updated documents to address the rejection feedback</span>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID *</Label>
                <Input
                  id="nationalId"
                  type="file"
                  onChange={(e) => setNationalId(e.target.files?.[0] || null)}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG (Max 10MB)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Document *</Label>
                <Input
                  id="insurance"
                  type="file"
                  onChange={(e) => setInsurance(e.target.files?.[0] || null)}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG (Max 10MB)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep("review")} variant="outline" className="flex-1" disabled={uploading}>
                Back
              </Button>
              <Button
                onClick={handleUploadDocuments}
                disabled={uploading || !nationalId || !insurance}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Documents
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Confirm and Re-apply */}
        {step === "confirm" && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Documents uploaded successfully!</span>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{nationalId?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{insurance?.name}</span>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your application will be reset to pending status and reviewed again by all departments.
                </AlertDescription>
              </Alert>
            </div>

            <Button onClick={handleReapply} disabled={reapplying} className="w-full" size="lg">
              {reapplying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Re-applying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Submit Re-application
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
