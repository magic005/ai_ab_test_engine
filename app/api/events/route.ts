import { NextResponse } from 'next/server';
import prisma from '@/prisma/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { variantId, type, userId } = body;

    if (!variantId || !type || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        variantId,
        type,
        userId
      }
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch(e) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
