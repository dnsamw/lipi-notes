// Sinhala IME integration using @dnsam/sinhala-phonetics
// convertText("mama") → "මම"

let convertTextFn: ((text: string) => string) | null = null;

export async function loadSinhalaIME(): Promise<void> {
  if (convertTextFn) return;
  try {
    const mod = await import("@dnsam/sinhala-phonetics");
    convertTextFn = mod.convertText;
  } catch {
    console.warn("Sinhala phonetics module not available");
  }
}

export function transliterate(romanBuffer: string): string {
  if (!convertTextFn) return romanBuffer;
  try {
    return convertTextFn(romanBuffer);
  } catch {
    return romanBuffer;
  }
}

export function isRomanChar(key: string): boolean {
  return /^[a-zA-Z]$/.test(key);
}
