import { NextResponse } from 'next/server';
import prisma from '@/prisma/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: { variants: { include: { events: true } } },
  });

  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

  const variants = test.variants.map((v) => {
    const views = v.events.filter((e) => e.type === 'view').length;
    const conversions = v.events.filter((e) => e.type === 'conversion').length;
    const rate = views > 0 ? Math.round((conversions / views) * 10000) / 100 : 0;
    return { id: v.id, name: v.name, content: v.content, traffic: v.traffic, metadata: (v as any).metadata, views, conversions, conversionRate: rate };
  });

  return NextResponse.json({ test: { ...test, variants } });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, any> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.status !== undefined) updates.status = body.status;
  if (body.winnerId !== undefined) updates.winnerId = body.winnerId;
  if (body.goal !== undefined) updates.goal = body.goal;

  // If declaring a winner, also set status to completed
  if (body.winnerId && !body.status) updates.status = 'completed';

  const test = await prisma.test.update({
    where: { id },
    data: updates,
    include: { variants: true },
  });

  return NextResponse.json({ test });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
