import { UploadedFile } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Upload a file to the /api/upload endpoint. */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  return handleResponse<UploadedFile>(res);
}

/** Extract text from an already-uploaded document. */
export async function extractText(file: UploadedFile): Promise<string> {
  const res = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: file.id, storagePath: file.storagePath, mimeType: file.mimeType }),
  });
  const data = await handleResponse<{ text: string }>(res);
  return data.text;
}

/** Request an AI summary for an already-uploaded document. */
export async function summarizeDocument(file: UploadedFile, text: string): Promise<string> {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: file.id, text }),
  });
  const data = await handleResponse<{ summary: string }>(res);
  return data.summary;
}

/** Get a short-lived signed URL for previewing a stored file. */
export async function getPreviewUrl(storagePath: string): Promise<string> {
  const res = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storagePath }),
  });
  const data = await handleResponse<{ url: string }>(res);
  return data.url;
}
