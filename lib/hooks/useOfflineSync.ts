"use client";

import { useEffect, useCallback } from "react";
import { db } from "@/lib/db/dexie";

export function useOfflineSync() {
  const replayQueue = useCallback(async () => {
    const queue = await db.syncQueue.orderBy("createdAt").toArray();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        let url = "";
        let method = "POST";

        switch (item.type) {
          case "CREATE_NOTE":
            url = "/api/notes";
            method = "POST";
            break;
          case "UPDATE_NOTE":
            url = `/api/notes/${(item.payload as { id: string }).id}`;
            method = "PUT";
            break;
          case "DELETE_NOTE":
            url = `/api/notes/${(item.payload as { id: string }).id}`;
            method = "DELETE";
            break;
          case "CREATE_FOLDER":
            url = "/api/folders";
            method = "POST";
            break;
          case "UPDATE_FOLDER":
            url = `/api/folders/${(item.payload as { id: string }).id}`;
            method = "PUT";
            break;
          case "DELETE_FOLDER":
            url = `/api/folders/${(item.payload as { id: string }).id}`;
            method = "DELETE";
            break;
        }

        const res = await fetch(url, {
          method,
          headers: method !== "DELETE" ? { "Content-Type": "application/json" } : undefined,
          body: method !== "DELETE" ? JSON.stringify(item.payload) : undefined,
        });

        if (res.ok && item.id != null) {
          await db.syncQueue.delete(item.id);
        }
      } catch {
        // Will retry next time
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => replayQueue();
    window.addEventListener("online", handleOnline);

    if (navigator.onLine) {
      replayQueue();
    }

    return () => window.removeEventListener("online", handleOnline);
  }, [replayQueue]);

  return { replayQueue };
}
