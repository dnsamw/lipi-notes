"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { transliterate, isRomanChar, loadSinhalaIME } from "@/lib/sinhala";

// Attributes to suppress iOS keyboard autocorrect/autocapitalize for Sinhala phonetic typing.
// Apply these to any <input> or contenteditable used in Sinhala mode.
export const SINHALA_INPUT_ATTRS = {
  autoCorrect: "off",
  autoCapitalize: "none",
  autoComplete: "off",
  spellCheck: false,
} as const;

// Same attributes as plain strings for contenteditable / editorProps.attributes (Tiptap).
export const SINHALA_EDITOR_ATTRS = {
  autocorrect: "off",
  autocapitalize: "none",
  autocomplete: "off",
  spellcheck: "false",
} as const;

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

// IME hook for plain <input> elements (e.g. the note title field).
export function useSinhalaIMEForInput(
  inputRef: React.RefObject<HTMLInputElement | null>,
  active: boolean,
  onChange: (value: string) => void
) {
  const bufferRef = useRef("");
  const [bubble, setBubble] = useState<{ buffer: string; output: string } | null>(null);
  const bubbleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (active) loadSinhalaIME();
    else {
      bufferRef.current = "";
      setBubble(null);
    }
  }, [active]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active) return;
      const input = inputRef.current;
      if (!input) return;

      const selStart = input.selectionStart ?? input.value.length;
      const selEnd = input.selectionEnd ?? input.value.length;

      if (e.key === " " || e.key === "Enter") {
        bufferRef.current = "";
        setBubble(null);
        return;
      }

      if (e.key === "Backspace") {
        if (bufferRef.current.length > 0) {
          e.preventDefault();
          const prevOutput = transliterate(bufferRef.current);
          bufferRef.current = bufferRef.current.slice(0, -1);

          const val = input.value;
          const deleteFrom = selStart - prevOutput.length;
          const newOutput = bufferRef.current ? transliterate(bufferRef.current) : "";
          const newVal = val.slice(0, deleteFrom) + newOutput + val.slice(selEnd);
          const newCursor = deleteFrom + newOutput.length;

          onChange(newVal);
          requestAnimationFrame(() => input.setSelectionRange(newCursor, newCursor));

          if (bufferRef.current) {
            setBubble({ buffer: bufferRef.current, output: newOutput });
          } else {
            setBubble(null);
          }
        }
        return;
      }

      if (!isRomanChar(e.key)) return;

      e.preventDefault();
      const prevBuffer = bufferRef.current;
      bufferRef.current += e.key;

      const output = transliterate(bufferRef.current);
      const prevOutput = prevBuffer ? transliterate(prevBuffer) : "";

      const val = input.value;
      let newVal: string;
      let newCursor: number;

      if (prevOutput && prevBuffer.length > 0) {
        const replaceFrom = selStart - prevOutput.length;
        newVal = val.slice(0, replaceFrom) + output + val.slice(selEnd);
        newCursor = replaceFrom + output.length;
      } else {
        newVal = val.slice(0, selStart) + output + val.slice(selEnd);
        newCursor = selStart + output.length;
      }

      onChange(newVal);
      requestAnimationFrame(() => input.setSelectionRange(newCursor, newCursor));

      setBubble({ buffer: bufferRef.current, output });
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => {
        setBubble(null);
        bufferRef.current = "";
      }, 2000);
    },
    [active, inputRef, onChange]
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => input.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [inputRef, handleKeyDown]);

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
