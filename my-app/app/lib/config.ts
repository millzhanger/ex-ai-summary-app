/** Centralised runtime configuration read from environment variables. */
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'documents',
  },
  github: {
    // In GitHub Codespaces, GITHUB_TOKEN is injected automatically.
    // For local dev, set it in .env.local.
    token: process.env.GITHUB_TOKEN ?? '',
    modelsBaseUrl: 'https://models.inference.ai.azure.com',
    model: process.env.GITHUB_MODEL ?? 'gpt-4o',
  },
} as const;
