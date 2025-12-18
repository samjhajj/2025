import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServerClient, getSupabaseAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plane, FileText, Activity, Shield, Home } from "lucide-react"
import { AuditLogTable } from "@/components/admin/audit-log-table"
import { UserManagement } from "@/components/admin/user-management"
import { SystemStats } from "@/components/admin/system-stats"
import { LogoutButton } from "@/components/logout-button"
import { ActivePilotsTable } from "@/components/admin/active-pilots-table"

export default async function AdminDashboardPage() {
  const { user } = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await getSupabaseServerClient()

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  const adminClient = getSupabaseAdminClient()

  // Get system statistics
  const [
    { count: totalUsers },
    { count: totalPilots },
    { count: totalFlights },
    { count: activeFlights },
    { count: pendingApprovals },
    { count: totalDrones },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "pilot"),
    adminClient.from("flights").select("*", { count: "exact", head: true }),
    adminClient.from("flights").select("*", { count: "exact", head: true }).eq("status", "active"),
    adminClient.from("flights").select("*", { count: "exact", head: true }).eq("overall_status", "pending"),
    adminClient.from("drones").select("*", { count: "exact", head: true }),
  ])

  // Get recent audit logs
  const { data: recentLogs } = await adminClient
    .from("audit_logs")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false })
    .limit(50)

  // Get all users for management
  const { data: allUsers } = await adminClient.from("profiles").select("*").order("created_at", { ascending: false })

  const { data: activePilots } = await adminClient
    .from("pilot_profiles")
    .select("*, profiles(*)")
    .eq("overall_status", "approved")
    .order("updated_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System overview and management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">{totalPilots || 0} pilots registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFlights || 0}</div>
              <p className="text-xs text-muted-foreground">{activeFlights || 0} currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Drones</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDrones || 0}</div>
              <p className="text-xs text-muted-foreground">In the system</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stats">System Statistics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="pilots">
              Active Pilots
              <Badge variant="secondary" className="ml-2">
                {activePilots?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="audit">
              Audit Logs
              <Badge variant="secondary" className="ml-2">
                {recentLogs?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <SystemStats />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={allUsers || []} />
          </TabsContent>

          <TabsContent value="pilots">
            <ActivePilotsTable pilots={activePilots || []} />
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Complete system activity history</CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogTable logs={recentLogs || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
