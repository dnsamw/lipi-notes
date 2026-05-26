"use client";

import { useEffect, useState } from "react";
import { X, RotateCcw, Eye } from "lucide-react";
import { useKeyStore } from "@/lib/store/keyStore";
import { decrypt } from "@/lib/crypto";

interface NoteVersion {
  id: string;
  noteId: string;
  contentBlob: string;
  contentIv: string;
  createdAt: string;
}

interface VersionHistoryProps {
  noteId: string;
  onClose: () => void;
  onRestore: (contentBlob: string, contentIv: string) => Promise<void>;
}

export function VersionHistory({ noteId, onClose, onRestore }: VersionHistoryProps) {
  const { masterKey, getSubKey } = useKeyStore();
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ id: string; content: string } | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/notes/${noteId}/versions`)
      .then((r) => r.json())
      .then((v) => {
        setVersions(v);
        setLoading(false);
      });
  }, [noteId]);

  async function handlePreview(version: NoteVersion) {
    const key = getSubKey(noteId) ?? masterKey;
    if (!key) return;
    const content = await decrypt(version.contentBlob, version.contentIv, key);
    setPreview({ id: version.id, content });
  }

  async function handleRestore(version: NoteVersion) {
    setRestoring(version.id);
    await onRestore(version.contentBlob, version.contentIv);
    setRestoring(null);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-xs animate-slide-in-right"
        style={{
          background: "#161618",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3
            className="font-semibold text-sm"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              color: "#f0ede6",
            }}
          >
            Version history
          </h3>
          <button onClick={onClose} style={{ color: "#6b6862" }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(201,168,76,0.4)", borderTopColor: "transparent" }}
            />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex items-center justify-center flex-1 px-6 text-center">
            <p className="text-sm" style={{ color: "#6b6862" }}>
              No saved versions yet. Versions are saved every 10 auto-saves.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {versions.map((v) => (
              <div
                key={v.id}
                className="px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: "#a09d97" }}>
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                </div>

                {preview?.id === v.id && (
                  <div
                    className="mt-2 mb-2 p-3 rounded-lg text-xs line-clamp-5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "#a09d97",
                      lineHeight: 1.6,
                    }}
                  >
                    {preview.content.slice(0, 300)}
                    {preview.content.length > 300 && "…"}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      preview?.id === v.id ? setPreview(null) : handlePreview(v)
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "#6b6862",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Eye size={11} />
                    {preview?.id === v.id ? "Hide" : "Preview"}
                  </button>
                  <button
                    onClick={() => handleRestore(v)}
                    disabled={restoring === v.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                    style={{
                      background: "rgba(201,168,76,0.08)",
                      color: "#c9a84c",
                      border: "1px solid rgba(201,168,76,0.2)",
                    }}
                  >
                    <RotateCcw size={11} />
                    {restoring === v.id ? "Restoring…" : "Restore"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
