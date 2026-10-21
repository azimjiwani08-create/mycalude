import "server-only";
import { isLive, env } from "@/lib/env";
import { SupabaseDb } from "@/lib/db/supabase";

/**
 * Private file storage for audio, writing uploads and mock-test files.
 * Live: a private Supabase bucket, read only via short-lived signed URLs.
 * Demo: kept in memory for the life of the server process.
 */
const g = globalThis as unknown as { __eduFiles?: Map<string, { data: ArrayBuffer; type: string }> };
const mem = () => (g.__eduFiles ??= new Map());

export async function putFile(path: string, file: Blob): Promise<string> {
  if (!isLive()) {
    mem().set(path, { data: await file.arrayBuffer(), type: file.type });
    return path;
  }
  const { error } = await SupabaseDb.service().raw.storage.from(env.storageBucket()).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`storage.put: ${error.message}`);
  return path;
}

export async function getFile(path: string): Promise<File | null> {
  const name = path.split("/").pop() ?? "file";
  if (!isLive()) {
    const f = mem().get(path);
    return f ? new File([f.data], name, { type: f.type }) : null;
  }
  const { data, error } = await SupabaseDb.service().raw.storage.from(env.storageBucket()).download(path);
  if (error || !data) return null;
  return new File([data], name, { type: data.type });
}

export async function deleteFile(path: string): Promise<void> {
  if (!isLive()) {
    mem().delete(path);
    return;
  }
  await SupabaseDb.service().raw.storage.from(env.storageBucket()).remove([path]);
}

/** Signed URL valid for 10 minutes. Demo mode serves through /api/files. */
export async function signedUrl(path: string): Promise<string | null> {
  if (!isLive()) return mem().has(path) ? `/api/files?path=${encodeURIComponent(path)}` : null;
  const { data } = await SupabaseDb.service().raw.storage.from(env.storageBucket()).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
