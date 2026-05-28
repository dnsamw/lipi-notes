"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Typography from "@tiptap/extension-typography";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";

import { EditorToolbar } from "./EditorToolbar";
import { WordCount } from "./WordCount";
import { useSinhalaIME, useSinhalaIMEForInput, SinhalaHintBubble, SINHALA_INPUT_ATTRS, SINHALA_EDITOR_ATTRS } from "./SinhalaIME";
import { VersionHistory } from "../ui/VersionHistory";
import { PasswordModal } from "../explorer/PasswordModal";

import { useKeyStore } from "@/lib/store/keyStore";
import { useUIStore } from "@/lib/store/uiStore";
import { encrypt, decrypt, deriveSubKey, verifyPassword } from "@/lib/crypto";
import { useNote, useUpdateNote } from "@/lib/hooks/useNote";
import { db } from "@/lib/db/dexie";
import { countWords } from "@/lib/utils";

type SaveStatus = "saved" | "saving" | "offline" | "idle";

interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const router = useRouter();
  const { masterKey, getSubKey, setSubKey } = useKeyStore();
  const { focusMode } = useUIStore();

  const { data: note, isLoading } = useNote(noteId);
  const updateNote = useUpdateNote();

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<"en" | "si">("en");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const saveCountRef = useRef(0);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;
  const titleInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({ placeholder: "Start writing…" }),
      CharacterCount,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "ProseMirror",
        ...SINHALA_EDITOR_ATTRS,
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(countWords(text));
      scheduleSave(editor.getHTML());
    },
  });

  const { bubble } = useSinhalaIME(editor, language === "si");
  const { bubble: titleBubble } = useSinhalaIMEForInput(
    titleInputRef,
    language === "si",
    (val) => handleTitleChange(val)
  );

  // Load and decrypt note content
  useEffect(() => {
    if (!note || !masterKey) return;

    if (note.hasPassword && !getSubKey(noteId) && !isUnlocked) {
      setShowPasswordModal(true);
      return;
    }

    const key = getSubKey(noteId) ?? masterKey;

    async function loadNote() {
      if (!note || !masterKey) return;
      const key = getSubKey(noteId) ?? masterKey;
      try {
        const [decTitle, decContent] = await Promise.all([
          decrypt(note.titleBlob, note.titleIv, key),
          decrypt(note.contentBlob, note.contentIv, key),
        ]);
        setTitle(decTitle);
        setLanguage(note.language as "en" | "si");
        setWordCount(countWords(decContent));
        editor?.commands.setContent(decContent, false);

        // Cache to IndexedDB
        await db.notes.put({
          id: note.id,
          titlePlain: decTitle,
          contentPlain: decContent,
          folderId: note.folderId ?? null,
          wordCount: note.wordCount,
          updatedAt: new Date(note.updatedAt).getTime(),
          isNovel: note.isNovel,
          language: note.language,
          isTrashed: note.isTrashed,
        });
      } catch {
        // Wrong key / decryption failure
      }
    }

    loadNote();
  }, [note, masterKey, editor, noteId, getSubKey, isUnlocked]);

  const scheduleSave = useCallback(
    (content: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await performSave(content);
      }, 3000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [masterKey, noteId, language]
  );

  async function performSave(content: string) {
    if (!masterKey) return;
    const key = getSubKey(noteId) ?? masterKey;
    setSaveStatus("saving");

    try {
      const wc = countWords(content);
      const [titleEnc, contentEnc] = await Promise.all([
        encrypt(titleRef.current, key),
        encrypt(content, key),
      ]);

      if (!navigator.onLine) {
        await db.syncQueue.add({
          type: "UPDATE_NOTE",
          payload: {
            id: noteId,
            titleBlob: titleEnc.blob,
            titleIv: titleEnc.iv,
            contentBlob: contentEnc.blob,
            contentIv: contentEnc.iv,
            wordCount: wc,
            language,
          },
          createdAt: Date.now(),
          retries: 0,
        });
        setSaveStatus("offline");
        return;
      }

      await updateNote.mutateAsync({
        id: noteId,
        titleBlob: titleEnc.blob,
        titleIv: titleEnc.iv,
        contentBlob: contentEnc.blob,
        contentIv: contentEnc.iv,
        wordCount: wc,
        language,
      });

      // Version snapshot every 10 saves
      saveCountRef.current++;
      if (saveCountRef.current % 10 === 0) {
        await fetch(`/api/notes/${noteId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentBlob: contentEnc.blob,
            contentIv: contentEnc.iv,
          }),
        });
      }

      // Update IndexedDB cache
      await db.notes.update(noteId, {
        titlePlain: titleRef.current,
        contentPlain: content,
        wordCount: wc,
        updatedAt: Date.now(),
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("offline");
    }
  }

  async function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    if (editor) scheduleSave(editor.getHTML());
  }

  async function handleLanguageChange(lang: "en" | "si") {
    setLanguage(lang);
    if (editor) scheduleSave(editor.getHTML());
  }

  async function handlePasswordUnlock(password: string) {
    if (!masterKey || !note) throw new Error("No key");

    // Verify password
    if (note.passwordHash) {
      const ok = await verifyPassword(password, note.passwordHash);
      if (!ok) throw new Error("Wrong password");
    }

    const subKey = await deriveSubKey(masterKey, password, noteId);
    setSubKey(noteId, subKey);
    setIsUnlocked(true);
    setShowPasswordModal(false);
  }

  if (isLoading || !note) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: "#0f0f10" }}>
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(201,168,76,0.4)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const showSinhalaHint = language === "si";

  return (
    <div
      className="flex flex-col h-dvh"
      style={{ background: "#0f0f10" }}
    >
      {/* Top bar */}
      {!focusMode && (
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "#6b6862" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#a09d97"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6862"; }}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {note.hasPassword && (
            <Lock size={12} style={{ color: "#c9a84c", opacity: 0.7 }} />
          )}

          {showSinhalaHint && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.2)",
                color: "#c9a84c",
                fontSize: "0.7rem",
              }}
            >
              Sinhala phonetic mode active
            </span>
          )}
        </div>
      )}

      {/* Toolbar */}
      {!focusMode && (
        <EditorToolbar
          editor={editor}
          language={language}
          onLanguageChange={handleLanguageChange}
          onVersionHistory={() => setShowVersionHistory(true)}
        />
      )}

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="mx-auto px-6 py-8"
          style={{ maxWidth: "680px" }}
        >
          {/* Title */}
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full bg-transparent outline-none mb-6"
            {...SINHALA_INPUT_ATTRS}
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
              fontWeight: 600,
              color: "#f0ede6",
              lineHeight: 1.2,
              caretColor: "#c9a84c",
            }}
          />

          {/* Tiptap editor */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Bottom status bar */}
      {!focusMode && (
        <div
          className="flex items-center px-6 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <WordCount count={wordCount} saveStatus={saveStatus} />
        </div>
      )}

      {/* Sinhala hint bubble — title takes priority when focused */}
      {language === "si" && <SinhalaHintBubble bubble={titleBubble ?? bubble} />}

      {/* Version history panel */}
      {showVersionHistory && (
        <VersionHistory
          noteId={noteId}
          onClose={() => setShowVersionHistory(false)}
          onRestore={async (contentBlob, contentIv) => {
            const key = getSubKey(noteId) ?? masterKey;
            if (!key) return;
            const content = await decrypt(contentBlob, contentIv, key);
            editor?.commands.setContent(content, true);
            setShowVersionHistory(false);
          }}
        />
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <PasswordModal
          title="Unlock note"
          description="This note is password-protected."
          onSubmit={handlePasswordUnlock}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
