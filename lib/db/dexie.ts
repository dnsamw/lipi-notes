import Dexie, { type Table } from "dexie";

export interface CachedNote {
  id: string;
  titlePlain: string;
  contentPlain: string;
  folderId: string | null;
  wordCount: number;
  updatedAt: number;
  isNovel: boolean;
  language: string;
  isTrashed: boolean;
}

export interface CachedFolder {
  id: string;
  name: string;
  parentId: string | null;
  icon: string;
  color: string;
  hasPassword: boolean;
  order: number;
}

export interface CachedTag {
  id: string;
  name: string;
  color: string;
}

export interface SyncQueueItem {
  id?: number;
  type: "CREATE_NOTE" | "UPDATE_NOTE" | "DELETE_NOTE" | "CREATE_FOLDER" | "UPDATE_FOLDER" | "DELETE_FOLDER";
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
}

class LipiNotesDB extends Dexie {
  notes!: Table<CachedNote>;
  folders!: Table<CachedFolder>;
  tags!: Table<CachedTag>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("lipinotes");
    this.version(1).stores({
      notes: "id, folderId, updatedAt, isTrashed",
      folders: "id, parentId",
      tags: "id",
      syncQueue: "++id, type, createdAt",
    });
  }
}

export const db = new LipiNotesDB();
