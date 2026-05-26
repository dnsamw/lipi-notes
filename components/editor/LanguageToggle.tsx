"use client";

interface LanguageToggleProps {
  language: "en" | "si";
  onChange: (lang: "en" | "si") => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div
      className="flex items-center rounded-lg p-0.5"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {(["en", "si"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
          style={{
            background: language === lang ? "rgba(201,168,76,0.15)" : "transparent",
            color: language === lang ? "#c9a84c" : "#6b6862",
            border: language === lang ? "1px solid rgba(201,168,76,0.25)" : "1px solid transparent",
          }}
        >
          {lang === "en" ? "EN" : "සිං"}
        </button>
      ))}
    </div>
  );
}
