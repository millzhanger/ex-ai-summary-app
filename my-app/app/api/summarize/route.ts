import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { config } from '@/app/lib/config';
import { registryUpdateSummary } from '@/app/lib/registry';

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

const SYSTEM_PROMPT_ZH = `你是一位专业的分析师和文档摘要专家。

给定文档内容，请以**Markdown**格式生成简洁、高信息密度的中文摘要，格式如下：

**文档概述：** 一句话——文档类型及核心主题。

**要点：**
- 每条记录一个独立的事实、决策或发现。请具体说明：准确引用文中出现的数字、人名、日期和专业术语。最多6条。

**结论：** 一句话——主要结论、建议或核心要点。

规则：
- 使用Markdown（**加粗**、列表）。不要用代码块包裹。
- 每条要点必须包含具体细节——不得出现模糊或无实质内容的表述。
- 不适用的部分可省略。
- 不需要前言、元评论，仅输出以上三个部分。`;

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

    const completionParams = {
      model: config.github.model,
      max_tokens: 512,
      temperature: 0.2,
    };

    const [completion, completionZh] = await Promise.all([
      client.chat.completions.create({
        ...completionParams,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyse and summarise the following document:\n\n${truncatedText}` },
        ],
      }),
      client.chat.completions.create({
        ...completionParams,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_ZH },
          { role: 'user', content: `请分析并总结以下文档：\n\n${truncatedText}` },
        ],
      }),
    ]);

    const summary = completion.choices[0]?.message?.content?.trim() ?? 'No summary generated.';
    const summaryZh = completionZh.choices[0]?.message?.content?.trim() ?? '未能生成摘要。';

    // Persist the summaries so they survive page refresh
    try {
      await registryUpdateSummary(fileId, summary, summaryZh);
    } catch {
      // Non-fatal — still return the summaries even if persistence fails
    }

    return NextResponse.json({ summary, summaryZh });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
