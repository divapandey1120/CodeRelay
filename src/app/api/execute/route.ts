import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Map internal language identifiers to Judge0 Language IDs
const LANGUAGE_ID_MAP: Record<string, number> = {
  javascript: 93, // Node.js (18.15.0)
  typescript: 94, // TypeScript (5.0.3)
  python: 92,     // Python (3.11.2)
  java: 91,       // Java (JDK 17.0.6)
  cpp: 76,        // C++ (GCC 9.2.0)
  c: 75,          // C (GCC 9.2.0)
  go: 95,         // Go (1.20.3)
  rust: 90,       // Rust (1.68.2)
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, code, language, stdin } = body;

    if (!sessionId || code === undefined || !language) {
      return NextResponse.json({ error: 'SessionId, code, and language are required.' }, { status: 400 });
    }

    // 1. Verify session exists and is ACTIVE
    const dbSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!dbSession) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    if (dbSession.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Code can only be executed during an active session.' }, { status: 400 });
    }

    // Auth verification
    const isInterviewer = dbSession.interviewerId === session.user.id;
    const isCandidate = dbSession.candidateId === session.user.id;

    if (!isInterviewer && !isCandidate) {
      return NextResponse.json({ error: 'Forbidden. You are not a participant in this session.' }, { status: 403 });
    }

    // 2. Fetch Judge0 Credentials from Environment
    const judge0Url = process.env.JUDGE0_API_URL;
    const judge0Key = process.env.JUDGE0_API_KEY;

    if (!judge0Url) {
      return NextResponse.json({ error: 'Code execution service is not configured.' }, { status: 500 });
    }

    const languageId = LANGUAGE_ID_MAP[language.toLowerCase()];
    if (!languageId) {
      return NextResponse.json({ error: `Language '${language}' is not supported for execution.` }, { status: 400 });
    }

    // 3. Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // If using RapidAPI endpoint, add RapidAPI headers. Otherwise add standard auth token
    if (judge0Url.includes('rapidapi.com')) {
      headers['X-RapidAPI-Key'] = judge0Key || '';
      headers['X-RapidAPI-Host'] = new URL(judge0Url).hostname;
    } else if (judge0Key) {
      headers['X-Auth-Token'] = judge0Key;
    }

    // 4. Submit code to Judge0
    const submissionBody = {
      source_code: code,
      language_id: languageId,
      stdin: stdin || '',
    };

    // Try executing with wait=true (synchronous execution)
    const submitUrl = `${judge0Url.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`;
    console.log(`Submitting to Judge0: ${submitUrl}`);

    const response = await fetch(submitUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(submissionBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Judge0 execution error:', errText);
      return NextResponse.json({ error: 'Failed to contact code execution engine.' }, { status: 502 });
    }

    let result = await response.json();
    
    // 5. Fallback polling loop if the response is queued/processing instead of completed
    if (result.status && [1, 2].includes(result.status.id)) {
      const token = result.token;
      let statusId = result.status.id;
      let attempts = 0;
      const maxAttempts = 15;

      while ([1, 2].includes(statusId) && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const pollRes = await fetch(`${judge0Url.replace(/\/$/, '')}/submissions/${token}?base64_encoded=false`, {
          method: 'GET',
          headers,
        });

        if (pollRes.ok) {
          result = await pollRes.json();
          statusId = result.status?.id || 3;
        }
        attempts++;
      }
    }

    // 6. Parse and normalize output fields
    const stdout = result.stdout || '';
    const stderr = result.stderr || result.compile_output || '';
    const statusDescription = result.status?.description || 'Unknown Status';
    const timeMs = result.time ? Math.round(parseFloat(result.time) * 1000) : null;
    const memoryKb = result.memory || null;

    // 7. Save run history log to database
    const historyEntry = await prisma.runHistory.create({
      data: {
        sessionId,
        triggeredById: session.user.id,
        code,
        language,
        stdin: stdin || null,
        stdout: stdout || null,
        stderr: stderr || null,
        status: statusDescription,
        timeMs,
        memoryKb,
      },
      include: {
        triggeredBy: {
          select: { name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      runId: historyEntry.id,
      stdout,
      stderr,
      status: statusDescription,
      timeMs,
      memoryKb,
      triggeredBy: historyEntry.triggeredBy.name,
      runAt: historyEntry.runAt,
    });
  } catch (error: any) {
    console.error('Error executing code:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
