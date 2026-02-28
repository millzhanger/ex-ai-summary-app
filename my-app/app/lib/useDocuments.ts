'use client';

import { useState, useCallback } from 'react';
import { uploadFile, extractText, summarizeDocument } from '@/app/lib/api';
import { UploadedFile } from '@/app/lib/types';

interface UseDocumentsReturn {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  extractedText: string | null;
  summary: string | null;
  loading: { upload: boolean; extract: boolean; summarize: boolean };
  error: string | null;
  upload: (file: File) => Promise<void>;
  selectFile: (file: UploadedFile) => void;
  summarize: () => Promise<void>;
  clearError: () => void;
}

export function useDocuments(): UseDocumentsReturn {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState({ upload: false, extract: false, summarize: false });
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    try {
      setLoading((l) => ({ ...l, upload: true }));
      const uploaded = await uploadFile(file);
      setFiles((prev) => [uploaded, ...prev]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setLoading((l) => ({ ...l, upload: false }));
    }
  }, []);

  const selectFile = useCallback(async (file: UploadedFile) => {
    setSelectedFile(file);
    setExtractedText(null);
    setSummary(null);
    try {
      setLoading((l) => ({ ...l, extract: true }));
      const text = await extractText(file);
      setExtractedText(text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Text extraction failed.');
    } finally {
      setLoading((l) => ({ ...l, extract: false }));
    }
  }, []);

  const summarize = useCallback(async () => {
    if (!selectedFile) return;
    try {
      setLoading((l) => ({ ...l, summarize: true }));
      const currentText = extractedText ?? (await extractText(selectedFile));
      const result = await summarizeDocument(selectedFile, currentText);
      setSummary(result.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Summarization failed.');
    } finally {
      setLoading((l) => ({ ...l, summarize: false }));
    }
  }, [selectedFile, extractedText]);

  return {
    files, selectedFile, extractedText, summary, loading, error,
    upload, selectFile, summarize, clearError: () => setError(null),
  };
}
