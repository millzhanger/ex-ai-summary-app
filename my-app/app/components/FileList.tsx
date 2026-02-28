'use client';

import { useState } from 'react';
import { deleteFile, downloadFile } from '@/app/lib/api';
import { UploadedFile } from '@/app/lib/types';

interface Props {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  onSelect: (file: UploadedFile) => void;
  onDelete: (file: UploadedFile) => void;
}

const icons: Record<string, string> = { pdf: '📄', docx: '📝', txt: '📃' };

function fileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export default function FileList({ files, selectedFile, onSelect, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, file: UploadedFile) => {
    e.stopPropagation();
    if (!confirm(`Delete "${file.name}"?`)) return;
    try {
      setDeletingId(file.id);
      await deleteFile(file.storagePath, file.id);
      onDelete(file);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (e: React.MouseEvent, file: UploadedFile) => {
    e.stopPropagation();
    try {
      setDownloadingId(file.id);
      await downloadFile(file.storagePath, file.name);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400">
        No documents yet. Upload one above.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2 border-b border-gray-100">
        Documents ({files.length})
      </p>
      <ul>
        {files.map((file) => (
          <li
            key={file.id}
            onClick={() => onSelect(file)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-indigo-50 ${
              selectedFile?.id === file.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
            }`}
          >
            <span className="text-lg shrink-0">{icons[fileExt(file.name)] ?? '📁'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{new Date(file.uploadedAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* Download */}
              <button
                onClick={(e) => handleDownload(e, file)}
                disabled={downloadingId === file.id}
                title="Download"
                className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition-colors"
              >
                {downloadingId === file.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                )}
              </button>
              {/* Delete */}
              <button
                onClick={(e) => handleDelete(e, file)}
                disabled={deletingId === file.id}
                title="Delete"
                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                {deletingId === file.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m4-3h2a1 1 0 011 1v1H8V5a1 1 0 011-1h2" />
                  </svg>
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
