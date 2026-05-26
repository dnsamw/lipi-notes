"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, ArrowLeft, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChapterItem } from "./ChapterItem";
import { NovelStats } from "./NovelStats";
import { EditorToolbar } from "../editor/EditorToolbar";
import { WordCount } from "../editor/WordCount";
import { useSinhalaIME, SinhalaHintBubble } from "../editor/SinhalaIME";
import { useNote, useUpdateNote } from "@/lib/hooks/useNote";
import { useKeyStore } from "@/lib/store/keyStore";
import { encrypt, decrypt } from "@/lib/crypto";
import { countWords } from "@/lib/utils";

export interface Chapter {
  id: string;
  title: string;
  contentBlob: string;
  contentIv: string;
  order: number;
  wordCount: number;
}

type SaveStatus = "saved" | "saving" | "offline" | "idle";

interface NovelProjectProps {
  noteId: string;
}

export function NovelProject({ noteId }: NovelProjectProps) {
  const router = useRouter();
  const { masterKey, getSubKey } = useKeyStore();
  const { data: note, isLoading } = useNote(noteId);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "si">("en");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [wordCount, setWordCount] = useState(0);

  const updateNote = useUpdateNote();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({ placeholder: "Begin this chapter…" }),
      CharacterCount,
    ],
    content: "",
    editorProps: { attributes: { class: "ProseMirror" } },
    onUpdate: ({ editor }) => {
      setWordCount(countWords(editor.getText()));
      scheduleChapterSave(editor.getHTML());
    },
  });

  const { bubble } = useSinhalaIME(editor, language === "si");

  // Load chapters from note
  useEffect(() => {
    if (!note?.chapters || note.chapters.length === 0) return;
    const chaps = note.chapters as Chapter[];
    setChapters(chaps);
    if (!activeChapterId) {
      setActiveChapterId(chaps[0].id);
    }
  }, [note?.chapters]);

  // Load active chapter content
  useEffect(() => {
    if (!activeChapterId || !masterKey || !editor) return;
    const chapter = chapters.find((c) => c.id === activeChapterId);
    if (!chapter) return;

    const key = getSubKey(noteId) ?? masterKey;
    decrypt(chapter.contentBlob, chapter.contentIv, key)
      .then((content) => {
        editor.commands.setContent(content, false);
        setWordCount(countWords(content));
      })
      .catch(() => {});
  }, [activeChapterId, masterKey, editor, noteId]);

  let saveTimer: NodeJS.Timeout | null = null;
  function scheduleChapterSave(content: string) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveChapter(content), 3000);
  }

  async function saveChapter(content: string) {
    if (!masterKey || !activeChapterId) return;
    const key = getSubKey(noteId) ?? masterKey;
    setSaveStatus("saving");

    try {
      const { blob, iv } = await encrypt(content, key);
      const wc = countWords(content);

      await fetch(`/api/chapters/${activeChapterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentBlob: blob, contentIv: iv, wordCount: wc }),
      });

      setChapters((prev) =>
        prev.map((c) =>
          c.id === activeChapterId
            ? { ...c, contentBlob: blob, contentIv: iv, wordCount: wc }
            : c
        )
      );

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("offline");
    }
  }

  async function handleAddChapter() {
    if (!masterKey) return;
    const key = getSubKey(noteId) ?? masterKey;
    const { blob, iv } = await encrypt("", key);

    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteId,
        title: `Chapter ${chapters.length + 1}`,
        contentBlob: blob,
        contentIv: iv,
        order: chapters.length,
      }),
    });

    const newChapter = await res.json();
    setChapters((prev) => [...prev, newChapter]);
    setActiveChapterId(newChapter.id);
  }

  async function handleRenameChapter(id: string, title: string) {
    await fetch(`/api/chapters/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }

  async function handleDeleteChapter(id: string) {
    if (!confirm("Delete this chapter?")) return;
    await fetch(`/api/chapters/${id}`, { method: "DELETE" });
    setChapters((prev) => prev.filter((c) => c.id !== id));
    if (activeChapterId === id) {
      const remaining = chapters.filter((c) => c.id !== id);
      setActiveChapterId(remaining[0]?.id ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((c) => c.id === active.id);
    const newIndex = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIndex, newIndex);
    setChapters(reordered);

    reordered.forEach((chapter, idx) => {
      fetch(`/api/chapters/${chapter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: idx }),
      });
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-dvh" style={{ background: "#0f0f10" }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(201,168,76,0.4)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="flex h-dvh" style={{ background: "#0f0f10" }}>
      {/* Chapter sidebar */}
      <div
        className="w-56 flex-shrink-0 flex flex-col hidden md:flex"
        style={{
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: "#0a0a0b",
        }}
      >
        {/* Header */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs mb-3"
            style={{ color: "#6b6862" }}
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <BookOpen size={14} style={{ color: "#c9a84c" }} />
            <span className="text-sm font-medium truncate" style={{ color: "#f0ede6" }}>
              {note?.id ?? "Novel"}
            </span>
          </div>
        </div>

        {/* Chapters */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {chapters.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  isActive={chapter.id === activeChapterId}
                  onSelect={() => setActiveChapterId(chapter.id)}
                  onRename={(title) => handleRenameChapter(chapter.id, title)}
                  onDelete={() => handleDeleteChapter(chapter.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            onClick={handleAddChapter}
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-xs transition-all"
            style={{ color: "#6b6862" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#c9a84c"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6862"; }}
          >
            <Plus size={13} />
            Add chapter
          </button>
        </div>

        {/* Stats */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <NovelStats chapters={chapters} />
        </div>
      </div>

      {/* Chapter editor */}
      <div className="flex-1 flex flex-col min-w-0">
        <EditorToolbar
          editor={editor}
          language={language}
          onLanguageChange={setLanguage}
          onVersionHistory={() => {}}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto px-6 py-8" style={{ maxWidth: "680px" }}>
            {activeChapterId ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm" style={{ color: "#6b6862" }}>
                  No chapters yet
                </p>
                <button
                  onClick={handleAddChapter}
                  className="mt-4 px-4 py-2 rounded-xl text-sm"
                  style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#c9a84c",
                  }}
                >
                  Add first chapter
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          className="flex items-center px-6 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <WordCount count={wordCount} saveStatus={saveStatus} />
        </div>

        {language === "si" && <SinhalaHintBubble bubble={bubble} />}
      </div>
    </div>
  );
}
