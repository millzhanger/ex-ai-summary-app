import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createAdminClient } from '@/app/lib/supabaseAdmin';
import { config } from '@/app/lib/config';
import { UploadedFile } from '@/app/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const id = uuidv4();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const storagePath = `uploads/${id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createAdminClient();
    const bucketName = config.supabase.storageBucket;

    // Ensure the bucket exists — create it (public) if it doesn't.
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw new Error(`Could not list buckets: ${listError.message}`);

    const bucketExists = buckets?.some((b) => b.name === bucketName);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      });
      if (createError) throw new Error(`Could not create bucket: ${createError.message}`);
    }

    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (storageError) {
      throw new Error(`Storage error: ${storageError.message}`);
    }

    const uploadedFile: UploadedFile = {
      id,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      storagePath,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
