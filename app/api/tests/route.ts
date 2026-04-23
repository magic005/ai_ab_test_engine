import { NextResponse } from 'next/server';
import prisma from '@/prisma/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const includeAll = searchParams.get('all') === 'true';

  const tests = await prisma.test.findMany({
    where: includeAll ? { projectId } : { projectId, status: 'live' },
    include: {
      variants: { include: { events: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tests });
}
