import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const dbSession = await prisma.session.findUnique({
      where: { id },
      include: {
        score: { select: { id: true } },
        snapshots: {
          orderBy: { takenAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check role authorization
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const finalCode = dbSession.snapshots[0]?.code || '// No code snapshot was captured.';
    const language = dbSession.snapshots[0]?.language || dbSession.language;
    const hasScore = !!dbSession.score;

    return NextResponse.json({
      finalCode,
      language,
      hasScore,
    });
  } catch (error: any) {
    console.error('Error fetching ended summary:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
