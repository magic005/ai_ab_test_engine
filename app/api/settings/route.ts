import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';
import { verifyToken } from '@/lib/github';

export async function GET() {
  const s = getSettings();
  return NextResponse.json({
    githubRepo: s.githubRepo || '',
    githubBranch: s.githubBranch || 'main',
    hasToken: !!s.githubToken,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const current = getSettings();

  if (body.githubToken !== undefined) current.githubToken = body.githubToken;
  if (body.githubRepo !== undefined) current.githubRepo = body.githubRepo;
  if (body.githubBranch !== undefined) current.githubBranch = body.githubBranch;

  // Verify if both token and repo are provided
  if (current.githubToken && current.githubRepo) {
    const check = await verifyToken(current.githubToken, current.githubRepo);
    if (!check.valid) {
      return NextResponse.json({ error: `GitHub auth failed: ${check.error}` }, { status: 400 });
    }
  }

  saveSettings(current);
  return NextResponse.json({
    success: true,
    githubRepo: current.githubRepo || '',
    githubBranch: current.githubBranch || 'main',
    hasToken: !!current.githubToken,
  });
}
