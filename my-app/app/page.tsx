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
  const [mobileView, setMobileView] = useState<'list' | 'viewer'>('list');

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
    if (selectedFile?.id === file.id) {
      setSelectedFile(null);
      setMobileView('list');
    }
    setStatus({ message: `"${file.name}" deleted.`, type: 'info' });
  };

  const handleSelect = (file: UploadedFile) => {
    setSelectedFile(file);
    setMobileView('viewer');
  };

  const handleSummaryGenerated = (fileId: string, summary: string, summaryZh: string) => {
    setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, summary, summaryZh } : f));
    setSelectedFile((prev) => prev?.id === fileId ? { ...prev, summary, summaryZh } : prev);
  };

  const handleError = (message: string) => {
    setStatus({ message, type: 'error' });
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileView === 'list'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-gray-500'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setMobileView('viewer')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileView === 'viewer'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-gray-500'
          }`}
        >
          {selectedFile ? selectedFile.name.length > 20 ? selectedFile.name.slice(0, 20) + '…' : selectedFile.name : 'Viewer'}
        </button>
      </div>

      <div className="flex flex-1 container mx-auto px-4 py-4 md:py-8 gap-6 min-h-0">
        {/* Sidebar — always visible on md+, conditionally on mobile */}
        <aside className={`w-full md:w-80 flex flex-col gap-4 shrink-0 ${
          mobileView === 'list' ? 'flex' : 'hidden md:flex'
        }`}>
          <FileUploader onUploadComplete={handleUploadComplete} onError={handleError} />
          {loadingFiles ? (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400 animate-pulse">
              Loading documents…
            </div>
          ) : (
            <FileList files={files} selectedFile={selectedFile} onSelect={handleSelect} onDelete={handleDelete} />
          )}
        </aside>

        {/* Viewer — always visible on md+, conditionally on mobile */}
        <section className={`flex-1 flex flex-col gap-4 min-w-0 ${
          mobileView === 'viewer' ? 'flex' : 'hidden md:flex'
        }`}>
          {status && <StatusMessage message={status.message} type={status.type} onClose={() => setStatus(null)} />}
          <DocumentViewer file={selectedFile} onError={handleError} onSummaryGenerated={handleSummaryGenerated} />
        </section>
      </div>
    </main>
  );
}
