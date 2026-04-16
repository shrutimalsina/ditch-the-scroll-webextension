export function createWebStorageAdapter(storage = globalThis.localStorage) {
  return {
    getItem: async (key) => storage?.getItem(key) ?? null,
    setItem: async (key, value) => storage?.setItem(key, value),
    removeItem: async (key) => storage?.removeItem(key),
  };
}
