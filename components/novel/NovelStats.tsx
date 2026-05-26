"use client";

import { useState } from "react";
import { Target, Clock, TrendingUp } from "lucide-react";
import { estimateReadingTime } from "@/lib/utils";
import type { Chapter } from "./NovelProject";

interface NovelStatsProps {
  chapters: Chapter[];
}

export function NovelStats({ chapters }: NovelStatsProps) {
  const [goal, setGoal] = useState(() => {
    const stored = localStorage.getItem("lipinotes:novel-goal");
    return stored ? parseInt(stored, 10) : 50000;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goal));

  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount ?? 0), 0);
  const progress = Math.min(100, Math.round((totalWords / goal) * 100));

  function saveGoal() {
    const n = parseInt(goalInput, 10);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem("lipinotes:novel-goal", String(n));
    }
    setEditingGoal(false);
  }

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h4 className="text-xs font-medium mb-3" style={{ color: "#6b6862", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Project Stats
      </h4>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces), Georgia, serif", color: "#f0ede6" }}>
            {totalWords.toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: "#6b6862" }}>total words</p>
        </div>
        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: "var(--font-fraunces), Georgia, serif", color: "#f0ede6" }}>
            {chapters.length}
          </p>
          <p className="text-xs" style={{ color: "#6b6862" }}>chapters</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Clock size={12} style={{ color: "#6b6862" }} />
        <span className="text-xs" style={{ color: "#a09d97" }}>
          {estimateReadingTime(totalWords)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Target size={12} style={{ color: "#c9a84c" }} />
            <span className="text-xs" style={{ color: "#6b6862" }}>
              {progress}% of goal
            </span>
          </div>
          {editingGoal ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                onBlur={saveGoal}
                autoFocus
                className="w-20 bg-transparent text-xs outline-none text-right"
                style={{ color: "#f0ede6", borderBottom: "1px solid rgba(201,168,76,0.4)" }}
              />
            </div>
          ) : (
            <button
              onClick={() => setEditingGoal(true)}
              className="text-xs transition-colors"
              style={{ color: "#6b6862" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#c9a84c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#6b6862"; }}
            >
              {goal.toLocaleString()}w goal
            </button>
          )}
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: progress >= 100 ? "#52a878" : "linear-gradient(90deg, #c9a84c, #d4b56a)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
