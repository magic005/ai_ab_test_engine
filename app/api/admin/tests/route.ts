import { NextResponse } from 'next/server';
import prisma from '@/prisma/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, name, fingerprint, goal, goalTarget, controlText, variantText } = body;

    if (!projectId || !name || !fingerprint || !controlText || !variantText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Wrap in a transaction
    const newTest = await prisma.test.create({
      data: {
        projectId,
        name,
        fingerprint,
        goal: goal || 'pageview',
        goalTarget: goalTarget || '',
        status: 'live',
        variants: {
          create: [
            { name: 'Control', content: controlText, traffic: 50 },
            { name: 'Variant A', content: variantText, traffic: 50 }
          ]
        }
      }
    });

    return NextResponse.json({ success: true, test: newTest });
  } catch(e: any) {
    console.error('Admin Test Creation Error:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
