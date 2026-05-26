"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  Trash2,
  Settings,
  Search,
  LogOut,
  Lock,
} from "lucide-react";
import Image from "next/image";
import { useUIStore } from "@/lib/store/uiStore";
import { useKeyStore } from "@/lib/store/keyStore";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Notes" },
  { href: "/trash", icon: Trash2, label: "Trash" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  session: Session;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const { setSearchOpen } = useUIStore();
  const { clearAll } = useKeyStore();

  async function handleSignOut() {
    clearAll();
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <aside
      className="w-56 flex flex-col h-dvh sticky top-0"
      style={{
        background: "#0a0a0b",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.2)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path d="M6 22 L14 4 L22 22" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8.5 16 H19.5" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <span
            className="font-semibold text-base"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              color: "#f0ede6",
            }}
          >
            LipiNotes
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 mb-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#6b6862",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          }}
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search…</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.65rem",
            }}
          >
            ⌘K
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "rgba(255,255,255,0.06)" : "transparent",
                color: active ? "#f0ede6" : "#a09d97",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = "#f0ede6";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = "#a09d97";
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div
        className="p-3 mx-3 mb-4 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
              style={{ background: "#c9a84c", color: "#0f0f10" }}
            >
              {session.user?.name?.[0] ?? "U"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "#f0ede6" }}>
              {session.user?.name}
            </p>
            <p className="text-xs truncate" style={{ color: "#6b6862" }}>
              {session.user?.email}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => useKeyStore.getState().clearAll()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#6b6862",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            title="Lock all notes"
          >
            <Lock size={11} />
            Lock
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#6b6862",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <LogOut size={11} />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
