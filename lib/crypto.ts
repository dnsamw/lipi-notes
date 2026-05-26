// All encryption/decryption happens in the browser. Server never receives plaintext.
/* eslint-disable @typescript-eslint/no-explicit-any */

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Cast to bypass strict Uint8Array<ArrayBuffer> vs Uint8Array<ArrayBufferLike> mismatch
const subtle = crypto.subtle as any;

export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ blob: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext: ArrayBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  return {
    blob: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

export async function decrypt(
  blob: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const dec = new TextDecoder();
  const ivBytes = base64ToBytes(iv);
  const plaintext: ArrayBuffer = await subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    base64ToBytes(blob)
  );
  return dec.decode(plaintext);
}

// Derives master key from userId + optional passphrase.
// Salt is deterministic from userId so it's reproducible across sessions.
export async function deriveMasterKey(
  userId: string,
  passphrase?: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const saltHash = await subtle.digest("SHA-256", enc.encode(userId + "lipinotes-salt-v1"));
  const salt = new Uint8Array(saltHash).slice(0, 16);
  const pass = passphrase ? userId + ":" + passphrase : userId + ":default";
  return deriveKey(pass, salt);
}

// Derive a sub-key for a locked folder/note from master key + password + itemId
export async function deriveSubKey(
  masterKey: CryptoKey,
  password: string,
  itemId: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const masterRaw: ArrayBuffer = await subtle.exportKey("raw", masterKey);
  const masterB64 = bytesToBase64(new Uint8Array(masterRaw));
  const passphrase = masterB64 + ":" + password + ":" + itemId;
  const saltHash = await subtle.digest("SHA-256", enc.encode(itemId + "lipinotes-subkey-v1"));
  const salt = new Uint8Array(saltHash).slice(0, 16);
  return deriveKey(passphrase, salt);
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hash: ArrayBuffer = await subtle.digest("SHA-256", enc.encode(password));
  return bytesToBase64(new Uint8Array(hash));
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
