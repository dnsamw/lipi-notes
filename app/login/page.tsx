"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Lock, Shield, Zap } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "#0f0f10" }}>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(240,237,230,1) 1px, transparent 1px), linear-gradient(90deg, rgba(240,237,230,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-[390px] animate-fade-in"
        style={{ animationDelay: "0.05s", animationFillMode: "both" }}
      >
        {/* Logo + wordmark */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
            }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M6 22 L14 4 L22 22"
                stroke="#c9a84c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 16 H19.5"
                stroke="#c9a84c"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>

          <h1
            className="text-4xl font-semibold tracking-tight mb-2"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              color: "#f0ede6",
            }}
          >
            LipiNotes
          </h1>
          <p style={{ color: "#a09d97", fontSize: "0.9375rem" }}>
            Your words, encrypted.
          </p>
        </div>

        {/* Sign-in card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <p
            className="text-sm text-center mb-6"
            style={{ color: "#a09d97", lineHeight: 1.6 }}
          >
            Sign in to access your private notes. All content is encrypted
            end-to-end — only you can read it.
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 transition-all duration-200 focus-ring"
            style={{
              background: loading ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.3)",
              color: loading ? "#a09d97" : "#c9a84c",
              fontSize: "0.9375rem",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(201,168,76,0.16)";
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "rgba(201,168,76,0.1)";
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
              }
            }}
          >
            {loading ? (
              <svg
                className="animate-spin"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="32"
                  strokeDashoffset="12"
                  opacity="0.4"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#c9a84c"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  opacity="0.8"
                />
                <path
                  fill="#c9a84c"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  opacity="0.7"
                />
                <path
                  fill="#c9a84c"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  opacity="0.6"
                />
                <path
                  fill="#c9a84c"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  opacity="0.9"
                />
              </svg>
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          {/* Trust badges */}
          <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Lock, label: "AES-256", sub: "Encrypted" },
                { icon: Shield, label: "Zero-knowledge", sub: "Server" },
                { icon: Zap, label: "Works offline", sub: "PWA" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Icon size={14} style={{ color: "#c9a84c", opacity: 0.8 }} />
                  <span style={{ color: "#f0ede6", fontSize: "0.65rem", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
                    {label}
                  </span>
                  <span style={{ color: "#6b6862", fontSize: "0.6rem", textAlign: "center" }}>
                    {sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-8" style={{ color: "#6b6862", fontSize: "0.75rem", lineHeight: 1.6 }}>
          Your notes are encrypted before leaving your device.
          <br />
          We can&apos;t read them — ever.
        </p>
      </div>
    </div>
  );
}
