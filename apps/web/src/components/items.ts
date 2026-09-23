import type { LucideIcon } from "lucide-react";
import {
  CalendarClockIcon,
  CreditCardIcon,
  GaugeIcon,
  MapIcon,
  RouterIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export type MenuItem = { label: string; icon: LucideIcon; href: string; roles?: Role[] };

export const menuItems: MenuItem[] = [
  { label: "Ringkasan", icon: GaugeIcon, href: "/dashboard" },
  { label: "Pelanggan", icon: UsersIcon, href: "/pelanggan" },
  { label: "Perangkat", icon: RouterIcon, href: "/perangkat" },
  { label: "Tagihan", icon: CreditCardIcon, href: "/tagihan" },
  { label: "Jadwal", icon: CalendarClockIcon, href: "/jadwal-pengiriman" },
  { label: "Peta jaringan", icon: MapIcon, href: "/peta" },
  { label: "Administrator", icon: ShieldCheckIcon, href: "/admin", roles: ["super_admin"] },
];
