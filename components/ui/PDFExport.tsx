"use client";

import { useState } from "react";
import { Download, Loader } from "lucide-react";
import { useKeyStore } from "@/lib/store/keyStore";
import { decrypt } from "@/lib/crypto";

interface PDFExportProps {
  noteId: string;
  noteTitle: string;
}

export function PDFExport({ noteId, noteTitle }: PDFExportProps) {
  const { masterKey, getSubKey } = useKeyStore();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!masterKey) return;
    setExporting(true);

    try {
      const res = await fetch(`/api/export/${noteId}`);
      const data = await res.json();
      const key = getSubKey(noteId) ?? masterKey;

      // Dynamically import react-pdf to code-split
      const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import(
        "@react-pdf/renderer"
      );

      const styles = StyleSheet.create({
        page: {
          padding: 60,
          fontFamily: "Helvetica",
          backgroundColor: "#ffffff",
        },
        title: {
          fontSize: 28,
          fontFamily: "Helvetica-Bold",
          marginBottom: 24,
          color: "#1a1a1a",
        },
        chapterTitle: {
          fontSize: 18,
          fontFamily: "Helvetica-Bold",
          marginBottom: 12,
          marginTop: 24,
          color: "#1a1a1a",
        },
        body: {
          fontSize: 11,
          lineHeight: 1.8,
          color: "#333333",
        },
        separator: {
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
          marginVertical: 16,
        },
      });

      let content: string;
      if (data.isNovel && data.chapters?.length > 0) {
        // Build combined novel content
        const chapterTexts = await Promise.all(
          data.chapters.map(async (c: { title: string; contentBlob: string; contentIv: string }) => ({
            title: c.title,
            content: await decrypt(c.contentBlob, c.contentIv, key),
          }))
        );

        const title = await decrypt(data.titleBlob, data.titleIv, key);
        const doc = (
          <Document>
            <Page size="A4" style={styles.page}>
              <Text style={styles.title}>{title}</Text>
              {chapterTexts.map((c, i) => (
                <View key={i}>
                  <View style={styles.separator} />
                  <Text style={styles.chapterTitle}>{c.title}</Text>
                  <Text style={styles.body}>
                    {c.content.replace(/<[^>]+>/g, "")}
                  </Text>
                </View>
              ))}
            </Page>
          </Document>
        );

        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      content = await decrypt(data.contentBlob, data.contentIv, key);
      const title = await decrypt(data.titleBlob, data.titleIv, key);

      const doc = (
        <Document>
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>
              {content.replace(/<[^>]+>/g, "")}
            </Text>
          </Page>
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: exporting ? "#6b6862" : "#a09d97",
      }}
    >
      {exporting ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
      {exporting ? "Exporting…" : "Export PDF"}
    </button>
  );
}
