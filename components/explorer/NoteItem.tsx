"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FileText, BookOpen, Lock, Trash2, Tag, Move } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ContextMenu, type ContextMenuAction } from "./ContextMenu";
import { decrypt } from "@/lib/crypto";
import { useKeyStore } from "@/lib/store/keyStore";
import type { NoteListItem } from "@/lib/hooks/useNote";
import { formatDistanceToNow } from "@/lib/utils";

interface NoteItemProps {
  note: NoteListItem;
  onOpen: () => void;
  onTrash: () => void;
  onSetPassword: () => void;
  onManageTags: () => void;
  onMove: () => void;
}

const LONG_PRESS_DURATION = 500;

export function NoteItem({
  note,
  onOpen,
  onTrash,
  onSetPassword,
  onManageTags,
  onMove,
}: NoteItemProps) {
  const [decryptedTitle, setDecryptedTitle] = useState<string>("…");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { masterKey } = useKeyStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (!masterKey) return;
    decrypt(note.titleBlob, note.titleIv, masterKey)
      .then(setDecryptedTitle)
      .catch(() => setDecryptedTitle("⚠ Could not decrypt"));
  }, [note.titleBlob, note.titleIv, masterKey]);

  const openContextMenu = useCallback((x: number, y: number) => {
    setContextMenu({ x, y });
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      openContextMenu(touch.clientX, touch.clientY);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const actions: ContextMenuAction[] = [
    {
      label: "Open",
      icon: <FileText size={14} />,
      onClick: onOpen,
    },
    {
      label: "Move to…",
      icon: <Move size={14} />,
      onClick: onMove,
      separator: true,
    },
    {
      label: "Manage tags",
      icon: <Tag size={14} />,
      onClick: onManageTags,
    },
    {
      label: note.hasPassword ? "Change password" : "Set password",
      icon: <Lock size={14} />,
      onClick: onSetPassword,
    },
    {
      label: "Move to trash",
      icon: <Trash2 size={14} />,
      onClick: onTrash,
      danger: true,
      separator: true,
    },
  ];

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="group flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all select-none"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
        onClick={onOpen}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        role="button"
      >
        {/* Drag handle */}
        <div
          {...listeners}
          className="opacity-0 group-hover:opacity-30 transition-opacity cursor-grab mt-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="8" height="16" viewBox="0 0 8 16" fill="currentColor" style={{ color: "#f0ede6" }}>
            <circle cx="2" cy="4" r="1.5" />
            <circle cx="6" cy="4" r="1.5" />
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="6" cy="8" r="1.5" />
            <circle cx="2" cy="12" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
          </svg>
        </div>

        <div className="mt-0.5 flex-shrink-0">
          {note.isNovel ? (
            <BookOpen size={16} style={{ color: "#c9a84c", opacity: 0.8 }} />
          ) : (
            <FileText size={16} style={{ color: "#a09d97" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="truncate text-sm"
              style={{ color: "#f0ede6", fontWeight: 450 }}
            >
              {decryptedTitle}
            </span>
            {note.hasPassword && (
              <Lock size={10} style={{ color: "#6b6862", flexShrink: 0 }} />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: "#6b6862" }}>
              {note.wordCount > 0 ? `${note.wordCount.toLocaleString()} words` : "Empty"}
            </span>
            <span style={{ color: "#3a3830" }}>·</span>
            <span className="text-xs" style={{ color: "#6b6862" }}>
              {formatDistanceToNow(new Date(note.updatedAt))}
            </span>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={actions}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
