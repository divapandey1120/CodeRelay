import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized. Only interviewers can create sessions.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, problemId, language, scheduledAt } = body;

    if (!title) {
      return NextResponse.json({ error: 'Session title is required.' }, { status: 400 });
    }

    // Generate unique secure join token
    const joinToken = crypto.randomBytes(16).toString('hex');

    const newSession = await prisma.session.create({
      data: {
        title,
        language: language || 'javascript',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        joinToken,
        interviewerId: session.user.id,
        problemId: problemId || null,
        status: 'SCHEDULED',
      },
      include: {
        problem: true,
      },
    });

    return NextResponse.json(newSession);
  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Interviewer sees all their own sessions
    if (session.user.role === 'INTERVIEWER') {
      const sessions = await prisma.session.findMany({
        where: { interviewerId: session.user.id },
        include: {
          candidate: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          problem: {
            select: { id: true, title: true, difficulty: true },
          },
          score: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(sessions);
    } 
    
    // Candidate sees sessions they were assigned to
    if (session.user.role === 'CANDIDATE') {
      const sessions = await prisma.session.findMany({
        where: { candidateId: session.user.id },
        include: {
          interviewer: {
            select: { id: true, name: true },
          },
          problem: {
            select: { id: true, title: true, difficulty: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(sessions);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
