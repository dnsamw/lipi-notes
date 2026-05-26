"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface NoteListItem {
  id: string;
  titleBlob: string;
  titleIv: string;
  folderId: string | null;
  isNovel: boolean;
  hasPassword: boolean;
  language: string;
  wordCount: number;
  order: number;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: { id: string; name: string; color: string } }>;
}

export interface Note extends NoteListItem {
  contentBlob: string;
  contentIv: string;
  passwordHash?: string | null;
  chapters?: Array<{
    id: string;
    title: string;
    contentBlob: string;
    contentIv: string;
    order: number;
    wordCount: number;
  }>;
}

export function useNotes(folderId?: string | null, includeTrashed = false) {
  return useQuery<NoteListItem[]>({
    queryKey: ["notes", folderId ?? "root", includeTrashed],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", folderId);
      if (includeTrashed) params.set("trashed", "true");
      const res = await fetch(`/api/notes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useNote(id: string) {
  return useQuery<Note>({
    queryKey: ["note", id],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${id}`);
      if (!res.ok) throw new Error("Failed to fetch note");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      titleBlob: string;
      titleIv: string;
      contentBlob: string;
      contentIv: string;
      folderId?: string | null;
      language?: string;
      isNovel?: boolean;
    }) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create note");
      return res.json() as Promise<Note>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      titleBlob?: string;
      titleIv?: string;
      contentBlob?: string;
      contentIv?: string;
      wordCount?: number;
      language?: string;
      folderId?: string | null;
      hasPassword?: boolean;
      passwordHash?: string | null;
      isTrashed?: boolean;
      trashedAt?: string | null;
      isNovel?: boolean;
      order?: number;
    }) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["note", vars.id] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}
