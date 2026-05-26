"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderIcon } from "./FolderIcon";
import { ContextMenu, type ContextMenuAction } from "./ContextMenu";
import { Pencil, Move, Lock as LockIcon, Palette, Trash2, Unlock } from "lucide-react";
import type { Folder } from "@/lib/hooks/useFolders";

interface FolderItemProps {
  folder: Folder;
  onOpen: () => void;
  onRename: () => void;
  onSetPassword: () => void;
  onDelete: () => void;
  onChangeAppearance: () => void;
}

const LONG_PRESS_DURATION = 500;

export function FolderItem({
  folder,
  onOpen,
  onRename,
  onSetPassword,
  onDelete,
  onChangeAppearance,
}: FolderItemProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

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
      icon: <ChevronRight size={14} />,
      onClick: onOpen,
    },
    {
      label: "Rename",
      icon: <Pencil size={14} />,
      onClick: onRename,
      separator: true,
    },
    {
      label: "Change appearance",
      icon: <Palette size={14} />,
      onClick: onChangeAppearance,
    },
    {
      label: folder.hasPassword ? "Change password" : "Set password",
      icon: folder.hasPassword ? <Unlock size={14} /> : <LockIcon size={14} />,
      onClick: onSetPassword,
    },
    {
      label: "Delete folder",
      icon: <Trash2 size={14} />,
      onClick: onDelete,
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
        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all select-none"
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
        aria-label={`Open folder ${folder.name}`}
      >
        {/* Drag handle */}
        <div
          {...listeners}
          className="opacity-0 group-hover:opacity-30 transition-opacity cursor-grab active:cursor-grabbing flex-shrink-0"
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

        <FolderIcon icon={folder.icon} color={folder.color} size={18} />

        <span
          className="flex-1 truncate text-sm"
          style={{ color: "#f0ede6", fontWeight: 450 }}
        >
          {folder.name}
        </span>

        <div className="flex items-center gap-1.5">
          {folder.hasPassword && (
            <Lock size={12} style={{ color: "#6b6862" }} />
          )}
          <ChevronRight
            size={14}
            style={{ color: "#6b6862" }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
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
