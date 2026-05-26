"use client";

import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, Download, Check } from "lucide-react";

interface DriveBackupToggleProps {
  driveEnabled: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onBackupNow: () => Promise<void>;
}

export function DriveBackupToggle({
  driveEnabled,
  onConnect,
  onDisconnect,
  onBackupNow,
}: DriveBackupToggleProps) {
  const [backing, setBacking] = useState(false);
  const [backed, setBacked] = useState(false);

  async function handleBackupNow() {
    setBacking(true);
    try {
      await onBackupNow();
      setBacked(true);
      setTimeout(() => setBacked(false), 3000);
    } finally {
      setBacking(false);
    }
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {driveEnabled ? (
            <Cloud size={16} style={{ color: "#52a878" }} />
          ) : (
            <CloudOff size={16} style={{ color: "#6b6862" }} />
          )}
          <div>
            <p className="text-sm font-medium" style={{ color: "#f0ede6" }}>
              Google Drive Backup
            </p>
            <p className="text-xs" style={{ color: "#6b6862" }}>
              {driveEnabled
                ? "Encrypted backups are active"
                : "Back up your encrypted notes to Drive"}
            </p>
          </div>
        </div>

        <button
          onClick={driveEnabled ? onDisconnect : onConnect}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: driveEnabled ? "rgba(224,82,82,0.08)" : "rgba(82,168,120,0.1)",
            color: driveEnabled ? "#e05252" : "#52a878",
            border: `1px solid ${driveEnabled ? "rgba(224,82,82,0.2)" : "rgba(82,168,120,0.2)"}`,
          }}
        >
          {driveEnabled ? "Disconnect" : "Connect"}
        </button>
      </div>

      {driveEnabled && (
        <div className="flex gap-2">
          <button
            onClick={handleBackupNow}
            disabled={backing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: backed ? "#52a878" : "#a09d97",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {backed ? (
              <Check size={12} />
            ) : (
              <RefreshCw size={12} className={backing ? "animate-spin" : ""} />
            )}
            {backed ? "Backed up!" : backing ? "Backing up…" : "Backup now"}
          </button>
        </div>
      )}
    </div>
  );
}
