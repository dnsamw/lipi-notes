"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { Chapter } from "./NovelProject";

interface ChapterItemProps {
  chapter: Chapter;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function ChapterItem({
  chapter,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ChapterItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function handleRename() {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all cursor-pointer"
      onClick={!editing ? onSelect : undefined}
      style={{
        ...style,
        background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
        borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent",
      }}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        className="opacity-0 group-hover:opacity-40 cursor-grab transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ color: "#f0ede6" }}>
          <circle cx="2" cy="3" r="1.2" />
          <circle cx="6" cy="3" r="1.2" />
          <circle cx="2" cy="6" r="1.2" />
          <circle cx="6" cy="6" r="1.2" />
          <circle cx="2" cy="9" r="1.2" />
          <circle cx="6" cy="9" r="1.2" />
        </svg>
      </div>

      {editing ? (
        <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setEditTitle(chapter.title);
                setEditing(false);
              }
            }}
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#f0ede6" }}
          />
          <button onClick={handleRename} style={{ color: "#52a878" }}>
            <Check size={13} />
          </button>
          <button
            onClick={() => {
              setEditTitle(chapter.title);
              setEditing(false);
            }}
            style={{ color: "#6b6862" }}
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <>
          <span
            className="flex-1 truncate text-sm"
            style={{ color: isActive ? "#c9a84c" : "#f0ede6" }}
          >
            {chapter.title}
          </span>
          <span className="text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#6b6862" }}>
            {chapter.wordCount > 0 ? `${chapter.wordCount}w` : ""}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              style={{ color: "#6b6862" }}
              className="transition-colors hover:text-white"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ color: "#6b6862" }}
              className="transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e05252"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6862"; }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
