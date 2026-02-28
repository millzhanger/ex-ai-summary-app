'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import FileUploader from '@/app/components/FileUploader';
import FileList from '@/app/components/FileList';
import DocumentViewer from '@/app/components/DocumentViewer';
import StatusMessage from '@/app/components/StatusMessage';
import { UploadedFile } from '@/app/lib/types';
import { listFiles, resetRegistry } from '@/app/lib/api';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    listFiles()
      .then(setFiles)
      .catch((err) => setStatus({ message: err.message, type: 'error' }))
      .finally(() => setLoadingFiles(false));
  }, []);

  const handleUploadComplete = (file: UploadedFile) => {
    setFiles((prev) => [file, ...prev]);
    setStatus({ message: `"${file.name}" uploaded successfully.`, type: 'success' });
  };

  const handleDelete = (file: UploadedFile) => {
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    if (selectedFile?.id === file.id) setSelectedFile(null);
    setStatus({ message: `"${file.name}" deleted.`, type: 'info' });
  };

  const handleSelect = (file: UploadedFile) => {
    setSelectedFile(file);
  };

  const handleSummaryGenerated = (fileId: string, summary: string, summaryZh: string) => {
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, summary, summaryZh } : f));
    setSelectedFile((prev) => prev?.id === fileId ? { ...prev, summary, summaryZh } : prev);
  };

  const handleError = (message: string) => {
    setStatus({ message, type: 'error' });
  };

  const handleResetRegistry = async () => {
    if (!confirm('This will clear all file records. You will need to re-upload your files. Continue?')) return;
    try {
      await resetRegistry();
      setFiles([]);
      setSelectedFile(null);
      setStatus({ message: 'Registry cleared. You can now re-upload your files.', type: 'success' });
    } catch (err) {
      setStatus({ message: err instanceof Error ? err.message : 'Reset failed.', type: 'error' });
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {status && (
        <div className="container mx-auto px-3 md:px-4 pt-3">
          <StatusMessage message={status.message} type={status.type} onClose={() => setStatus(null)} />
        </div>
      )}

      {/* ── MOBILE layout (< md): vertical stack ── */}
      <div className="md:hidden flex flex-col gap-3 px-3 py-3">
        {/* 1. Upload */}
        <FileUploader onUploadComplete={handleUploadComplete} onError={handleError} />

        {/* 2. AI Summary */}
        <div className="h-[50vh]">
          <DocumentViewer file={selectedFile} onError={handleError} onSummaryGenerated={handleSummaryGenerated} />
        </div>

        {/* 3. File list */}
        {loadingFiles ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400 animate-pulse">
            Loading documents…
          </div>
        ) : (
          <>
            <FileList files={files} selectedFile={selectedFile} onSelect={handleSelect} onDelete={handleDelete} />
            {files.length > 0 && (
              <button onClick={handleResetRegistry} className="text-xs text-red-400 hover:text-red-600 underline text-center">
                Clear registry (fix &quot;Object not found&quot; errors)
              </button>
            )}
          </>
        )}
      </div>

      {/* ── DESKTOP layout (md+): sidebar + viewer ── */}
      <div className="hidden md:flex flex-1 overflow-hidden container mx-auto px-4 py-8 gap-6 min-h-0">
        <aside className="w-80 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <FileUploader onUploadComplete={handleUploadComplete} onError={handleError} />
          {loadingFiles ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400 animate-pulse">
              Loading documents…
            </div>
          ) : (
            <>
              <FileList files={files} selectedFile={selectedFile} onSelect={handleSelect} onDelete={handleDelete} />
              {files.length > 0 && (
                <button onClick={handleResetRegistry} className="text-xs text-red-400 hover:text-red-600 underline text-center mt-1">
                  Clear registry (fix &quot;Object not found&quot; errors)
                </button>
              )}
            </>
          )}
        </aside>
        <section className="flex-1 flex flex-col gap-4 min-w-0">
          <DocumentViewer file={selectedFile} onError={handleError} onSummaryGenerated={handleSummaryGenerated} />
        </section>
      </div>
    </main>
  );
}
