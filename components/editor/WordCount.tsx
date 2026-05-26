"use client";

import { estimateReadingTime } from "@/lib/utils";

interface WordCountProps {
  count: number;
  saveStatus: "saved" | "saving" | "offline" | "idle";
}

const STATUS_CONFIG = {
  saved: { text: "Saved", color: "#52a878" },
  saving: { text: "Saving…", color: "#c9a84c" },
  offline: { text: "Offline — queued", color: "#e05252" },
  idle: { text: "", color: "transparent" },
};

export function WordCount({ count, saveStatus }: WordCountProps) {
  const status = STATUS_CONFIG[saveStatus];

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs" style={{ color: "#6b6862" }}>
        {count.toLocaleString()} {count === 1 ? "word" : "words"}
      </span>
      {count > 0 && (
        <>
          <span style={{ color: "#3a3830" }}>·</span>
          <span className="text-xs" style={{ color: "#6b6862" }}>
            {estimateReadingTime(count)}
          </span>
        </>
      )}
      {saveStatus !== "idle" && (
        <>
          <span style={{ color: "#3a3830" }}>·</span>
          <span className="text-xs" style={{ color: status.color }}>
            {status.text}
          </span>
        </>
      )}
    </div>
  );
}
