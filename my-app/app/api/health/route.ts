import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabaseAdmin';
import { config } from '@/app/lib/config';

export const runtime = 'nodejs';

async function checkSupabase(): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.getBucket(config.supabase.storageBucket);
    return !error;
  } catch {
    return false;
  }
}

async function checkGitHub(): Promise<boolean> {
  return Boolean(config.github.token);
}

export async function GET() {
  const [supabaseOk, githubOk] = await Promise.all([checkSupabase(), checkGitHub()]);

  const status = supabaseOk && githubOk ? 'ok' : 'degraded';

  return NextResponse.json(
    { status, services: { supabase: supabaseOk, github: githubOk } },
    { status: status === 'ok' ? 200 : 503 },
  );
}
