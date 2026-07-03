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

    if (!session || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized. Only the interviewer can score.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { problemSolving, codeQuality, communication, speed, feedback } = body;

    // Validate inputs
    const validateScore = (val: any) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 10;
    };

    if (
      !validateScore(problemSolving) ||
      !validateScore(codeQuality) ||
      !validateScore(communication) ||
      !validateScore(speed) ||
      !feedback ||
      feedback.trim() === ''
    ) {
      return NextResponse.json({ error: 'All scores must be between 1 and 10, and text feedback is required.' }, { status: 400 });
    }

    // 1. Verify session ownership and ended status
    const dbSession = await prisma.session.findUnique({
      where: { id },
      include: {
        score: true,
      },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (dbSession.interviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this session.' }, { status: 403 });
    }

    if (dbSession.status !== 'ENDED') {
      return NextResponse.json({ error: 'A session must be ended before it can be scored.' }, { status: 400 });
    }

    if (dbSession.score) {
      return NextResponse.json({ error: 'This session has already been scored.' }, { status: 400 });
    }

    const overall = (problemSolving + codeQuality + communication + speed) / 4;

    // 2. Transactionally save the score and compile the static report payload
    const result = await prisma.$transaction(async (tx) => {
      const newScore = await tx.score.create({
        data: {
          sessionId: id,
          problemSolving,
          codeQuality,
          communication,
          speed,
          overall,
          feedback: feedback.trim(),
        },
      });

      // Gather current state for report payload compilation
      const finalSnapshot = await tx.codeSnapshot.findFirst({
        where: { sessionId: id },
        orderBy: { takenAt: 'desc' },
      });

      const chatHistory = await tx.chatMessage.findMany({
        where: { sessionId: id },
        include: { sender: { select: { name: true, role: true } } },
        orderBy: { sentAt: 'asc' },
      });

      const runHistory = await tx.runHistory.findMany({
        where: { sessionId: id },
        include: { triggeredBy: { select: { name: true, role: true } } },
        orderBy: { runAt: 'asc' },
      });

      const commentsHistory = await tx.comment.findMany({
        where: { sessionId: id },
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      });

      const privateNotes = await tx.interviewerNote.findUnique({
        where: { sessionId: id },
      });

      // Compile a static JSON dump to prevent report state drift if users/problems change
      const payload = {
        sessionTitle: dbSession.title,
        startedAt: dbSession.startedAt,
        endedAt: dbSession.endedAt,
        finalCode: finalSnapshot?.code || '// No code snapshot captured.',
        language: finalSnapshot?.language || dbSession.language,
        chat: chatHistory.map(c => ({
          sender: c.sender.name,
          role: c.sender.role,
          message: c.message,
          sentAt: c.sentAt,
        })),
        runs: runHistory.map(r => ({
          triggeredBy: r.triggeredBy.name,
          role: r.triggeredBy.role,
          code: r.code,
          language: r.language,
          stdin: r.stdin,
          stdout: r.stdout,
          stderr: r.stderr,
          status: r.status,
          timeMs: r.timeMs,
          memoryKb: r.memoryKb,
          runAt: r.runAt,
        })),
        comments: commentsHistory.map(cm => ({
          author: cm.author.name,
          lineStart: cm.lineStart,
          lineEnd: cm.lineEnd,
          body: cm.body,
          createdAt: cm.createdAt,
        })),
        scores: {
          problemSolving,
          codeQuality,
          communication,
          speed,
          overall,
        },
        feedback: feedback.trim(),
        privateNotes: privateNotes?.body || '',
      };

      // Create Report row
      await tx.sessionReport.create({
        data: {
          sessionId: id,
          payload,
        },
      });

      return newScore;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error submitting scores:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
