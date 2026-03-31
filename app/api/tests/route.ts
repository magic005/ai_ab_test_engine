import { NextResponse } from 'next/server';
import prisma from '@/prisma/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  // Fetch all live tests for the project
  const tests = await prisma.test.findMany({
    where: { 
      projectId,
      status: 'live'
    },
    include: {
      variants: true,
    }
  });

  return NextResponse.json({ tests });
}
