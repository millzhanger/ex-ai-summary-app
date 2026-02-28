'use client';

import { useState } from 'react';
import Header from '@/app/components/Header';
import FileUploader from '@/app/components/FileUploader';
import FileList from '@/app/components/FileList';
import DocumentViewer from '@/app/components/DocumentViewer';
import StatusMessage from '@/app/components/StatusMessage';
import { UploadedFile } from '@/app/lib/types';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const handleUploadComplete = (file: UploadedFile) => {
    setFiles((prev) => [file, ...prev]);
    setStatus({ message: `"${file.name}" uploaded successfully.`, type: 'success' });
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
          <FileList files={files} selectedFile={selectedFile} onSelect={setSelectedFile} />
        </aside>
        <section className="flex-1 flex flex-col gap-4">
          {status && <StatusMessage message={status.message} type={status.type} onClose={() => setStatus(null)} />}
          <DocumentViewer file={selectedFile} onError={handleError} />
        </section>
      </div>
    </main>
  );
}
