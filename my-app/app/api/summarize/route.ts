import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { config } from '@/app/lib/config';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are an expert analyst and document summarizer.

Given document text, produce a compact, high-signal summary in **Markdown** using this format:

**What it is:** One sentence — document type and core subject.

**Key points:**
- Bullet per distinct fact, decision, or finding. Be specific: include numbers, names, dates, and technical terms exactly as they appear. Max 6 bullets.

**Bottom line:** One sentence — the main conclusion, recommendation, or takeaway.

Rules:
- Use Markdown (**bold**, bullet lists). Do NOT wrap in a code block.
- Every bullet must contain a concrete detail — no vague or filler statements.
- Omit any section that does not apply.
- No preamble, no meta-commentary, nothing outside the three sections.`;

export async function POST(req: NextRequest) {
  try {
    const { fileId, text } = await req.json();

    if (!fileId || !text) {
      return NextResponse.json({ error: 'fileId and text are required.' }, { status: 400 });
    }

    if (!config.github.token) {
      return NextResponse.json({ error: 'GITHUB_TOKEN is not configured.' }, { status: 500 });
    }

    // Use the OpenAI SDK pointed at GitHub Models — fully compatible.
    const client = new OpenAI({
      apiKey: config.github.token,
      baseURL: config.github.modelsBaseUrl,
    });

    const truncatedText =
      text.length > 24000 ? text.slice(0, 24000) + '\n\n[Document truncated — content above is a partial extract]' : text;

    const completion = await client.chat.completions.create({
      model: config.github.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyse and summarise the following document:\n\n${truncatedText}` },
      ],
      max_tokens: 512,
      temperature: 0.2,
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? 'No summary generated.';

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
