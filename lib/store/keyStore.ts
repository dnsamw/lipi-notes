import { create } from "zustand";

// In-memory only. Never persisted to localStorage or cookies.
interface KeyStore {
  masterKey: CryptoKey | null;
  subKeys: Record<string, CryptoKey>;
  setMasterKey: (key: CryptoKey) => void;
  setSubKey: (id: string, key: CryptoKey) => void;
  getSubKey: (id: string) => CryptoKey | null;
  clearAll: () => void;
}

export const useKeyStore = create<KeyStore>((set, get) => ({
  masterKey: null,
  subKeys: {},
  setMasterKey: (key) => set({ masterKey: key }),
  setSubKey: (id, key) =>
    set((state) => ({ subKeys: { ...state.subKeys, [id]: key } })),
  getSubKey: (id) => get().subKeys[id] ?? null,
  clearAll: () => set({ masterKey: null, subKeys: {} }),
}));
