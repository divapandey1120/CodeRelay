import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get('difficulty');
    const topic = searchParams.get('topic');

    // Build filter query
    const whereClause: any = {
      OR: [
        { isBuiltIn: true },
        { createdById: session.user.id }
      ]
    };

    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    if (topic) {
      whereClause.topicTags = {
        has: topic
      };
    }

    const problems = await prisma.problem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(problems);
  } catch (error: any) {
    console.error('Error fetching problems:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'INTERVIEWER') {
      return NextResponse.json({ error: 'Unauthorized. Only interviewers can create problems.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, difficulty, description, sampleInput, sampleOutput, hints, topicTags } = body;

    if (!title || !difficulty || !description) {
      return NextResponse.json({ error: 'Title, difficulty, and description are required.' }, { status: 400 });
    }

    const newProblem = await prisma.problem.create({
      data: {
        title,
        difficulty, // 'EASY', 'MEDIUM', 'HARD'
        description,
        sampleInput: sampleInput || null,
        sampleOutput: sampleOutput || null,
        hints: hints || null,
        topicTags: topicTags || [],
        isBuiltIn: false,
        createdById: session.user.id
      }
    });

    return NextResponse.json(newProblem);
  } catch (error: any) {
    console.error('Error creating custom problem:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
