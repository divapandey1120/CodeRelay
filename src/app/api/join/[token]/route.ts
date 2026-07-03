import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // 1. Find session by token
    const dbSession = await prisma.session.findUnique({
      where: { joinToken: token },
      include: {
        candidate: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Invalid join link. The session may not exist.' }, { status: 404 });
    }

    if (!dbSession.joinTokenValid || dbSession.status === 'ENDED') {
      return NextResponse.json({ error: 'This interview session has already ended or is no longer active.' }, { status: 410 });
    }

    // 2. Check auth
    const authSession = await getServerSession(authOptions);

    if (!authSession) {
      // Return details so client knows it is a valid token but needs auth
      return NextResponse.json({
        valid: true,
        authenticated: false,
        sessionTitle: dbSession.title,
      });
    }

    // If interviewer attempts to join as candidate, return error or redirect to interviewer view
    if (authSession.user.role === 'INTERVIEWER' && authSession.user.id !== dbSession.interviewerId) {
      return NextResponse.json({ error: 'You are signed in as an Interviewer. You cannot join someone else\'s session as a candidate.' }, { status: 403 });
    }

    // If interviewer joins their own session via the join link, redirect them to the session page
    if (authSession.user.role === 'INTERVIEWER' && authSession.user.id === dbSession.interviewerId) {
      return NextResponse.json({
        valid: true,
        authenticated: true,
        redirectUrl: `/session/${dbSession.id}`,
      });
    }

    // 3. Authenticated candidate is joining
    // If session doesn't have a candidate assigned, assign this candidate!
    if (!dbSession.candidateId) {
      await prisma.session.update({
        where: { id: dbSession.id },
        data: { candidateId: authSession.user.id },
      });
    } else if (dbSession.candidateId !== authSession.user.id) {
      // A different candidate is trying to join an already claimed session
      return NextResponse.json({ error: 'This session has already been claimed by another candidate.' }, { status: 403 });
    }

    // Return redirection URL to session room
    return NextResponse.json({
      valid: true,
      authenticated: true,
      redirectUrl: `/session/${dbSession.id}`,
    });
  } catch (error: any) {
    console.error('Error in join token API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
