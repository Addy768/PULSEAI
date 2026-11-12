"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Bot, Boxes, LayoutDashboard, MapPin, Settings, Siren } from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/incidents", label: "Incidents", icon: Siren },
  { href: "/app/assets", label: "Assets", icon: Boxes },
  { href: "/app/copilot", label: "AI Copilot", icon: Bot },
  { href: "/app/locations", label: "Locations", icon: MapPin },
  { href: "/app/admin", label: "Admin", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-ink-900 md:flex">
      <Link href="/" className="flex h-14 items-center border-b border-line px-5">
        <Logo size={24} />
      </Link>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/app" ? path === "/app" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-accent/10 text-white" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200",
              )}
            >
              <Icon size={16} className={active ? "text-accent" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <p className="label text-[10px]">Environment</p>
        <p className="mt-1 font-mono text-xs text-slate-300">Demo dataset · 50 sites</p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-ink-900 px-3 py-2 md:hidden">
      {NAV.map(({ href, label }) => {
        const active = href === "/app" ? path === "/app" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx("whitespace-nowrap rounded-md px-3 py-1.5 text-xs", active ? "bg-accent/15 text-white" : "text-slate-400")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
