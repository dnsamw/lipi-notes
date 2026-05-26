"use client";

import { useUIStore } from "@/lib/store/uiStore";
import { Minimize2 } from "lucide-react";

// FocusMode overlay — hides chrome. Toggle via uiStore.toggleFocusMode()
export function FocusModeExit() {
  const { toggleFocusMode } = useUIStore();

  return (
    <button
      onClick={toggleFocusMode}
      className="fixed top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity"
      style={{
        background: "rgba(255,255,255,0.06)",
        color: "#6b6862",
      }}
      title="Exit focus mode (Esc)"
    >
      <Minimize2 size={14} />
    </button>
  );
}
