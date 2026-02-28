'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import FileUploader from '@/app/components/FileUploader';
import FileList from '@/app/components/FileList';
import DocumentViewer from '@/app/components/DocumentViewer';
import StatusMessage from '@/app/components/StatusMessage';
import { UploadedFile } from '@/app/lib/types';
import { listFiles } from '@/app/lib/api';

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

  const handleSummaryGenerated = (fileId: string, summary: string) => {
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, summary } : f));
    setSelectedFile((prev) => prev?.id === fileId ? { ...prev, summary } : prev);
  };

  const handleError = (message: string) => {
    setStatus({ message, type: 'error' });
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 container mx-auto px-4 py-8 gap-6">
        <aside className="w-80 flex flex-col gap-4 shrink-0">
          <FileUploader onUploadComplete={handleUploadComplete} onError={handleError} />
          {loadingFiles ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400 animate-pulse">
              Loading documents…
            </div>
          ) : (
            <FileList files={files} selectedFile={selectedFile} onSelect={setSelectedFile} onDelete={handleDelete} />
          )}
        </aside>
        <section className="flex-1 flex flex-col gap-4">
          {status && <StatusMessage message={status.message} type={status.type} onClose={() => setStatus(null)} />}
          <DocumentViewer file={selectedFile} onError={handleError} onSummaryGenerated={handleSummaryGenerated} />
        </section>
      </div>
    </main>
  );
}
