"use client";

import { Folder, BookOpen, Lock, Star, Archive } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  default: "#c9a84c",
  blue: "#5b8dee",
  green: "#52a878",
  red: "#e05252",
  purple: "#9b6ee0",
  pink: "#e06eaa",
};

interface FolderIconProps {
  icon: string;
  color: string;
  size?: number;
}

export function FolderIcon({ icon, color, size = 18 }: FolderIconProps) {
  const fill = COLOR_MAP[color] ?? COLOR_MAP.default;

  const IconComponent = {
    folder: Folder,
    book: BookOpen,
    lock: Lock,
    star: Star,
    archive: Archive,
  }[icon] ?? Folder;

  return <IconComponent size={size} style={{ color: fill }} />;
}
