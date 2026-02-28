export const dashboardRoutes = [
  "overview",
  "rooms",
  "connections",
  "control",
] as const;

export type DashboardRoute = (typeof dashboardRoutes)[number];

export function isDashboardRoute(value: string): value is DashboardRoute {
  return dashboardRoutes.includes(value as DashboardRoute);
}
