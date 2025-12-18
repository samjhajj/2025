import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, Shield, MapPin, CheckCircle, Eye, Package } from "@/components/ui/icons"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-balance">Drone Flight Management System</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Secure, multi-department approval system for drone flight operations
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link href="/register">Register as Pilot</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto mb-16 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Government Department Access</CardTitle>
            <CardDescription>Department reviewers can sign in to review and approve flight requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">Air Defense</CardTitle>
                  <CardDescription className="text-xs">Review flight requests for airspace security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <Button asChild variant="default" className="w-full" size="sm">
                    <Link href="/login?dept=air_defense">Sign In</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                    <Link href="/register/reviewer?dept=air_defense">Create Account</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Package className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">Logistics</CardTitle>
                  <CardDescription className="text-xs">Coordinate drone operations and resources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <Button asChild variant="default" className="w-full" size="sm">
                    <Link href="/login?dept=logistics">Sign In</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                    <Link href="/register/reviewer?dept=logistics">Create Account</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">Intelligence</CardTitle>
                  <CardDescription className="text-xs">Monitor and analyze flight operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <Button asChild variant="default" className="w-full" size="sm">
                    <Link href="/login?dept=intelligence">Sign In</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent" size="sm">
                    <Link href="/register/reviewer?dept=intelligence">Create Account</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Multi-Department Approval</CardTitle>
              <CardDescription>
                Flight requests require approval from Air Defense, Logistics, and Intelligence departments
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-Time Tracking</CardTitle>
              <CardDescription>Monitor active flights with live GPS tracking and flight status updates</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>
                Built with security best practices and compliance with aviation regulations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Register & Complete Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Create your pilot account and submit required documents for verification
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Register Your Drones</h3>
                <p className="text-sm text-muted-foreground">
                  Add your drone fleet with specifications and documentation
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Submit Flight Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Request approval for your planned flights with route and timing details
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fly with Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Once approved by all departments, start your flight and track it in real-time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <Link href="/admin">Admin Access</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
