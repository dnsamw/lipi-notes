"use client";

import { useState, useCallback } from "react";
import { db } from "@/lib/db/dexie";

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  folderId: string | null;
  wordCount: number;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const notes = await db.notes.where("isTrashed").equals(0).toArray();
      const lower = query.toLowerCase();

      const matched: SearchResult[] = [];
      for (const note of notes) {
        const titleMatch = note.titlePlain.toLowerCase().includes(lower);
        const contentMatch = note.contentPlain.toLowerCase().includes(lower);

        if (titleMatch || contentMatch) {
          let snippet = "";
          if (contentMatch) {
            const idx = note.contentPlain.toLowerCase().indexOf(lower);
            const start = Math.max(0, idx - 60);
            const end = Math.min(note.contentPlain.length, idx + query.length + 60);
            snippet = (start > 0 ? "…" : "") + note.contentPlain.slice(start, end) + (end < note.contentPlain.length ? "…" : "");
          }

          matched.push({
            id: note.id,
            title: note.titlePlain,
            snippet,
            folderId: note.folderId,
            wordCount: note.wordCount,
          });
        }
      }

      setResults(matched);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, search, isSearching };
}
