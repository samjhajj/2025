"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Package, Eye } from "lucide-react"

function ReviewerRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const deptParam = searchParams.get("dept")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState(deptParam || "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (deptParam) {
      setDepartment(deptParam)
    }
  }, [deptParam])

  const getDepartmentIcon = () => {
    switch (department) {
      case "air_defense":
        return <Shield className="h-6 w-6 text-blue-500" />
      case "logistics":
        return <Package className="h-6 w-6 text-green-500" />
      case "intelligence":
        return <Eye className="h-6 w-6 text-purple-500" />
      default:
        return <Shield className="h-6 w-6 text-primary" />
    }
  }

  const getDepartmentName = () => {
    switch (department) {
      case "air_defense":
        return "Air Defense"
      case "logistics":
        return "Logistics"
      case "intelligence":
        return "Intelligence"
      default:
        return "Department"
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!department) {
      setError("Please select a department")
      setLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role: department,
        },
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/review`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push("/review")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {getDepartmentIcon()}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {department ? `${getDepartmentName()} Registration` : "Department Reviewer Registration"}
          </CardTitle>
          <CardDescription>Create your government department reviewer account</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment} disabled={!!deptParam || loading}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="air_defense">Air Defense</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="intelligence">Intelligence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Official Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="officer@department.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Reviewer Account"}
            </Button>
            <div className="text-sm text-center space-y-2">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
              <p className="text-muted-foreground">
                Are you a pilot?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Register as pilot
                </Link>
              </p>
              <p className="text-muted-foreground pt-2 border-t">
                <Link href="/" className="text-primary hover:underline font-medium">
                  ← Return to Home
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ReviewerRegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewerRegisterForm />
    </Suspense>
  )
}
