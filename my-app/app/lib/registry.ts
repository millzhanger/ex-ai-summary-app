/**
 * A lightweight file registry stored as `_registry.json` in the storage bucket.
 * This avoids the need for a database table while preserving original filenames.
 */
import { createAdminClient } from '@/app/lib/supabaseAdmin';
import { config } from '@/app/lib/config';
import { UploadedFile } from '@/app/lib/types';

const REGISTRY_PATH = '_registry.json';

async function readRegistry(): Promise<UploadedFile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(config.supabase.storageBucket)
    .download(REGISTRY_PATH);

  if (error || !data) return []; // Not found = empty registry
  try {
    const text = await data.text();
    return JSON.parse(text) as UploadedFile[];
  } catch {
    return [];
  }
}

async function writeRegistry(files: UploadedFile[]): Promise<void> {
  const supabase = createAdminClient();
  const content = JSON.stringify(files, null, 2);
  const buffer = Buffer.from(content, 'utf-8');
  const { error } = await supabase.storage
    .from(config.supabase.storageBucket)
    .upload(REGISTRY_PATH, buffer, {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) throw new Error(`Could not write registry: ${error.message}`);
}

export async function registryList(): Promise<UploadedFile[]> {
  const files = await readRegistry();
  return files.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function registryAdd(file: UploadedFile): Promise<void> {
  const files = await readRegistry();
  files.push(file);
  await writeRegistry(files);
}

export async function registryRemove(id: string): Promise<void> {
  const files = await readRegistry();
  await writeRegistry(files.filter((f) => f.id !== id));
}
