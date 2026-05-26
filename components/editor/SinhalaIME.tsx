"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { transliterate, isRomanChar, loadSinhalaIME } from "@/lib/sinhala";

interface SinhalaIMEProps {
  editor: Editor | null;
  active: boolean;
}

export function useSinhalaIME(editor: Editor | null, active: boolean) {
  const bufferRef = useRef("");
  const [bubble, setBubble] = useState<{ buffer: string; output: string } | null>(null);
  const bubbleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (active) {
      loadSinhalaIME();
    }
  }, [active]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active || !editor) return;

      if (e.key === " " || e.key === "Enter") {
        if (bufferRef.current) {
          bufferRef.current = "";
          setBubble(null);
        }
        return;
      }

      if (e.key === "Backspace") {
        if (bufferRef.current.length > 0) {
          e.preventDefault();
          bufferRef.current = bufferRef.current.slice(0, -1);
          if (bufferRef.current) {
            const output = transliterate(bufferRef.current);
            setBubble({ buffer: bufferRef.current, output });
            // Delete last character from editor
            editor.commands.deleteRange({
              from: editor.state.selection.from - 1,
              to: editor.state.selection.from,
            });
          } else {
            setBubble(null);
            editor.commands.deleteRange({
              from: editor.state.selection.from - 1,
              to: editor.state.selection.from,
            });
          }
        }
        return;
      }

      if (!isRomanChar(e.key)) return;

      e.preventDefault();
      bufferRef.current += e.key;
      const output = transliterate(bufferRef.current);

      // Replace the previous output with the new transliteration
      const prevOutput = transliterate(bufferRef.current.slice(0, -1));
      if (prevOutput && bufferRef.current.length > 1) {
        editor.commands.deleteRange({
          from: editor.state.selection.from - prevOutput.length,
          to: editor.state.selection.from,
        });
      }
      editor.commands.insertContent(output);

      setBubble({ buffer: bufferRef.current, output });

      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => {
        setBubble(null);
        bufferRef.current = "";
      }, 2000);
    },
    [active, editor]
  );

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      dom.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [editor, handleKeyDown]);

  return { bubble };
}

export function SinhalaHintBubble({
  bubble,
}: {
  bubble: { buffer: string; output: string } | null;
}) {
  if (!bubble) return null;

  return (
    <div
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm animate-fade-in"
      style={{
        background: "#1a1a1e",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        pointerEvents: "none",
      }}
    >
      <span style={{ color: "#6b6862", fontFamily: "monospace" }}>
        {bubble.buffer}
      </span>
      <span style={{ color: "#3a3830" }}>→</span>
      <span style={{ color: "#c9a84c", fontSize: "1.1rem" }}>
        {bubble.output}
      </span>
    </div>
  );
}
