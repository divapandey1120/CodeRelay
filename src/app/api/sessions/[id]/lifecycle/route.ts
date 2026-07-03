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
      return NextResponse.json({ error: 'Unauthorized. Only interviewers can transition session status.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['ACTIVE', 'ENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition. Allowed values: ACTIVE, ENDED' }, { status: 400 });
    }

    const existingSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (existingSession.interviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. You do not own this session.' }, { status: 403 });
    }

    // State machine check
    if (existingSession.status === 'ENDED') {
      return NextResponse.json({ error: 'Session has already ended and cannot be modified.' }, { status: 400 });
    }

    if (status === 'ACTIVE' && existingSession.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Only scheduled sessions can be started.' }, { status: 400 });
    }

    const updateData: any = {
      status,
    };

    if (status === 'ACTIVE') {
      updateData.startedAt = new Date();
      // Initialize an empty snap if none exists
      const firstSnapshot = await prisma.codeSnapshot.findFirst({
        where: { sessionId: id },
      });
      if (!firstSnapshot) {
        await prisma.codeSnapshot.create({
          data: {
            sessionId: id,
            code: '// Starter code template will load here\n',
            language: existingSession.language,
          },
        });
      }
    } else if (status === 'ENDED') {
      updateData.endedAt = new Date();
      updateData.joinTokenValid = false; // Invalidate candidate token
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        problem: true,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error: any) {
    console.error('Error transitioning session status:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
