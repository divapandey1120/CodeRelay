import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import InterviewerShell from '@/components/session/InterviewerShell';
import CandidateShell from '@/components/session/CandidateShell';
import WaitingScreen from '@/components/session/WaitingScreen';
import EndedScreen from '@/components/session/EndedScreen';

export default async function SessionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authSession = await getServerSession(authOptions);

  if (!authSession) {
    redirect(`/login?redirect=${encodeURIComponent(`/session/${id}`)}`);
  }

  // Fetch session details from DB
  const dbSession = await prisma.session.findUnique({
    where: { id },
    include: {
      interviewer: {
        select: { id: true, name: true },
      },
      candidate: {
        select: { id: true, name: true, email: true },
      },
      problem: true,
      snapshots: {
        orderBy: { takenAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!dbSession) {
    notFound();
  }

  const userId = authSession.user.id;
  const isInterviewer = dbSession.interviewerId === userId;
  const isCandidate = dbSession.candidateId === userId;

  // Authorization check
  if (!isInterviewer && !isCandidate) {
    // Neither interviewer nor assigned candidate
    if (authSession.user.role === 'INTERVIEWER') {
      redirect('/dashboard');
    } else {
      redirect('/sessions');
    }
  }

  // Handle ENDED state
  if (dbSession.status === 'ENDED') {
    return (
      <EndedScreen
        sessionTitle={dbSession.title}
        role={isInterviewer ? 'INTERVIEWER' : 'CANDIDATE'}
        sessionId={dbSession.id}
      />
    );
  }

  // Handle SCHEDULED state
  if (dbSession.status === 'SCHEDULED') {
    if (isCandidate) {
      // Candidates see a waiting screen
      return (
        <WaitingScreen
          sessionId={dbSession.id}
          sessionTitle={dbSession.title}
          interviewerName={dbSession.interviewer.name}
        />
      );
    }
    // Interviewer sees the page but with a start banner or has the start banner on the shell
  }

  const initialCode = dbSession.snapshots[0]?.code || '';

  // Render role-specific shells
  if (isInterviewer) {
    return (
      <InterviewerShell
        sessionId={dbSession.id}
        sessionTitle={dbSession.title}
        candidateName={dbSession.candidate?.name || 'Waiting to join...'}
        problem={dbSession.problem}
        initialLanguage={dbSession.language}
        initialStatus={dbSession.status}
        initialCode={initialCode}
      />
    );
  } else {
    return (
      <CandidateShell
        sessionId={dbSession.id}
        sessionTitle={dbSession.title}
        interviewerName={dbSession.interviewer.name}
        problem={dbSession.problem}
        initialLanguage={dbSession.language}
        initialCode={initialCode}
      />
    );
  }
}
