import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { context, elementText } = await request.json();

    if (!elementText) {
      return NextResponse.json({ error: 'Missing text context' }, { status: 400 });
    }

    const prompt = `You are an expert copywriter optimizing a website for conversions.
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
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 512,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);

  } catch (e: any) {
    console.error('Groq Generation Error:', e?.message || e);
    return NextResponse.json({ error: 'Failed to generate variants' }, { status: 500 });
  }
}
