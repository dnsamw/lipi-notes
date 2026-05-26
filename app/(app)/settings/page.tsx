"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { Lock, Shield, Cloud, Trash2, Eye, EyeOff, Check } from "lucide-react";
import { TagManager } from "@/components/ui/TagManager";
import { DriveBackupToggle } from "@/components/ui/DriveBackupToggle";
import { useKeyStore } from "@/lib/store/keyStore";
import { deriveMasterKey } from "@/lib/crypto";

type Tab = "account" | "security" | "tags" | "drive" | "danger";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { clearAll, setMasterKey } = useKeyStore();
  const [tab, setTab] = useState<Tab>("account");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);
  const [driveEnabled, setDriveEnabled] = useState(false);

  const TABS: { id: Tab; label: string; icon: typeof Lock }[] = [
    { id: "account", label: "Account", icon: Shield },
    { id: "security", label: "Security", icon: Lock },
    { id: "tags", label: "Tags", icon: Lock },
    { id: "drive", label: "Drive", icon: Cloud },
    { id: "danger", label: "Danger zone", icon: Trash2 },
  ];

  async function handleChangePassphrase() {
    if (!session?.user?.id) return;
    if (newPass.length < 8) {
      setPassError("Passphrase must be at least 8 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Passphrases do not match.");
      return;
    }
    setPassError("");

    localStorage.setItem(`lipinotes:has-passphrase:${session.user.id}`, "true");
    const key = await deriveMasterKey(session.user.id, newPass);
    setMasterKey(key);
    setPassSaved(true);
    setNewPass("");
    setConfirmPass("");
    setTimeout(() => setPassSaved(false), 3000);
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure? This will mark your account for deletion. You will be signed out immediately.")) return;
    await fetch("/api/settings/delete-account", { method: "POST" });
    clearAll();
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="min-h-dvh px-4 py-8 max-w-2xl mx-auto">
      <h1
        className="text-2xl font-semibold mb-8"
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          color: "#f0ede6",
        }}
      >
        Settings
      </h1>

      {/* Tab nav */}
      <div
        className="flex gap-1 mb-8 overflow-x-auto pb-1"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-4 py-2 rounded-t-lg text-sm whitespace-nowrap transition-all"
            style={{
              color: tab === id ? "#f0ede6" : "#6b6862",
              borderBottom: tab === id ? "2px solid #c9a84c" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Account tab */}
      {tab === "account" && session?.user && (
        <div className="space-y-6">
          <div
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? ""}
                width={56}
                height={56}
                className="rounded-full"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold"
                style={{ background: "#c9a84c", color: "#0f0f10" }}
              >
                {session.user.name?.[0] ?? "U"}
              </div>
            )}
            <div>
              <p className="font-medium" style={{ color: "#f0ede6" }}>
                {session.user.name}
              </p>
              <p className="text-sm" style={{ color: "#a09d97" }}>
                {session.user.email}
              </p>
              <p className="text-xs mt-1" style={{ color: "#6b6862" }}>
                Signed in with Google
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4" style={{ color: "#f0ede6" }}>
              Change master passphrase
            </h3>
            <p className="text-xs mb-4" style={{ color: "#6b6862", lineHeight: 1.6 }}>
              Changing your passphrase will re-derive your master key for new saves.
              Old encrypted content remains readable with the old key unless re-encrypted.
            </p>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="New passphrase"
                  value={newPass}
                  onChange={(e) => { setNewPass(e.target.value); setPassError(""); }}
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
                value={confirmPass}
                onChange={(e) => { setConfirmPass(e.target.value); setPassError(""); }}
                className="w-full rounded-xl px-4 py-3 text-sm focus-ring"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f0ede6",
                  outline: "none",
                }}
              />
              {passError && <p className="text-xs" style={{ color: "#e05252" }}>{passError}</p>}
              <button
                onClick={handleChangePassphrase}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: passSaved ? "rgba(82,168,120,0.1)" : "rgba(201,168,76,0.1)",
                  border: `1px solid ${passSaved ? "rgba(82,168,120,0.3)" : "rgba(201,168,76,0.25)"}`,
                  color: passSaved ? "#52a878" : "#c9a84c",
                }}
              >
                {passSaved ? <Check size={14} /> : <Lock size={14} />}
                {passSaved ? "Saved!" : "Update passphrase"}
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
            <button
              onClick={() => clearAll()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: "rgba(224,82,82,0.06)",
                border: "1px solid rgba(224,82,82,0.15)",
                color: "#e05252",
              }}
            >
              <Lock size={14} />
              Lock all notes now
            </button>
            <p className="text-xs mt-2" style={{ color: "#6b6862" }}>
              Clears the decryption key from memory. You will need to re-enter your passphrase.
            </p>
          </div>
        </div>
      )}

      {/* Tags tab */}
      {tab === "tags" && <TagManager />}

      {/* Drive tab */}
      {tab === "drive" && (
        <DriveBackupToggle
          driveEnabled={driveEnabled}
          onConnect={() => window.location.href = "/api/drive/connect"}
          onDisconnect={async () => {
            await fetch("/api/drive/connect", { method: "DELETE" });
            setDriveEnabled(false);
          }}
          onBackupNow={async () => {
            await fetch("/api/drive/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ backup: "all" }) });
          }}
        />
      )}

      {/* Danger zone */}
      {tab === "danger" && (
        <div
          className="rounded-xl p-5"
          style={{ background: "rgba(224,82,82,0.04)", border: "1px solid rgba(224,82,82,0.12)" }}
        >
          <h3 className="text-sm font-medium mb-2" style={{ color: "#e05252" }}>
            Danger Zone
          </h3>
          <p className="text-xs mb-4" style={{ color: "#a09d97", lineHeight: 1.6 }}>
            Deleting your account will sign you out immediately. Your data will be
            marked for deletion and removed within 30 days.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(224,82,82,0.1)",
              border: "1px solid rgba(224,82,82,0.25)",
              color: "#e05252",
            }}
          >
            Delete my account
          </button>
        </div>
      )}
    </div>
  );
}
