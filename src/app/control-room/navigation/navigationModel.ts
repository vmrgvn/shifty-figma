import { CalendarDays, Gauge, Settings, UsersRound, type LucideIcon } from "lucide-react";

export type NavigationItemId = "overview" | "schedules" | "wishes" | "settings";

export interface NavigationItemDefinition {
  id: NavigationItemId;
  label: string;
  accessibleLabel: string;
  path: string;
  Icon: LucideIcon;
  matches: (pathname: string) => boolean;
}

export const primaryNavigation: readonly NavigationItemDefinition[] = [
  {
    id: "overview",
    label: "Обзор",
    accessibleLabel: "Обзор",
    path: "/app",
    Icon: Gauge,
    matches: pathname => pathname === "/app",
  },
  {
    id: "schedules",
    label: "Расписания",
    accessibleLabel: "Расписания",
    path: "/app/schedules",
    Icon: CalendarDays,
    matches: pathname => pathname === "/app/schedules" || pathname.startsWith("/app/schedules/"),
  },
  {
    id: "wishes",
    label: "Пожелания",
    accessibleLabel: "Пожелания",
    path: "/app/wishes",
    Icon: UsersRound,
    matches: pathname => pathname === "/app/wishes" || pathname.startsWith("/app/wishes/"),
  },
  {
    id: "settings",
    label: "Настройки",
    accessibleLabel: "Настройки",
    path: "/app/settings",
    Icon: Settings,
    matches: pathname => pathname === "/app/settings" || pathname.startsWith("/app/settings/"),
  },
] as const;

export function activeNavigationItem(pathname: string): NavigationItemDefinition {
  return primaryNavigation.find(item => item.matches(pathname)) ?? primaryNavigation[0];
}

