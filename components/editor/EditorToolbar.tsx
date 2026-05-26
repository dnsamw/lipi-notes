"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Heading2,
  Heading3,
  Quote,
  Table,
  History,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { useUIStore } from "@/lib/store/uiStore";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({ onClick, active, title, children, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
      style={{
        background: active ? "rgba(201,168,76,0.15)" : "transparent",
        color: active ? "#c9a84c" : "#a09d97",
        opacity: disabled ? 0.3 : 1,
        border: active ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) e.currentTarget.style.color = "#f0ede6";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "#a09d97";
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div
      className="w-px h-4 mx-1 flex-shrink-0"
      style={{ background: "rgba(255,255,255,0.08)" }}
    />
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
  language: "en" | "si";
  onLanguageChange: (lang: "en" | "si") => void;
  onVersionHistory: () => void;
}

export function EditorToolbar({
  editor,
  language,
  onLanguageChange,
  onVersionHistory,
}: EditorToolbarProps) {
  const { focusMode, toggleFocusMode } = useUIStore();

  if (!editor) return null;

  return (
    <div
      className="flex items-center gap-0.5 px-3 py-2 overflow-x-auto flex-wrap"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="Inline code"
      >
        <Code size={14} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 size={14} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered list"
      >
        <ListOrdered size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
        title="Task list"
      >
        <CheckSquare size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote size={14} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        title="Insert table"
      >
        <Table size={14} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton onClick={onVersionHistory} title="Version history">
        <History size={14} />
      </ToolbarButton>

      <div className="ml-auto flex items-center gap-2">
        <LanguageToggle language={language} onChange={onLanguageChange} />

        <ToolbarButton onClick={toggleFocusMode} title="Focus mode">
          {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </ToolbarButton>
      </div>
    </div>
  );
}
