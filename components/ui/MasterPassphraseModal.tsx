"use client";

import { useState } from "react";
import { Lock, Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { deriveMasterKey } from "@/lib/crypto";

interface Props {
  userId: string;
  onComplete: (key: CryptoKey) => void;
}

type Step = "choose" | "set" | "enter";

export function MasterPassphraseModal({ userId, onComplete }: Props) {
  const [step, setStep] = useState<Step>(() => {
    const stored = localStorage.getItem(`lipinotes:has-passphrase:${userId}`);
    if (stored === "true") return "enter";
    return "choose";
  });

  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSkip() {
    setLoading(true);
    localStorage.setItem(`lipinotes:has-passphrase:${userId}`, "false");
    const key = await deriveMasterKey(userId);
    onComplete(key);
  }

  async function handleSetPassphrase() {
    if (passphrase.length < 8) {
      setError("Passphrase must be at least 8 characters.");
      return;
    }
    if (passphrase !== confirm) {
      setError("Passphrases do not match.");
      return;
    }
    setLoading(true);
    setError("");
    localStorage.setItem(`lipinotes:has-passphrase:${userId}`, "true");
    const key = await deriveMasterKey(userId, passphrase);
    onComplete(key);
  }

  async function handleEnterPassphrase() {
    if (!passphrase) {
      setError("Please enter your passphrase.");
      return;
    }
    setLoading(true);
    setError("");
    const key = await deriveMasterKey(userId, passphrase);
    onComplete(key);
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-6"
      style={{ background: "#0f0f10" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,168,76,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-[390px] rounded-2xl p-8 animate-fade-in"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {step === "choose" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <Shield size={18} style={{ color: "#c9a84c" }} />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    color: "#f0ede6",
                  }}
                >
                  Secure your notes
                </h2>
                <p style={{ color: "#a09d97", fontSize: "0.8rem" }}>
                  First-time setup
                </p>
              </div>
            </div>

            <p className="text-sm mb-6" style={{ color: "#a09d97", lineHeight: 1.7 }}>
              Your notes are encrypted in your browser. Adding a passphrase
              makes them significantly stronger — only you can unlock them, even
              if someone accesses your account.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setStep("set")}
                className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#c9a84c",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(201,168,76,0.16)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(201,168,76,0.1)";
                }}
              >
                <div className="flex items-center gap-3">
                  <Lock size={16} />
                  <div className="text-left">
                    <div className="font-medium text-sm">Set a passphrase</div>
                    <div className="text-xs opacity-70" style={{ color: "#a09d97" }}>
                      Recommended — strongest protection
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} opacity={0.6} />
              </button>

              <button
                onClick={handleSkip}
                disabled={loading}
                className="w-full px-5 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#6b6862",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#a09d97";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#6b6862";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                {loading ? "Setting up…" : "Skip for now — use basic encryption"}
              </button>
            </div>
          </>
        )}

        {step === "set" && (
          <>
            <button
              onClick={() => setStep("choose")}
              className="text-xs mb-6 flex items-center gap-1"
              style={{ color: "#6b6862" }}
            >
              ← Back
            </button>
            <h2
              className="text-xl font-semibold mb-2"
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                color: "#f0ede6",
              }}
            >
              Set your passphrase
            </h2>
            <p className="text-sm mb-6" style={{ color: "#a09d97" }}>
              This passphrase encrypts your master key. Store it safely — it
              cannot be recovered.
            </p>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Passphrase (min 8 chars)"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm focus-ring"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
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

              <input
                type={showPass ? "text" : "password"}
                placeholder="Confirm passphrase"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError("");
                }}
                className="w-full rounded-xl px-4 py-3 text-sm focus-ring"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f0ede6",
                  outline: "none",
                }}
              />

              {error && (
                <p className="text-xs" style={{ color: "#e05252" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleSetPassphrase}
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: loading ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.15)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#c9a84c",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Deriving key…" : "Set passphrase & continue"}
              </button>
            </div>
          </>
        )}

        {step === "enter" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <Lock size={18} style={{ color: "#c9a84c" }} />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    color: "#f0ede6",
                  }}
                >
                  Enter your passphrase
                </h2>
                <p style={{ color: "#a09d97", fontSize: "0.8rem" }}>
                  To unlock your notes
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Your passphrase"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleEnterPassphrase()}
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
                <p className="text-xs" style={{ color: "#e05252" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleEnterPassphrase}
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: loading ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.15)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#c9a84c",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Unlocking…" : "Unlock notes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
