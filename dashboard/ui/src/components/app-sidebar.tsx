import {
  KeyRound,
  LayoutDashboard,
  LogOut,
  Network,
  PanelLeft,
  Users2,
} from "lucide-react";

import type { DashboardRoute } from "@/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems: Array<{
  key: DashboardRoute;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "rooms", label: "Rooms", icon: Network },
  { key: "connections", label: "Connections", icon: Users2 },
  { key: "control", label: "Control Plane", icon: KeyRound },
];

export function AppSidebar({
  variant = "inset",
  currentRoute,
  onNavigate,
  onLogout,
}: {
  variant?: "inset";
  currentRoute: DashboardRoute;
  onNavigate: (route: DashboardRoute) => void;
  onLogout: () => void;
}) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar variant={variant} collapsible="icon">
      <SidebarHeader className="h-(--header-height) justify-center border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => onNavigate("overview")}
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Network className="size-4" />
            </div>
            {!collapsed ? <span>Nexis Ops</span> : null}
          </button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={toggleSidebar}
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={currentRoute === item.key}
                      onClick={() => onNavigate(item.key)}
                      tooltip={item.label}
                      className={cn("font-medium")}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Sign out">
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
