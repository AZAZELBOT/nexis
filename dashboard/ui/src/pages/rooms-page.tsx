import { useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw, Users } from "lucide-react";

import { useRuntimeSnapshot } from "@/hooks/use-runtime-snapshot";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function RoomsPage() {
  const {
    data: runtimeSummary,
    error: runtimeError,
    isLoading,
    refresh,
  } = useRuntimeSnapshot({ intervalMs: 3_000 });

  const [query, setQuery] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const roomList = useMemo(() => runtimeSummary?.rooms ?? [], [runtimeSummary]);
  const summaryConnectedSessions = useMemo(
    () => new Set(runtimeSummary?.connected_sessions ?? []),
    [runtimeSummary],
  );
  const filteredRooms = useMemo(
    () =>
      roomList.filter(
        (room) =>
          room.id.toLowerCase().includes(query.toLowerCase()) ||
          room.room_type.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, roomList],
  );

  useEffect(() => {
    if (selectedRoomId && roomList.some((room) => room.id === selectedRoomId)) {
      return;
    }
    setSelectedRoomId(roomList[0]?.id ?? "");
  }, [roomList, selectedRoomId]);

  const { data: selectedRoomSnapshot, error: selectedRoomError } =
    useRuntimeSnapshot({
      intervalMs: 5_000,
      enabled: Boolean(selectedRoomId),
      roomId: selectedRoomId,
      includeState: true,
    });

  const selectedRoomSummary =
    roomList.find((room) => room.id === selectedRoomId) ?? null;
  const selectedRoom = selectedRoomSnapshot?.rooms[0] ?? selectedRoomSummary;
  const selectedSnapshot = selectedRoomSnapshot ?? runtimeSummary;
  const selectedConnectedSessions = useMemo(
    () => new Set(selectedSnapshot?.connected_sessions ?? []),
    [selectedSnapshot],
  );
  const selectedSuspendedSessions = useMemo(
    () =>
      new Set(
        (selectedSnapshot?.suspended_sessions ?? []).map(
          (session) => session.session_id,
        ),
      ),
    [selectedSnapshot],
  );

  return (
    <div className="grid gap-4 px-4 py-4 md:grid-cols-[340px_minmax(0,1fr)] md:gap-6 md:py-6 lg:px-6">
      <Card className="border-border/80 bg-card/85 backdrop-blur">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Rooms</CardTitle>
            <Button size="sm" variant="outline" onClick={() => void refresh()}>
              <RefreshCcw
                className={isLoading ? "size-3.5 animate-spin" : "size-3.5"}
              />
              Refresh
            </Button>
          </div>
          <Input
            placeholder="Search room id or type"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {runtimeError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
              {runtimeError}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredRooms.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-sm text-muted-foreground">
              No rooms currently active.
            </p>
          ) : (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  selectedRoomId === room.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {room.room_type}
                  </p>
                  <Badge variant="secondary">
                    <Users className="mr-1 size-3.5" />
                    {
                      room.members.filter((member) =>
                        summaryConnectedSessions.has(member),
                      ).length
                    }
                    /{room.member_count}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {room.id}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Last activity {formatDateTime(room.last_activity_at)}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/85 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="size-4" />
            Room State Inspector
          </CardTitle>
          {selectedRoomError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
              {selectedRoomError}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {!selectedRoom ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-10 text-center text-sm text-muted-foreground">
              {selectedRoomId
                ? "Selected room has no snapshot yet. Retrying..."
                : "Select a room to inspect current state and membership."}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs uppercase text-muted-foreground">
                    Room type
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedRoom.room_type}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs uppercase text-muted-foreground">
                    Members
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedRoom.member_count}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs uppercase text-muted-foreground">
                    Last tick
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDateTime(selectedRoom.last_tick_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/90">
                  Current members
                </p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <Badge className="border border-primary/40 bg-primary/10 text-primary">
                    Connected
                  </Badge>
                  <Badge className="border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                    Parked
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRoom.members.length === 0 ? (
                    <Badge variant="outline">No member</Badge>
                  ) : (
                    selectedRoom.members.map((member) => {
                      const isConnected = selectedConnectedSessions.has(member);
                      const isParked = selectedSuspendedSessions.has(member);
                      return (
                        <Badge
                          key={member}
                          className={
                            isConnected
                              ? "border border-primary/40 bg-primary/10 text-primary"
                              : isParked
                                ? "border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                : "border border-border bg-muted text-muted-foreground"
                          }
                        >
                          {member}
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground/90">
                  Room state JSON
                </p>
                <pre className="max-h-[480px] overflow-auto rounded-lg border border-border bg-slate-950 p-3 font-mono text-xs text-emerald-200">
                  {JSON.stringify(selectedRoom.state ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
