import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request: Request) {
  try {
    const { context, elementText } = await request.json();

    if (!elementText) {
      return NextResponse.json({ error: 'Missing text context' }, { status: 400 });
    }

    const prompt = `You are an expert copywriter optimizing a website for conversions.
The page context is: "${context}".
The user wants to A/B test this specific element text: "${elementText}".

Provide exactly 3 variant suggestions. Return ONLY valid JSON in this format:
{
  "variants": [
    { "text": "Suggestion 1", "rationale": "Why this works" },
    { "text": "Suggestion 2", "rationale": "Why this works" },
    { "text": "Suggestion 3", "rationale": "Why this works" }
  ]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192', // Replace with a fast/available model
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);

  } catch(e) {
    console.error('Groq Generation Error:', e);
    return NextResponse.json({ error: 'Failed to generate variants' }, { status: 500 });
  }
}
