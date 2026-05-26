"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Trash2, Settings } from "lucide-react";
import { useUIStore } from "@/lib/store/uiStore";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Notes" },
  { href: null, icon: Search, label: "Search", action: "search" },
  { href: "/trash", icon: Trash2, label: "Trash" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setSearchOpen } = useUIStore();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(10,10,11,0.95)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex">
        {NAV.map(({ href, icon: Icon, label, action }) => {
          const active = href
            ? pathname === href || pathname.startsWith(href + "/")
            : false;

          if (action === "search") {
            return (
              <button
                key={label}
                onClick={() => setSearchOpen(true)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
                style={{ color: "#6b6862" }}
              >
                <Icon size={20} />
                <span style={{ fontSize: "0.6rem" }}>{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href!}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? "#c9a84c" : "#6b6862" }}
            >
              <Icon size={20} />
              <span style={{ fontSize: "0.6rem" }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
