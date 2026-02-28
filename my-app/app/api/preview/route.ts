import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabaseAdmin';
import { config } from '@/app/lib/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { storagePath } = await req.json();

    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(config.supabase.storageBucket)
      .createSignedUrl(storagePath, 60 * 60); // 1-hour expiry

    if (error || !data?.signedUrl) {
      throw new Error(`Could not create signed URL: ${error?.message}`);
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
