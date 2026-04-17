import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SHORT_MODEL = 'llama-3.1-8b-instant';
const LONG_MODEL = 'llama-3.3-70b-versatile';
const LONG_TEXT_THRESHOLD = 300;

// Prefix used by SDK and overlay to identify diagram variants
export const DIAGRAM_PREFIX = 'MERMAID:';

export async function POST(request: Request) {
  try {
    const { context, elementText, mode } = await request.json();

    if (!elementText) {
      return NextResponse.json({ error: 'Missing text context' }, { status: 400 });
    }

    // --- Diagram mode: convert text block to Mermaid flowchart ---
    if (mode === 'diagram') {
      const prompt = `You are an expert at converting written content into clear, concise Mermaid.js flowcharts.

Page context: "${context}"

Convert the following text into a single Mermaid flowchart that captures the key concepts, steps, or relationships described in the content. Rules:
- Use "flowchart TD" (top-down) direction
- Keep node labels short (max 6 words each)
- Use --> for arrows, with brief edge labels where helpful
- Group related ideas using subgraphs if it improves clarity
- Do NOT include backticks, the word "mermaid", or any markdown — output ONLY the raw Mermaid diagram definition starting with "flowchart TD"
- Do NOT add any explanation before or after the diagram

Text to convert:
"""
${elementText}
"""

Return ONLY valid JSON in this exact format:
{
  "diagram": "<raw mermaid definition starting with flowchart TD>",
  "rationale": "One sentence explaining what the diagram shows and why it may outperform the text"
}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: LONG_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1024,
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      if (!parsed.diagram) {
        return NextResponse.json({ error: 'Model did not return a diagram' }, { status: 500 });
      }

      // Clean up: strip any accidental backticks or "mermaid" keyword the model may have included
      const cleanDiagram = parsed.diagram
        .replace(/^```(mermaid)?/gm, '')
        .replace(/```$/gm, '')
        .trim();

      return NextResponse.json({
        diagram: DIAGRAM_PREFIX + cleanDiagram,
        rationale: parsed.rationale || 'Visual flowchart variant of the original text block.',
      });
    }

    // --- Standard text variant mode ---
    const isLong = elementText.length > LONG_TEXT_THRESHOLD;
    const model = isLong ? LONG_MODEL : SHORT_MODEL;

    const prompt = isLong
      ? `You are a conversion rate optimization expert rewriting long-form web content for A/B testing.

Page context: "${context}"

Original content to rewrite:
"""
${elementText}
"""

Write exactly 3 variant rewrites of this content. Each variant must:
- Be similar in length to the original (within 20%)
- Preserve all factual information, proper nouns, and key data
- Not add or remove key points — only reframe, reorder, or rephrase
- Test a meaningfully different angle: e.g. one focuses on benefit, one on urgency, one on clarity

Return ONLY valid JSON in this exact format:
{
  "variants": [
    { "text": "Full rewritten content here", "rationale": "What angle this tests and why" },
    { "text": "Full rewritten content here", "rationale": "What angle this tests and why" },
    { "text": "Full rewritten content here", "rationale": "What angle this tests and why" }
  ]
}`
      : `You are an expert copywriter optimizing a website for conversions.
The page context is: "${context}".
The user wants to A/B test this specific element text: "${elementText}".

Provide exactly 3 variant suggestions. Return ONLY valid JSON in this exact format with no extra text:
{
  "variants": [
    { "text": "Suggestion 1", "rationale": "Why this works" },
    { "text": "Suggestion 2", "rationale": "Why this works" },
    { "text": "Suggestion 3", "rationale": "Why this works" }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: isLong ? 2048 : 512,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);

  } catch (e: any) {
    console.error('Groq Generation Error:', e?.message || e);
    return NextResponse.json({ error: 'Failed to generate variants' }, { status: 500 });
  }
}
