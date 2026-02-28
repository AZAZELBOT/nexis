import { Cable, Clock3, ListChecks, UsersRound } from "lucide-react";

import { useRuntimeSnapshot } from "@/hooks/use-runtime-snapshot";
import { formatDateTime, shortId } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ConnectionsPage() {
  const { data, error } = useRuntimeSnapshot({ intervalMs: 5_000 });

  const connectedSessions = data?.connected_sessions ?? [];
  const suspendedSessions = data?.suspended_sessions ?? [];
  const matchmakingQueue = data?.matchmaking_queue ?? [];

  return (
    <div className="grid gap-4 px-4 py-4 md:grid-cols-2 md:gap-6 md:py-6 lg:px-6">
      {error ? (
        <div className="md:col-span-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card className="border-border/80 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersRound className="size-4" />
            Connected Sessions ({connectedSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active connections.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {connectedSessions.map((sessionId) => (
                <Badge key={sessionId} variant="secondary">
                  {shortId(sessionId)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/85 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock3 className="size-4" />
            Suspended Sessions ({suspendedSessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suspendedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No suspended sessions.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspendedSessions.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell className="font-mono text-xs">
                      {shortId(session.session_id)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {shortId(session.project_id)}
                    </TableCell>
                    <TableCell>{formatDateTime(session.expires_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/85 backdrop-blur md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-4" />
            Matchmaking Queue ({matchmakingQueue.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchmakingQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Queue is empty.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Party Size</TableHead>
                  <TableHead>Enqueued At</TableHead>
                  <TableHead>Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchmakingQueue.map((entry) => (
                  <TableRow key={`${entry.session_id}-${entry.enqueued_at}`}>
                    <TableCell className="font-mono text-xs">
                      {shortId(entry.session_id)}
                    </TableCell>
                    <TableCell>{entry.room_type}</TableCell>
                    <TableCell>{entry.size}</TableCell>
                    <TableCell>{formatDateTime(entry.enqueued_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Cable className="mr-1 size-3.5" />
                        {entry.age_seconds}s
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
