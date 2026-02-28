'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { summarizeDocument, extractText, getPreviewUrl } from '@/app/lib/api';
import { UploadedFile } from '@/app/lib/types';

interface Props {
  file: UploadedFile | null;
  onError: (message: string) => void;
}

function isPdf(file: UploadedFile) {
  return file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export default function DocumentViewer({ file, onError }: Props) {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'summary'>('preview');

  useEffect(() => {
    if (!file) {
      setExtractedText(null);
      setSummary(null);
      setPreviewUrl(null);
      return;
    }
    setExtractedText(null);
    setSummary(null);
    setPreviewUrl(null);

    const pdf = isPdf(file);
    setActiveTab(pdf ? 'preview' : 'text');

    if (pdf) {
      // Load PDF preview URL
      (async () => {
        try {
          setLoadingPreview(true);
          const url = await getPreviewUrl(file.storagePath);
          setPreviewUrl(url);
        } catch (err: unknown) {
          onError(err instanceof Error ? err.message : 'Could not load PDF preview.');
        } finally {
          setLoadingPreview(false);
        }
      })();
    } else {
      // Extract text for DOCX / TXT
      (async () => {
        try {
          setLoadingExtract(true);
          const text = await extractText(file);
          setExtractedText(text);
        } catch (err: unknown) {
          onError(err instanceof Error ? err.message : 'Text extraction failed.');
        } finally {
          setLoadingExtract(false);
        }
      })();
    }
  }, [file]);

  const handleSummarize = async () => {
    if (!file) return;
    try {
      setLoadingSummary(true);
      setActiveTab('summary');
      // For PDFs we extract text on-demand (only needed for summarization)
      const text = extractedText ?? (await extractText(file));
      if (!extractedText) setExtractedText(text);
      const result = await summarizeDocument(file, text);
      setSummary(result);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Summarization failed.');
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-400 text-sm">
        Select a document to view its content and summary.
      </div>
    );
  }

  const pdf = isPdf(file);
  const tabs = pdf
    ? (['preview', 'summary'] as const)
    : (['text', 'summary'] as const);
  const tabLabels: Record<string, string> = {
    preview: 'Preview',
    text: 'Extracted Text',
    summary: 'AI Summary',
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="font-medium text-gray-800 truncate">{file.name}</p>
        <button
          onClick={handleSummarize}
          disabled={loadingSummary || loadingExtract || loadingPreview}
          className="ml-4 shrink-0 px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loadingSummary ? 'Summarizing…' : '✨ Summarize'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'preview' && (
          loadingPreview
            ? <div className="flex-1 flex items-center justify-center"><Skeleton /></div>
            : previewUrl
              ? <iframe
                  src={previewUrl}
                  className="flex-1 w-full h-full border-0"
                  title={file.name}
                />
              : <p className="p-4 text-sm text-gray-400">Preview unavailable.</p>
        )}

        {activeTab === 'text' && (
          <div className="flex-1 overflow-y-auto p-4">
            {loadingExtract
              ? <Skeleton />
              : <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">{extractedText ?? 'No text available.'}</pre>
            }
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="flex-1 overflow-y-auto p-4">
            {loadingSummary
              ? <Skeleton />
              : summary
                ? <div className="prose prose-sm prose-indigo max-w-none text-gray-700">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                : <p className="text-sm text-gray-400">Click &#34;Summarize&#34; to generate an AI summary.</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}
