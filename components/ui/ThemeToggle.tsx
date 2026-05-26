"use client";

import { Moon } from "lucide-react";

// LipiNotes is dark-mode only. This component is a placeholder for future light-mode toggle.
export function ThemeToggle() {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#6b6862",
      }}
    >
      <Moon size={14} />
      <span>Dark mode</span>
      <span
        className="ml-auto px-1.5 py-0.5 rounded text-xs"
        style={{
          background: "rgba(201,168,76,0.1)",
          color: "#c9a84c",
          border: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        Default
      </span>
    </div>
  );
}
