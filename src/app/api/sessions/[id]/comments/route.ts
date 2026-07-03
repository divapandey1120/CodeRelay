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

    // Role verification
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { sessionId: id },
      include: {
        author: {
          select: { name: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
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
    const { lineStart, lineEnd, commentBody } = body;

    if (lineStart === undefined || lineEnd === undefined || !commentBody || commentBody.trim() === '') {
      return NextResponse.json({ error: 'Line range and comment body are required.' }, { status: 400 });
    }

    const dbSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (dbSession.status === 'ENDED') {
      return NextResponse.json({ error: 'Session has ended. Comments are locked.' }, { status: 400 });
    }

    // Role verification
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newComment = await prisma.comment.create({
      data: {
        sessionId: id,
        authorId: session.user.id,
        lineStart,
        lineEnd,
        body: commentBody.trim(),
      },
      include: {
        author: {
          select: { name: true, role: true },
        },
      },
    });

    return NextResponse.json(newComment);
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
