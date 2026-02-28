import { UploadedFile } from '@/app/lib/types';

interface Props {
  files: UploadedFile[];
  selectedFile: UploadedFile | null;
  onSelect: (file: UploadedFile) => void;
}

const icons: Record<string, string> = { pdf: '📄', docx: '📝', txt: '📃' };

function fileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export default function FileList({ files, selectedFile, onSelect }: Props) {
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
            <span className="text-lg">{icons[fileExt(file.name)] ?? '📁'}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{new Date(file.uploadedAt).toLocaleString()}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
