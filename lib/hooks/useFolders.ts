"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
  hasPassword: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function useFolders(parentId?: string | null) {
  return useQuery<Folder[]>({
    queryKey: ["folders", parentId ?? "root"],
    queryFn: async () => {
      const url = parentId
        ? `/api/folders?parentId=${parentId}`
        : "/api/folders";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      icon?: string;
      color?: string;
      parentId?: string | null;
    }) => {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      icon?: string;
      color?: string;
      parentId?: string | null;
      hasPassword?: boolean;
      passwordHash?: string | null;
      order?: number;
    }) => {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update folder");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete folder");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["folders"] }),
  });
}
