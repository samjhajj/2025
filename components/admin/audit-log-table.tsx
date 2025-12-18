"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Search } from "lucide-react"

interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: any
  created_at: string
  profiles: {
    full_name: string
    email: string
  } | null
}

interface Props {
  logs: AuditLog[]
}

export function AuditLogTable({ logs }: Props) {
  const [search, setSearch] = useState("")

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(search.toLowerCase()),
  )

  const getActionBadge = (action: string) => {
    if (action.includes("approved")) return <Badge variant="default">{action}</Badge>
    if (action.includes("rejected")) return <Badge variant="destructive">{action}</Badge>
    if (action.includes("created") || action.includes("registered")) return <Badge variant="secondary">{action}</Badge>
    return <Badge variant="outline">{action}</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search logs by action, user, or entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">
                    {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{log.profiles?.full_name || "Unknown User"}</p>
                      <p className="text-xs text-muted-foreground">{log.profiles?.email || "No email"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    {log.entity_type && (
                      <div>
                        <p className="text-sm">{log.entity_type}</p>
                        {log.entity_id && <p className="text-xs text-muted-foreground font-mono">{log.entity_id}</p>}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.details && (
                      <pre className="text-xs text-muted-foreground max-w-xs overflow-hidden text-ellipsis">
                        {JSON.stringify(log.details, null, 2).slice(0, 100)}
                        {JSON.stringify(log.details).length > 100 && "..."}
                      </pre>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
