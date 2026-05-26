"use client";

import { useState, useEffect } from "react";
import { Trash2, RotateCcw, X, FileText } from "lucide-react";
import { useKeyStore } from "@/lib/store/keyStore";
import { decrypt } from "@/lib/crypto";

interface TrashedNote {
  id: string;
  titleBlob: string;
  titleIv: string;
  folderId: string | null;
  wordCount: number;
  trashedAt: string;
}

export function TrashBin() {
  const [notes, setNotes] = useState<TrashedNote[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { masterKey } = useKeyStore();

  useEffect(() => {
    fetch("/api/trash")
      .then((r) => r.json())
      .then((data) => {
        setNotes(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!masterKey || notes.length === 0) return;
    async function decryptTitles() {
      const map: Record<string, string> = {};
      for (const note of notes) {
        try {
          map[note.id] = await decrypt(note.titleBlob, note.titleIv, masterKey!);
        } catch {
          map[note.id] = "⚠ Encrypted note";
        }
      }
      setTitles(map);
    }
    decryptTitles();
  }, [notes, masterKey]);

  async function handleAction(action: "restore" | "delete", ids?: string[]) {
    const targetIds = ids ?? Array.from(selected);
    if (targetIds.length === 0) return;

    if (action === "delete") {
      if (!confirm(`Permanently delete ${targetIds.length} note(s)? This cannot be undone.`)) return;
    }

    await fetch("/api/trash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, noteIds: targetIds }),
    });

    setNotes((prev) => prev.filter((n) => !targetIds.includes(n.id)));
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(201,168,76,0.4)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Trash2 size={18} style={{ color: "#a09d97" }} />
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif", color: "#f0ede6" }}
          >
            Trash
          </h1>
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction("restore")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "rgba(82,168,120,0.1)", color: "#52a878", border: "1px solid rgba(82,168,120,0.2)" }}
            >
              <RotateCcw size={12} />
              Restore ({selected.size})
            </button>
            <button
              onClick={() => handleAction("delete")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "rgba(224,82,82,0.1)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)" }}
            >
              <X size={12} />
              Delete ({selected.size})
            </button>
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-16">
          <Trash2 size={32} style={{ color: "#3a3830", margin: "0 auto 12px" }} />
          <p className="text-sm" style={{ color: "#6b6862" }}>Trash is empty</p>
          <p className="text-xs mt-1" style={{ color: "#3a3830" }}>
            Notes are permanently deleted after 30 days
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
              style={{
                background: selected.has(note.id) ? "rgba(201,168,76,0.06)" : "transparent",
                border: `1px solid ${selected.has(note.id) ? "rgba(201,168,76,0.15)" : "transparent"}`,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(note.id)}
                onChange={() => toggleSelect(note.id)}
                className="accent-amber-500"
                style={{ accentColor: "#c9a84c" }}
              />
              <FileText size={15} style={{ color: "#a09d97", flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: "#f0ede6" }}>
                  {titles[note.id] ?? "…"}
                </p>
                <p className="text-xs" style={{ color: "#6b6862" }}>
                  Trashed {new Date(note.trashedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAction("restore", [note.id])}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "#6b6862" }}
                  title="Restore"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#52a878"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6862"; }}
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => handleAction("delete", [note.id])}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "#6b6862" }}
                  title="Delete permanently"
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e05252"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6862"; }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
