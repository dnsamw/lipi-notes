"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, BookOpen } from "lucide-react";
import { useUIStore } from "@/lib/store/uiStore";
import { useSearch } from "@/lib/hooks/useSearch";

export function SearchModal() {
  const router = useRouter();
  const { setSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const { results, search, isSearching } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  function handleSelect(id: string) {
    router.push(`/note/${id}`);
    setSearchOpen(false);
  }

  function highlight(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={{ background: "rgba(201,168,76,0.3)", color: "#f0ede6", borderRadius: "2px" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl overflow-hidden animate-slide-in-up"
        style={{
          background: "#161618",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Search size={16} style={{ color: "#6b6862", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#f0ede6" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ color: "#6b6862" }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(201,168,76,0.4)", borderTopColor: "transparent" }}
              />
            </div>
          )}

          {!isSearching && results.length === 0 && query && (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: "#6b6862" }}>
                No results for &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {!isSearching && results.length === 0 && !query && (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: "#6b6862" }}>
                Start typing to search your notes
              </p>
            </div>
          )}

          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result.id)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <FileText size={14} style={{ color: "#a09d97", marginTop: 2, flexShrink: 0 }} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "#f0ede6" }}>
                  {highlight(result.title, query)}
                </p>
                {result.snippet && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#6b6862", lineHeight: 1.5 }}>
                    {highlight(result.snippet, query)}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "#3a3830" }}>
                  {result.wordCount} words
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="px-4 py-2.5 flex items-center gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span className="text-xs" style={{ color: "#3a3830" }}>
            <kbd className="px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.6rem" }}>↑↓</kbd> navigate
          </span>
          <span className="text-xs" style={{ color: "#3a3830" }}>
            <kbd className="px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.6rem" }}>↵</kbd> open
          </span>
          <span className="text-xs" style={{ color: "#3a3830" }}>
            <kbd className="px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.6rem" }}>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
