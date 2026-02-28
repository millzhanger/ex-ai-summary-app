import { NextResponse } from 'next/server';
import { registryList } from '@/app/lib/registry';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const files = await registryList();
    return NextResponse.json(files);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
