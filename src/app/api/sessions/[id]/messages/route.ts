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

    // Auth verification
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id },
      include: {
        sender: {
          select: { name: true, role: true },
        },
      },
      orderBy: { sentAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

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
    const { message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const dbSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // State validation
    if (dbSession.status === 'ENDED') {
      return NextResponse.json({ error: 'Session has ended. Chat is closed.' }, { status: 400 });
    }

    // Role verification
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        sessionId: id,
        senderId: session.user.id,
        message: message.trim(),
      },
      include: {
        sender: {
          select: { name: true, role: true },
        },
      },
    });

    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
