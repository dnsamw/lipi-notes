"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Tag } from "lucide-react";

const TAG_COLORS = [
  { name: "amber", hex: "#c9a84c" },
  { name: "blue", hex: "#5b8dee" },
  { name: "green", hex: "#52a878" },
  { name: "red", hex: "#e05252" },
  { name: "purple", hex: "#9b6ee0" },
  { name: "pink", hex: "#e06eaa" },
];

const COLOR_MAP: Record<string, string> = Object.fromEntries(
  TAG_COLORS.map((c) => [c.name, c.hex])
);

interface TagData {
  id: string;
  name: string;
  color: string;
  _count: { notes: number };
}

export function TagManager() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("amber");

  const { data: tags = [] } = useQuery<TagData[]>({
    queryKey: ["tags"],
    queryFn: () => fetch("/api/tags").then((r) => r.json()),
  });

  const createTag = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) return;
      await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      setNewName("");
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/tags?id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });

  return (
    <div>
      <h3
        className="text-sm font-medium mb-4"
        style={{ color: "#f0ede6" }}
      >
        Tags
      </h3>

      {/* Create new tag */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="New tag name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createTag.mutate()}
          className="flex-1 rounded-lg px-3 py-2 text-sm focus-ring"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#f0ede6",
            outline: "none",
          }}
        />
        <div className="flex gap-1">
          {TAG_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => setNewColor(c.name)}
              className="w-5 h-5 rounded-full transition-all"
              style={{
                background: c.hex,
                outline: newColor === c.name ? `2px solid ${c.hex}` : "none",
                outlineOffset: "2px",
                opacity: newColor === c.name ? 1 : 0.4,
              }}
            />
          ))}
        </div>
        <button
          onClick={() => createTag.mutate()}
          disabled={!newName.trim()}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: "rgba(201,168,76,0.1)",
            color: "#c9a84c",
            border: "1px solid rgba(201,168,76,0.25)",
            opacity: newName.trim() ? 1 : 0.5,
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Tags list */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
            style={{
              background: `${COLOR_MAP[tag.color] ?? "#c9a84c"}15`,
              border: `1px solid ${COLOR_MAP[tag.color] ?? "#c9a84c"}30`,
              color: COLOR_MAP[tag.color] ?? "#c9a84c",
            }}
          >
            <Tag size={11} />
            {tag.name}
            {tag._count.notes > 0 && (
              <span className="text-xs opacity-60">({tag._count.notes})</span>
            )}
            <button
              onClick={() => deleteTag.mutate(tag.id)}
              className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-sm" style={{ color: "#6b6862" }}>
            No tags yet. Create one above.
          </p>
        )}
      </div>
    </div>
  );
}
