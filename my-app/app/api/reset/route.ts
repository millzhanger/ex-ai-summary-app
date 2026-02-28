import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabaseAdmin';
import { config } from '@/app/lib/config';

export const runtime = 'nodejs';

/**
 * DELETE /api/reset
 * Removes _registry.json from storage, clearing all file metadata.
 * Use this to recover from "Object not found" errors caused by stale registry entries.
 */
export async function DELETE() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(config.supabase.storageBucket)
      .remove(['_registry.json']);

    if (error) throw new Error(`Could not reset registry: ${error.message}`);

    return NextResponse.json({ message: 'Registry cleared successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
