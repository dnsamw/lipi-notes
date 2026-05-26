"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { useKeyStore } from "@/lib/store/keyStore";
import { deriveMasterKey } from "@/lib/crypto";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { SearchModal } from "./SearchModal";
import { MasterPassphraseModal } from "./MasterPassphraseModal";
import { useUIStore } from "@/lib/store/uiStore";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";

interface AppShellProps {
  session: Session;
  children: React.ReactNode;
}

export function AppShell({ session, children }: AppShellProps) {
  const { masterKey, setMasterKey } = useKeyStore();
  const { searchOpen } = useUIStore();
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useOfflineSync();

  useEffect(() => {
    // On mount: if no master key, derive from userId (or prompt for passphrase)
    if (!masterKey && session.user?.id) {
      const hasPassphrase = localStorage.getItem(
        `lipinotes:has-passphrase:${session.user.id}`
      );
      if (hasPassphrase === "true") {
        // User has set a passphrase — prompt for it
        setShowPassphraseModal(true);
        setInitializing(false);
      } else if (hasPassphrase === null) {
        // First login — show setup modal
        setShowPassphraseModal(true);
        setInitializing(false);
      } else {
        // User chose to skip passphrase — derive from userId alone
        deriveMasterKey(session.user.id).then((key) => {
          setMasterKey(key);
          setInitializing(false);
        });
      }
    } else {
      setInitializing(false);
    }
  }, [masterKey, session.user?.id, setMasterKey]);

  if (initializing) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: "#0f0f10" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
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
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "rgba(201,168,76,0.4)", borderTopColor: "transparent" }}
          />
        </div>
      </div>
    );
  }

  if (showPassphraseModal) {
    return (
      <MasterPassphraseModal
        userId={session.user.id}
        onComplete={(key) => {
          setMasterKey(key);
          setShowPassphraseModal(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh flex" style={{ background: "#0f0f10" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar session={session} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="animate-fade-in">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global modals */}
      {searchOpen && <SearchModal />}
    </div>
  );
}
