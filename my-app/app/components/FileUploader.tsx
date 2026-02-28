'use client';

import { useRef, useState } from 'react';
import { uploadFile } from '@/app/lib/api';
import { UploadedFile } from '@/app/lib/types';

interface Props {
  onUploadComplete: (file: UploadedFile) => void;
  onError: (message: string) => void;
}

const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt'];
const MAX_SIZE_MB = 10;

export default function FileUploader({ onUploadComplete, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      onError(`File exceeds the ${MAX_SIZE_MB} MB limit.`);
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      onError(`Unsupported file type. Accepted: ${ACCEPTED_TYPES.join(', ')}`);
      return;
    }

    try {
      setSelectedName(file.name);
      setUploading(true);
      const uploaded = await uploadFile(file);
      onUploadComplete(uploaded);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setSelectedName(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-4 md:p-6 text-center transition-colors cursor-pointer ${
        dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <div className="space-y-1">
          <p className="text-sm text-indigo-600 font-medium">Uploading…</p>
          {selectedName && <p className="text-xs text-gray-500 truncate">{selectedName}</p>}
        </div>
      ) : selectedName ? (
        <div className="space-y-1">
          <p className="text-sm text-indigo-600 font-medium truncate">{selectedName}</p>
          <p className="text-xs text-gray-400">Ready to upload</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">Drag & drop or <span className="text-indigo-600 font-medium">browse</span></p>
          <p className="text-xs text-gray-400 mt-1">{ACCEPTED_TYPES.join(', ')} · max {MAX_SIZE_MB} MB</p>
        </>
      )}
    </div>
  );
}
