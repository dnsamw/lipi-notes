"use client";

import { useEffect, useRef } from "react";
import {
  Pencil,
  Move,
  Lock,
  Palette,
  Trash2,
  FolderOpen,
  BookOpen,
  Unlock,
} from "lucide-react";

export interface ContextMenuAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - actions.length * 40 - 16);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-xl py-1.5 animate-fade-in"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: "#1a1a1e",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {actions.map((action, i) => (
        <div key={i}>
          {action.separator && i > 0 && (
            <div
              className="mx-3 my-1"
              style={{ height: 1, background: "rgba(255,255,255,0.06)" }}
            />
          )}
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors"
            style={{
              color: action.danger ? "#e05252" : "#f0ede6",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = action.danger
                ? "rgba(224,82,82,0.1)"
                : "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ opacity: 0.7 }}>{action.icon}</span>
            {action.label}
          </button>
        </div>
      ))}
    </div>
  );
}

export { Pencil, Move, Lock, Palette, Trash2, FolderOpen, BookOpen, Unlock };
