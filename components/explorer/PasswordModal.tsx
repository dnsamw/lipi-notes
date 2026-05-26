"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, X } from "lucide-react";

interface PasswordModalProps {
  title: string;
  description?: string;
  onSubmit: (password: string) => Promise<void>;
  onCancel: () => void;
}

export function PasswordModal({
  title,
  description,
  onSubmit,
  onCancel,
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(password);
    } catch {
      setError("Incorrect password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-[360px] rounded-2xl p-6 animate-slide-in-up"
        style={{
          background: "#161618",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Lock size={16} style={{ color: "#c9a84c" }} />
            <h3
              className="font-semibold"
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                color: "#f0ede6",
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{ color: "#6b6862" }}
            className="transition-colors hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {description && (
          <p className="text-sm mb-4" style={{ color: "#a09d97" }}>
            {description}
          </p>
        )}

        <div className="relative mb-3">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            className="w-full rounded-xl px-4 py-3 pr-11 text-sm focus-ring"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "rgba(224,82,82,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: "#f0ede6",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6b6862" }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && (
          <p className="text-xs mb-3" style={{ color: "#e05252" }}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#a09d97",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: loading ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#c9a84c",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
}
