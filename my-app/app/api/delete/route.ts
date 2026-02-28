import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabaseAdmin';
import { config } from '@/app/lib/config';
import { registryRemove } from '@/app/lib/registry';

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  try {
    const { storagePath, id } = await req.json();

    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Remove file from storage
    const { error: storageError } = await supabase.storage
      .from(config.supabase.storageBucket)
      .remove([storagePath]);

    if (storageError) throw new Error(`Could not delete file: ${storageError.message}`);

    // Remove from registry
    if (id) await registryRemove(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
