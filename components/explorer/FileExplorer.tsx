"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, ChevronRight, Home, FileText, Folder as FolderLucide, X } from "lucide-react";
import { FolderItem } from "./FolderItem";
import { NoteItem } from "./NoteItem";
import { NewItemModal } from "./NewItemModal";
import { PasswordModal } from "./PasswordModal";
import { useFolders, useAllFolders, useCreateFolder, useUpdateFolder, useDeleteFolder, type Folder } from "@/lib/hooks/useFolders";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/lib/hooks/useNote";
import { useKeyStore } from "@/lib/store/keyStore";
import { encrypt, hashPassword, deriveSubKey, verifyPassword } from "@/lib/crypto";
import { db } from "@/lib/db/dexie";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface FileExplorerProps {
  initialFolderId?: string | null;
}

export function FileExplorer({ initialFolderId = null }: FileExplorerProps) {
  const router = useRouter();
  const { masterKey, setSubKey, getSubKey } = useKeyStore();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "Notes" },
  ]);
  const [newItemType, setNewItemType] = useState<"note" | "folder" | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<{
    type: "folder" | "note";
    id: string;
    name: string;
    hash: string;
    action: "unlock" | "set";
  } | null>(null);

  const { data: folders = [], refetch: refetchFolders } = useFolders(currentFolderId);
  const { data: notes = [], refetch: refetchNotes } = useNotes(currentFolderId);
  const { data: allFolders = [] } = useAllFolders(moveTargetId !== null);

  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const navigateToFolder = useCallback(
    (folder: Folder) => {
      const isLocked = folder.hasPassword && !getSubKey(folder.id);
      if (isLocked) {
        setPasswordTarget({
          type: "folder",
          id: folder.id,
          name: folder.name,
          hash: "",
          action: "unlock",
        });
        return;
      }
      setCurrentFolderId(folder.id);
      setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    },
    [getSubKey]
  );

  const navigateToBreadcrumb = (item: BreadcrumbItem) => {
    const idx = breadcrumbs.findIndex((b) => b.id === item.id);
    setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
    setCurrentFolderId(item.id);
  };

  async function handleFolderPasswordUnlock(password: string) {
    if (!passwordTarget || !masterKey) throw new Error("No target");
    // Fetch folder to get hash
    const res = await fetch(`/api/folders?id=${passwordTarget.id}`);
    const foldersData = await res.json();
    const folder = Array.isArray(foldersData)
      ? foldersData.find((f: Folder) => f.id === passwordTarget.id)
      : null;

    // For unlock: verify against server hash
    const serverRes = await fetch(`/api/folders/${passwordTarget.id}`);
    const folderDetail = await serverRes.json();

    if (folderDetail.passwordHash) {
      const ok = await verifyPassword(password, folderDetail.passwordHash);
      if (!ok) throw new Error("Wrong password");
    }

    const subKey = await deriveSubKey(masterKey, password, passwordTarget.id);
    setSubKey(passwordTarget.id, subKey);
    setPasswordTarget(null);

    if (folder) {
      setCurrentFolderId(passwordTarget.id);
      setBreadcrumbs((prev) => [
        ...prev,
        { id: passwordTarget.id, name: passwordTarget.name },
      ]);
    }
  }

  async function handleCreateFolder(data: {
    name: string;
    icon?: string;
    color?: string;
  }) {
    await createFolder.mutateAsync({
      name: data.name,
      icon: data.icon,
      color: data.color,
      parentId: currentFolderId,
    });
    setNewItemType(null);
  }

  async function handleCreateNote(data: { name: string; isNovel?: boolean }) {
    if (!masterKey) return;
    const key = getSubKey(currentFolderId ?? "") ?? masterKey;
    const { blob: titleBlob, iv: titleIv } = await encrypt(data.name, key);
    const { blob: contentBlob, iv: contentIv } = await encrypt("", key);

    const note = await createNote.mutateAsync({
      titleBlob,
      titleIv,
      contentBlob,
      contentIv,
      folderId: currentFolderId,
      isNovel: data.isNovel,
    });

    await db.notes.put({
      id: note.id,
      titlePlain: data.name,
      contentPlain: "",
      folderId: currentFolderId,
      wordCount: 0,
      updatedAt: Date.now(),
      isNovel: data.isNovel ?? false,
      language: "en",
      isTrashed: false,
    });

    setNewItemType(null);

    if (data.isNovel) {
      router.push(`/novel/${note.id}`);
    } else {
      router.push(`/note/${note.id}`);
    }
  }

  async function handleTrashNote(id: string) {
    await updateNote.mutateAsync({
      id,
      isTrashed: true,
      trashedAt: new Date().toISOString(),
    });
  }

  async function handleSetFolderPassword(folderId: string, password: string) {
    if (!masterKey) return;
    const hash = await hashPassword(password);
    await updateFolder.mutateAsync({ id: folderId, hasPassword: true, passwordHash: hash });
    const subKey = await deriveSubKey(masterKey, password, folderId);
    setSubKey(folderId, subKey);
  }

  function handleFoldersDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = folders.findIndex((f) => f.id === active.id);
    const newIndex = folders.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(folders, oldIndex, newIndex);

    reordered.forEach((folder, idx) => {
      updateFolder.mutate({ id: folder.id, order: idx });
    });
  }

  function handleNotesDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notes.findIndex((n) => n.id === active.id);
    const newIndex = notes.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(notes, oldIndex, newIndex);

    reordered.forEach((note, idx) => {
      updateNote.mutate({ id: note.id, order: idx });
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.id ?? "root"} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && (
              <ChevronRight size={12} style={{ color: "#3a3830" }} />
            )}
            <button
              onClick={() => navigateToBreadcrumb(crumb)}
              className="flex items-center gap-1 text-sm transition-colors"
              style={{
                color: i === breadcrumbs.length - 1 ? "#f0ede6" : "#6b6862",
                fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
              }}
            >
              {i === 0 && <Home size={13} />}
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 pb-24">
        {/* Folders */}
        {folders.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFoldersDragEnd}
          >
            <SortableContext
              items={folders.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="mb-2">
                {folders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    onOpen={() => navigateToFolder(folder)}
                    onRename={() => {
                      const name = prompt("Rename folder:", folder.name);
                      if (name?.trim()) {
                        updateFolder.mutate({ id: folder.id, name: name.trim() });
                      }
                    }}
                    onSetPassword={() =>
                      setPasswordTarget({
                        type: "folder",
                        id: folder.id,
                        name: folder.name,
                        hash: "",
                        action: "set",
                      })
                    }
                    onDelete={() => {
                      if (confirm(`Delete "${folder.name}" and all its contents?`)) {
                        deleteFolder.mutate(folder.id);
                      }
                    }}
                    onChangeAppearance={() => {
                      // Handled inline for now
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Notes */}
        {notes.filter((n) => !n.isTrashed).length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleNotesDragEnd}
          >
            <SortableContext
              items={notes.filter((n) => !n.isTrashed).map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              {notes
                .filter((n) => !n.isTrashed)
                .map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onOpen={() =>
                      router.push(note.isNovel ? `/novel/${note.id}` : `/note/${note.id}`)
                    }
                    onTrash={() => handleTrashNote(note.id)}
                    onSetPassword={() =>
                      setPasswordTarget({
                        type: "note",
                        id: note.id,
                        name: "",
                        hash: "",
                        action: "set",
                      })
                    }
                    onManageTags={() => {}}
                    onMove={() => setMoveTargetId(note.id)}
                  />
                ))}
            </SortableContext>
          </DndContext>
        )}

        {/* Empty state */}
        {folders.length === 0 && notes.filter((n) => !n.isTrashed).length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Plus size={20} style={{ color: "#6b6862" }} />
            </div>
            <p className="text-sm" style={{ color: "#6b6862" }}>
              No notes yet
            </p>
            <p className="text-xs mt-1" style={{ color: "#3a3830" }}>
              Tap + to create your first note
            </p>
          </div>
        )}
      </div>

      {/* FAB speed dial */}
      <div className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-30 flex flex-col items-end gap-3">
        {fabOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 -z-10"
              onClick={() => setFabOpen(false)}
            />
            {/* New Folder option */}
            <div className="flex items-center gap-2.5 animate-fade-in">
              <span
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  background: "#161618",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f0ede6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                New Folder
              </span>
              <button
                onClick={() => { setFabOpen(false); setNewItemType("folder"); }}
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
                style={{
                  background: "#1e1e22",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
                aria-label="New folder"
              >
                <FolderLucide size={17} style={{ color: "#c9a84c" }} />
              </button>
            </div>
            {/* New Note option */}
            <div className="flex items-center gap-2.5 animate-fade-in">
              <span
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  background: "#161618",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f0ede6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                New Note
              </span>
              <button
                onClick={() => { setFabOpen(false); setNewItemType("note"); }}
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
                style={{
                  background: "#1e1e22",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
                aria-label="New note"
              >
                <FileText size={17} style={{ color: "#c9a84c" }} />
              </button>
            </div>
          </>
        )}
        {/* Main FAB */}
        <button
          onClick={() => setFabOpen((o) => !o)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95"
          style={{
            background: "#c9a84c",
            boxShadow: "0 4px 20px rgba(201,168,76,0.4)",
          }}
          aria-label="New item"
        >
          <Plus
            size={22}
            style={{
              color: "#0f0f10",
              transform: fabOpen ? "rotate(45deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
      </div>

      {/* Modals */}
      {newItemType && (
        <NewItemModal
          type={newItemType}
          parentId={currentFolderId}
          onConfirm={
            newItemType === "folder"
              ? handleCreateFolder
              : handleCreateNote
          }
          onCancel={() => setNewItemType(null)}
        />
      )}

      {passwordTarget && passwordTarget.action === "unlock" && (
        <PasswordModal
          title={`Unlock "${passwordTarget.name}"`}
          description="Enter the password to access this folder."
          onSubmit={handleFolderPasswordUnlock}
          onCancel={() => setPasswordTarget(null)}
        />
      )}

      {passwordTarget && passwordTarget.action === "set" && (
        <PasswordModal
          title={`Set password`}
          description={`Set a password for this ${passwordTarget.type}.`}
          onSubmit={async (password) => {
            if (passwordTarget.type === "folder") {
              await handleSetFolderPassword(passwordTarget.id, password);
            } else {
              if (!masterKey) return;
              const hash = await hashPassword(password);
              await updateNote.mutateAsync({
                id: passwordTarget.id,
                hasPassword: true,
                passwordHash: hash,
              });
            }
            setPasswordTarget(null);
          }}
          onCancel={() => setPasswordTarget(null)}
        />
      )}

      {/* Move to folder modal */}
      {moveTargetId && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full sm:max-w-[420px] rounded-t-2xl sm:rounded-2xl animate-slide-in-up"
            style={{
              background: "#161618",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h3
                className="font-semibold text-base"
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  color: "#f0ede6",
                }}
              >
                Move to…
              </h3>
              <button onClick={() => setMoveTargetId(null)} style={{ color: "#6b6862" }}>
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-3 pb-5">
              {/* Root option */}
              <button
                onClick={() => {
                  updateNote.mutate({ id: moveTargetId, folderId: null });
                  setMoveTargetId(null);
                  refetchNotes();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{ color: currentFolderId === null ? "#c9a84c" : "#f0ede6" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <Home size={15} style={{ color: "#6b6862" }} />
                <span>Root (no folder)</span>
                {currentFolderId === null && (
                  <span className="ml-auto text-xs" style={{ color: "#c9a84c" }}>current</span>
                )}
              </button>
              {/* All folders */}
              {allFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    updateNote.mutate({ id: moveTargetId, folderId: folder.id });
                    setMoveTargetId(null);
                    refetchNotes();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{ color: folder.id === currentFolderId ? "#c9a84c" : "#f0ede6" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <FolderLucide size={15} style={{ color: "#c9a84c", opacity: 0.7 }} />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  {folder.id === currentFolderId && (
                    <span className="ml-auto text-xs" style={{ color: "#c9a84c" }}>current</span>
                  )}
                </button>
              ))}
              {allFolders.length === 0 && (
                <p className="text-xs px-3 py-4 text-center" style={{ color: "#6b6862" }}>
                  No folders yet — create one first
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
