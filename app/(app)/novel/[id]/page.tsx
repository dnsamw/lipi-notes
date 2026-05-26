"use client";

import dynamic from "next/dynamic";
import { use } from "react";

const NovelProject = dynamic(
  () => import("@/components/novel/NovelProject").then((m) => m.NovelProject),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-dvh" style={{ background: "#0f0f10" }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "rgba(201,168,76,0.4)", borderTopColor: "transparent" }} />
    </div>
  )}
);

export default function NovelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <NovelProject noteId={id} />;
}
