import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabaseAdmin';
import { config } from '@/app/lib/config';

export const runtime = 'nodejs';

async function extractFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
    // Use the internal path to avoid pdf-parse's test-file import that breaks Next.js App Router
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(buffer);
    return data.text as string;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType.includes('docx')
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value as string;
  }

  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

export async function POST(req: NextRequest) {
  try {
    const { fileId, storagePath, mimeType } = await req.json();

    if (!fileId || !storagePath) {
      return NextResponse.json({ error: 'fileId and storagePath are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(config.supabase.storageBucket)
      .download(storagePath);

    if (error || !data) {
      throw new Error(`Could not download file: ${error?.message}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const ext = storagePath.split('.').pop()?.toLowerCase();
    const resolvedMime =
      mimeType ||
      (ext === 'pdf' ? 'application/pdf' : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain');

    const text = await extractFromBuffer(buffer, resolvedMime);

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
