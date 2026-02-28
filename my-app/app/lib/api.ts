import { UploadedFile } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch all previously uploaded files from storage. */
export async function listFiles(): Promise<UploadedFile[]> {
  const res = await fetch('/api/files');
  return handleResponse<UploadedFile[]>(res);
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
export async function summarizeDocument(file: UploadedFile, text: string): Promise<{ summary: string; summaryZh: string }> {
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId: file.id, text }),
  });
  return handleResponse<{ summary: string; summaryZh: string }>(res);
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

/** Delete a file from storage and the documents table. */
export async function deleteFile(storagePath: string, id: string): Promise<void> {
  const res = await fetch('/api/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storagePath, id }),
  });
  await handleResponse<{ success: boolean }>(res);
}

/** Clear the file registry (use when files show "Object not found" errors). */
export async function resetRegistry(): Promise<void> {
  const res = await fetch('/api/reset', { method: 'DELETE' });
  await handleResponse<{ message: string }>(res);
}

/** Download a file by fetching a signed URL then triggering a browser download. */
export async function downloadFile(storagePath: string, fileName: string): Promise<void> {
  const url = await getPreviewUrl(storagePath);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
