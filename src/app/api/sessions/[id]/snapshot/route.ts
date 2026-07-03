import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { code, language } = body;

    if (code === undefined || !language) {
      return NextResponse.json({ error: 'Code and language are required.' }, { status: 400 });
    }

    const dbSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    // Auth check: Must be interviewer or candidate on this session
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sessions in ENDED status cannot receive new snapshots
    if (dbSession.status === 'ENDED') {
      return NextResponse.json({ error: 'Session has ended.' }, { status: 400 });
    }

    const snapshot = await prisma.codeSnapshot.create({
      data: {
        sessionId: id,
        code,
        language,
      },
    });

    // Optionally update current language on session
    if (dbSession.language !== language) {
      await prisma.session.update({
        where: { id },
        data: { language },
      });
    }

    return NextResponse.json(snapshot);
  } catch (error: any) {
    console.error('Error saving snapshot:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
