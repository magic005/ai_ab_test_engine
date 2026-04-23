import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SHORT_MODEL = 'llama-3.1-8b-instant';
const LONG_MODEL  = 'llama-3.3-70b-versatile';
const LONG_TEXT_THRESHOLD = 300;

export const DIAGRAM_PREFIX = 'MERMAID:';
export const GAME_PREFIX    = 'GAME:';

// --- Sprite / background asset catalogs (OCS site-relative paths) ---
const SPRITES: Record<string, { src: string; pixels: object; orientation: object; scale: number; down: object }> = {
  // r2_idle: animated 3-frame sprite — confirmed working in GameLevelBasic
  r2:          { src: '/images/gamify/r2_idle.png',       pixels: { width: 505, height: 223 }, orientation: { rows: 1, columns: 3 }, scale: 8,   down: { row: 0, start: 0, columns: 3 } },
  // frankSinatra: static single-frame portrait — confirmed working in GameLevelAirport
  frankSinatra:{ src: '/images/gamify/frankSinatra.png',  pixels: { width: 280, height: 281 }, orientation: { rows: 1, columns: 1 }, scale: 5,   down: { row: 0, start: 0, columns: 1 } },
  // schwabbman: static single-frame tall sprite — confirmed working in GameLevelAirport
  schwabbman:  { src: '/images/gamify/schwabbman.png',    pixels: { width: 398, height: 747 }, orientation: { rows: 1, columns: 1 }, scale: 6,   down: { row: 0, start: 0, columns: 1 } },
};

const BACKGROUNDS: Record<string, { src: string; pixels: object }> = {
  desert: { src: '/images/gamify/desert.png',               pixels: { height: 580, width: 1038 } },
  clouds: { src: '/images/gamebuilder/bg/clouds.jpg',       pixels: { height: 720, width: 1280 } },
  alien:  { src: '/images/gamebuilder/bg/alien_planet.jpg', pixels: { height: 720, width: 1280 } },
};

export async function POST(request: Request) {
  try {
    const { context, elementText, mode } = await request.json();

    if (!elementText) {
      return NextResponse.json({ error: 'Missing text context' }, { status: 400 });
    }

    // ----------------------------------------------------------------
    // Diagram mode: convert text block to Mermaid flowchart
    // ----------------------------------------------------------------
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

      const raw    = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);
      if (!parsed.diagram) return NextResponse.json({ error: 'Model did not return a diagram' }, { status: 500 });

      const cleanDiagram = parsed.diagram.replace(/^```(mermaid)?/gm, '').replace(/```$/gm, '').trim();
      return NextResponse.json({ diagram: DIAGRAM_PREFIX + cleanDiagram, rationale: parsed.rationale || '' });
    }

    // ----------------------------------------------------------------
    // Game mode: OCS GameEngine exploration level
    // LLM outputs structured NPC/level data; server assembles boilerplate.
    // ----------------------------------------------------------------
    if (mode === 'game') {
      const prompt = `You are an educational game designer. Extract key concepts from the following text and design an exploration game level.

Page context: "${context}"
Source text:
"""
${elementText}
"""

Extract 2-4 key concepts. Each concept becomes one NPC the player walks up to (WASD movement) and talks to (E key).

Available NPC sprites: "r2", "frankSinatra", "schwabbman" — pick a different one per NPC.
Available backgrounds: "desert", "clouds", "alien" — pick the best fit.

Return ONLY valid JSON:
{
  "background": "desert",
  "levelName": "ConceptExplorer",
  "rationale": "One sentence on why an interactive game may outperform static text",
  "npcs": [
    {
      "id": "Short NPC name (concept-based)",
      "sprite": "r2",
      "positionX": 0.25,
      "dialogues": [
        "Accurate fact 1 about this concept (max 15 words).",
        "Accurate fact 2 (max 15 words).",
        "Accurate fact 3 (max 15 words)."
      ]
    }
  ]
}

NPC positionX spacing: 2 NPCs → [0.3, 0.65], 3 NPCs → [0.25, 0.5, 0.75], 4 NPCs → [0.2, 0.4, 0.6, 0.8].
Every NPC must have exactly 3 dialogues.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: LONG_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1200,
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      let parsed: any;
      try { parsed = JSON.parse(raw); }
      catch { return NextResponse.json({ error: 'Model returned invalid JSON' }, { status: 500 }); }
      if (!parsed.npcs?.length) return NextResponse.json({ error: 'Model did not return npcs' }, { status: 500 });

      const bg         = BACKGROUNDS[parsed.background] || BACKGROUNDS.desert;
      const levelName  = (parsed.levelName || 'ConceptExplorer').replace(/\s+/g, '');

      // Build NPC class entries
      const npcEntries = (parsed.npcs as any[]).map((npc: any) => {
        const sp = SPRITES[npc.sprite] || SPRITES.r2;
        return `  { class: Npc, data: {
      id: ${JSON.stringify(npc.id)},
      greeting: ${JSON.stringify((npc.dialogues?.[0] ?? 'Hello!') + ' — press E to learn more!')},
      src: path + ${JSON.stringify(sp.src)},
      SCALE_FACTOR: ${sp.scale}, ANIMATION_RATE: 100,
      pixels: ${JSON.stringify(sp.pixels)},
      INIT_POSITION: { x: width * ${npc.positionX}, y: height * 0.6 },
      orientation: ${JSON.stringify(sp.orientation)},
      down: ${JSON.stringify(sp.down)},
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: ${JSON.stringify(npc.dialogues)},
      interact: function() { this.showRandomDialogue(); },
    } }`;
      });

      // Assemble final GameEngine ES module — boilerplate is always correct
      const gameCode = `import GameControl from '/assets/js/GameEnginev1.1/essentials/GameControl.js';
import GameEnvBackground from '/assets/js/GameEnginev1.1/essentials/GameEnvBackground.js';
import Player from '/assets/js/GameEnginev1.1/essentials/Player.js';
import Npc from '/assets/js/GameEnginev1.1/essentials/Npc.js';

class ${levelName} {
  constructor(gameEnv) {
    const path   = gameEnv.path;
    const width  = gameEnv.innerWidth;
    const height = gameEnv.innerHeight;

    const bgData = {
      name: 'background',
      src: path + ${JSON.stringify(bg.src)},
      pixels: ${JSON.stringify(bg.pixels)},
    };

    const playerData = {
      id: 'Explorer',
      greeting: 'Use WASD to move. Walk up to a character and press E to learn.',
      src: path + '/images/gamify/chillguy.png',
      SCALE_FACTOR: 5, STEP_FACTOR: 1000, ANIMATION_RATE: 50,
      INIT_POSITION: { x: 50, y: height - (height / 5) },
      pixels: { height: 384, width: 512 },
      orientation: { rows: 3, columns: 4 },
      down:      { row: 0, start: 0, columns: 3 },
      downRight: { row: 1, start: 0, columns: 3, rotate: Math.PI / 16 },
      downLeft:  { row: 2, start: 0, columns: 3, rotate: -Math.PI / 16 },
      left:      { row: 2, start: 0, columns: 3 },
      right:     { row: 1, start: 0, columns: 3 },
      up:        { row: 0, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
      keypress:  { up: 87, left: 65, down: 83, right: 68 },
    };

    this.classes = [
      { class: GameEnvBackground, data: bgData },
      { class: Player, data: playerData },
${npcEntries.join(',\n')}
    ];
  }
}

export const gameLevelClasses = [${levelName}];
export { GameControl };
`;

      return NextResponse.json({
        game: GAME_PREFIX + gameCode,
        rationale: parsed.rationale || 'Interactive game variant of the original text block.',
      });
    }

    // ----------------------------------------------------------------
    // Standard text variant mode
    // ----------------------------------------------------------------
    const isLong = elementText.length > LONG_TEXT_THRESHOLD;
    const model  = isLong ? LONG_MODEL : SHORT_MODEL;

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
    const parsed  = JSON.parse(content);
    return NextResponse.json(parsed);

  } catch (e: any) {
    console.error('Groq Generation Error:', e?.message || e);
    return NextResponse.json({ error: 'Failed to generate variants' }, { status: 500 });
  }
}
