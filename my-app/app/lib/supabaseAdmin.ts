import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client using the service role key.
 * NEVER expose this to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
      'Add it to your Vercel project settings under Settings → Environment Variables.'
    );
  }
  if (!serviceKey) {
    throw new Error(
      'Missing environment variable: SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add it to your Vercel project settings under Settings → Environment Variables.'
    );
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
