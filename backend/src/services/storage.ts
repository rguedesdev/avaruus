import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../config/env.js";

const backendRoot = fileURLToPath(new URL("../../", import.meta.url));
const storageRoot = path.resolve(backendRoot, env.STORAGE_LOCAL_DIR);

function safeStorageKey(key: string) {
  if (!/^[a-zA-Z0-9/_-]+\.(?:webp|mp4|webm)$/.test(key) || key.includes("..")) {
    throw new Error("Chave de armazenamento inválida.");
  }
  return key;
}

function resolveStoragePath(key: string) {
  const target = path.resolve(storageRoot, safeStorageKey(key));
  if (!target.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Caminho de armazenamento inválido.");
  }
  return target;
}

const StorageService = {
  async uploadFile(key: string, body: Buffer) {
    const target = resolveStoragePath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body, { flag: "wx" });
  },

  async getFile(key: string) {
    return readFile(resolveStoragePath(key));
  },

  async deleteFile(key: string) {
    try {
      await unlink(resolveStoragePath(key));
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
  },
};

export { StorageService };
