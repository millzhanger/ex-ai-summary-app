export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  storagePath: string;
  uploadedAt: string;
  summary?: string;
}

export interface ExtractResponse {
  text: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  services: {
    supabase: boolean;
    openai: boolean;
  };
}
