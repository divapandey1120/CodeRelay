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
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Role check: participant validation
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const runs = await prisma.runHistory.findMany({
      where: { sessionId: id },
      include: {
        triggeredBy: {
          select: { name: true, role: true },
        },
      },
      orderBy: { runAt: 'desc' },
    });

    return NextResponse.json(runs);
  } catch (error: any) {
    console.error('Error fetching session runs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
