import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { shortId } from "@/lib/format";

export type RoomTableRow = {
  id: string;
  roomType: string;
  members: number;
  lastActivity: string;
};

export function DataTable({ data }: { data: RoomTableRow[] }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur lg:p-6">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">Room Activity</h3>
        <p className="text-sm text-muted-foreground">
          Live room list with member counts and recent activity.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Last Activity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {shortId(row.id)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{row.roomType}</Badge>
              </TableCell>
              <TableCell>{row.members}</TableCell>
              <TableCell>{row.lastActivity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
