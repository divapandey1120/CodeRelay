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
      return NextResponse.json({ error: 'Unauthorized. Reports are interviewer-only.' }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.sessionReport.findUnique({
      where: { sessionId: id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify ownership
    const dbSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!dbSession || dbSession.interviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden. You do not own this report.' }, { status: 403 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching report details:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
