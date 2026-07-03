'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FileText, Download, Code, MessageSquare, Award, Clock, ArrowLeft, Terminal } from 'lucide-react';
import Link from 'next/link';

interface ReportPayload {
  sessionTitle: string;
  startedAt: string | null;
  endedAt: string | null;
  finalCode: string;
  language: string;
  chat: Array<{
    sender: string;
    role: string;
    message: string;
    sentAt: string;
  }>;
  runs: Array<{
    triggeredBy: string;
    status: string;
    timeMs: number | null;
    memoryKb: number | null;
    runAt: string;
  }>;
  comments: Array<{
    author: string;
    lineStart: number;
    lineEnd: number;
    body: string;
    createdAt: string;
  }>;
  scores: {
    problemSolving: number;
    codeQuality: number;
    communication: number;
    speed: number;
    overall: number;
  };
  feedback: string;
  privateNotes: string;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: session, status } = useSession();
  
  const [report, setReport] = useState<{ id: string; payload: ReportPayload } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to load report.');
        } else {
          const data = await res.json();
          setReport(data);
        }
      } catch (err) {
        console.error(err);
        setError('Network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      if (session.user.role !== 'INTERVIEWER') {
        router.replace('/sessions'); // Redirect candidate to history
      } else {
        fetchReport();
      }
    }
  }, [id, status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <FileText className="w-12 h-12 mx-auto text-danger" />
          <h2 className="text-xl font-bold text-white">Error Loading Report</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Link href="/dashboard" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg text-xs">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return null;
  const payload = report.payload;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation header & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-all self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <a
            href={`/api/reports/${id}/pdf`}
            download
            className="inline-flex items-center justify-center gap-2 bg-steel hover:bg-steel-light text-white font-bold py-2 px-4 rounded-lg text-xs shadow-lg hover:shadow-steel/20 hover:translate-y-[-0.5px] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </a>
        </div>

        {/* Structured Document card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          
          {/* Header metadata */}
          <div className="bg-slate-950 p-8 border-b border-slate-850 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-steel-light bg-steel/10 px-2.5 py-0.5 rounded-full border border-steel/20">
                Session Report
              </span>
              <h1 className="text-2xl font-black text-white">{payload.sessionTitle}</h1>
              <p className="text-xs text-slate-450">
                Started: {payload.startedAt ? new Date(payload.startedAt).toLocaleString() : 'N/A'} &bull; Ended: {payload.endedAt ? new Date(payload.endedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            {/* Overall Score Circle */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center shrink-0 w-32">
              <span className="text-[10px] uppercase font-bold text-slate-550">Overall Score</span>
              <span className="text-3xl font-black text-teal-green mt-1">
                {payload.scores.overall.toFixed(1)}
                <span className="text-xs text-slate-500 font-normal">/10</span>
              </span>
            </div>
          </div>

          <div className="p-8 space-y-8">
            
            {/* 1. Evaluation Rubric Scores */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2 select-none">
                <Award className="w-4.5 h-4.5 text-steel-light" />
                Rubric Performance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Problem Solving', score: payload.scores.problemSolving, desc: 'Algorithmic approach, edge cases, structures.' },
                  { name: 'Code Quality', score: payload.scores.codeQuality, desc: 'Naming, structuring, syntax conventions.' },
                  { name: 'Communication', score: payload.scores.communication, desc: 'Explaining design, receptive to hints.' },
                  { name: 'Speed & Efficiency', score: payload.scores.speed, desc: 'Velocity, pacing, debugging speed.' }
                ].map((rubric) => (
                  <div key={rubric.name} className="bg-slate-950/40 border border-slate-850 p-4 rounded-lg flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200">{rubric.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">{rubric.desc}</p>
                    </div>
                    <span className="text-lg font-black text-steel-light shrink-0">
                      {rubric.score}<span className="text-[10px] text-slate-500 font-normal">/10</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Structured Feedback */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 select-none">
                Structured Written Feedback
              </h3>
              <p className="text-sm text-slate-350 bg-slate-950/40 p-4 rounded-lg border border-slate-850 whitespace-pre-line leading-relaxed">
                {payload.feedback}
              </p>
            </section>

            {/* 3. Private Notes */}
            {payload.privateNotes && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-warning border-b border-slate-800 pb-2 select-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning animate-pulse"></span>
                  Interviewer Private Notepad
                </h3>
                <p className="text-sm text-slate-400 bg-slate-950/20 p-4 rounded-lg border border-slate-850 whitespace-pre-line leading-relaxed">
                  {payload.privateNotes}
                </p>
              </section>
            )}

            {/* 4. Chat Logs & Inline Comments count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chat summary */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 select-none flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  Chat History Logs ({payload.chat?.length || 0})
                </h3>
                
                {payload.chat && payload.chat.length > 0 ? (
                  <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-lg space-y-3 max-h-48 overflow-y-auto">
                    {payload.chat.map((msg, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-bold text-slate-400">{msg.sender} ({msg.role.toLowerCase()}): </span>
                        <span className="text-slate-300">{msg.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No chat messages were exchanged.</p>
                )}
              </section>

              {/* Inline Comments summary */}
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 select-none flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-slate-500" />
                  Inline Code Comments ({payload.comments?.length || 0})
                </h3>
                
                {payload.comments && payload.comments.length > 0 ? (
                  <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-lg space-y-3 max-h-48 overflow-y-auto">
                    {payload.comments.map((cmt, i) => (
                      <div key={i} className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                          <span>{cmt.author}</span>
                          <span className="text-steel-light">Lines {cmt.lineStart}-{cmt.lineEnd}</span>
                        </div>
                        <p className="text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-900">{cmt.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No inline comments were left on code.</p>
                )}
              </section>

            </div>

            {/* 5. Runs history summary */}
            {payload.runs && payload.runs.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 select-none flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-slate-500" />
                  Code Execution Runs ({payload.runs.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {payload.runs.map((run, i) => (
                    <div key={i} className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                      <div>
                        <p className="font-bold text-slate-300 truncate max-w-[120px]">{run.status}</p>
                        <p className="text-[10px] text-slate-500">By {run.triggeredBy}</p>
                      </div>
                      {run.timeMs !== null && (
                        <span className="text-[10px] text-slate-400 shrink-0 font-bold">{run.timeMs}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Final Code Block */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 select-none flex items-center gap-1.5">
                <Code className="w-4.5 h-4.5 text-slate-500" />
                Submitted Code Solution ({payload.language})
              </h3>
              <pre className="bg-slate-950 border border-slate-850 p-5 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto select-text leading-relaxed">
                {payload.finalCode}
              </pre>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
