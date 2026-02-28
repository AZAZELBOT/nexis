import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartPoint = {
  label: string;
  value: number;
};

function clampRange(points: ChartPoint[]) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

export function ChartAreaInteractive({
  points,
  title = "Live Connections Trend",
}: {
  points: ChartPoint[];
  title?: string;
}) {
  const viewWidth = 700;
  const viewHeight = 220;
  const padding = 28;

  const chart = useMemo(() => {
    if (points.length === 0) {
      return {
        linePath: "",
        areaPath: "",
      };
    }

    const { min, max } = clampRange(points);
    const width = viewWidth - padding * 2;
    const height = viewHeight - padding * 2;
    const step = points.length > 1 ? width / (points.length - 1) : 0;

    const xy = points.map((point, index) => {
      const x = padding + index * step;
      const ratio = (point.value - min) / (max - min);
      const y = padding + (1 - ratio) * height;
      return { x, y };
    });

    const linePath = xy
      .map((point, index) =>
        index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
      )
      .join(" ");

    const areaPath = [
      linePath,
      `L ${xy[xy.length - 1]?.x ?? 0} ${viewHeight - padding}`,
      `L ${xy[0]?.x ?? 0} ${viewHeight - padding}`,
      "Z",
    ].join(" ");

    return { linePath, areaPath };
  }, [points]);

  return (
    <Card className="border-border/80 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">Waiting for live runtime samples...</p>
        ) : (
          <div className="space-y-2">
            <svg
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              className="h-56 w-full overflow-visible"
            >
              <defs>
                <linearGradient id="connections-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(20 184 166 / 0.45)" />
                  <stop offset="100%" stopColor="rgb(20 184 166 / 0.05)" />
                </linearGradient>
              </defs>
              <path d={chart.areaPath} fill="url(#connections-area)" />
              <path
                d={chart.linePath}
                fill="none"
                stroke="rgb(13 148 136)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
              {points.slice(-4).map((point) => (
                <div key={`${point.label}-${point.value}`} className="rounded-md bg-muted px-2 py-1">
                  <p className="font-semibold text-foreground/90">{point.value}</p>
                  <p>{point.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
