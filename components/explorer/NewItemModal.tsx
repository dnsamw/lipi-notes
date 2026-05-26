"use client";

import { useState } from "react";
import { X, FileText, Folder } from "lucide-react";
import { FolderIcon } from "./FolderIcon";

const FOLDER_ICONS = ["folder", "book", "lock", "star", "archive"] as const;
const FOLDER_COLORS = [
  { name: "default", hex: "#c9a84c" },
  { name: "blue", hex: "#5b8dee" },
  { name: "green", hex: "#52a878" },
  { name: "red", hex: "#e05252" },
  { name: "purple", hex: "#9b6ee0" },
  { name: "pink", hex: "#e06eaa" },
];

interface NewItemModalProps {
  type: "note" | "folder";
  parentId?: string | null;
  onConfirm: (data: {
    name: string;
    icon?: string;
    color?: string;
    isNovel?: boolean;
  }) => void;
  onCancel: () => void;
}

export function NewItemModal({ type, onConfirm, onCancel }: NewItemModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const [color, setColor] = useState("default");
  const [isNovel, setIsNovel] = useState(false);
  const [error, setError] = useState("");

  function handleConfirm() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    onConfirm({ name: name.trim(), icon, color, isNovel });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full sm:max-w-[420px] rounded-t-2xl sm:rounded-2xl p-6 animate-slide-in-up"
        style={{
          background: "#161618",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {type === "folder" ? (
              <Folder size={16} style={{ color: "#c9a84c" }} />
            ) : (
              <FileText size={16} style={{ color: "#c9a84c" }} />
            )}
            <h3
              className="font-semibold"
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                color: "#f0ede6",
              }}
            >
              New {type === "folder" ? "Folder" : "Note"}
            </h3>
          </div>
          <button onClick={onCancel} style={{ color: "#6b6862" }}>
            <X size={18} />
          </button>
        </div>

        <input
          type="text"
          placeholder={type === "folder" ? "Folder name" : "Note title"}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm focus-ring mb-4"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${error ? "rgba(224,82,82,0.4)" : "rgba(255,255,255,0.1)"}`,
            color: "#f0ede6",
            outline: "none",
          }}
        />

        {error && (
          <p className="text-xs mb-3" style={{ color: "#e05252" }}>
            {error}
          </p>
        )}

        {type === "folder" && (
          <div className="mb-4">
            <p className="text-xs mb-2.5" style={{ color: "#6b6862" }}>
              Icon
            </p>
            <div className="flex gap-2 mb-4">
              {FOLDER_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: icon === ic ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${icon === ic ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <FolderIcon icon={ic} color={color} size={16} />
                </button>
              ))}
            </div>

            <p className="text-xs mb-2.5" style={{ color: "#6b6862" }}>
              Color
            </p>
            <div className="flex gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c.hex,
                    outline: color === c.name ? `2px solid ${c.hex}` : "none",
                    outlineOffset: "2px",
                    opacity: color === c.name ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {type === "note" && (
          <button
            onClick={() => setIsNovel((v) => !v)}
            className="flex items-center gap-2.5 w-full rounded-xl px-4 py-3 mb-4 text-sm transition-all"
            style={{
              background: isNovel ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isNovel ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.07)"}`,
              color: isNovel ? "#c9a84c" : "#a09d97",
            }}
          >
            <span
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: isNovel ? "#c9a84c" : "rgba(255,255,255,0.08)",
                border: isNovel ? "none" : "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {isNovel && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#0f0f10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            Novel / chapters mode
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a09d97",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#c9a84c",
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
