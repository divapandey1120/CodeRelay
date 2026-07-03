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

    if (!session || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized. Private notes are interviewer-only.' }, { status: 401 });
    }

    const { id } = await params;

    const dbSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (dbSession.interviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this session.' }, { status: 403 });
    }

    const note = await prisma.interviewerNote.findUnique({
      where: { sessionId: id },
    });

    return NextResponse.json({ body: note?.body || '' });
  } catch (error: any) {
    console.error('Error fetching interviewer notes:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized. Private notes are interviewer-only.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { noteBody } = body;

    if (noteBody === undefined) {
      return NextResponse.json({ error: 'noteBody is required.' }, { status: 400 });
    }

    const dbSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (dbSession.interviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this session.' }, { status: 403 });
    }

    if (dbSession.status === 'ENDED') {
      return NextResponse.json({ error: 'Session has ended. Notes are locked.' }, { status: 400 });
    }

    const note = await prisma.interviewerNote.upsert({
      where: { sessionId: id },
      update: { body: noteBody },
      create: {
        sessionId: id,
        body: noteBody,
      },
    });

    return NextResponse.json({ body: note.body });
  } catch (error: any) {
    console.error('Error saving interviewer notes:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
