'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, CornerDownLeft, Eye, Award, FileText } from 'lucide-react';
import Link from 'next/link';

interface EndedScreenProps {
  sessionTitle: string;
  role: 'INTERVIEWER' | 'CANDIDATE';
  sessionId: string;
}

export default function EndedScreen({
  sessionTitle,
  role,
  sessionId,
}: EndedScreenProps) {
  const router = useRouter();
  const [finalCode, setFinalCode] = useState('');
  const [language, setLanguage] = useState('');
  const [hasScore, setHasScore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEndedDetails = async () => {
      try {
        setLoading(true);
        // Candidates can load their final code snapshots. Interviewers can check if scored.
        const res = await fetch(`/api/sessions/${sessionId}/ended-summary`);
        if (res.ok) {
          const data = await res.json();
          setFinalCode(data.finalCode || '// No code snapshot was captured.');
          setLanguage(data.language || 'javascript');
          setHasScore(data.hasScore || false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEndedDetails();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-steel/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
              Session Ended
            </span>
            <h1 className="text-xl font-bold text-white truncate max-w-xl mx-auto" title={sessionTitle}>
              {sessionTitle}
            </h1>
            <p className="text-xs text-slate-500">
              The collaborative editor is now locked.
            </p>
          </div>
        </div>

        {/* Action Panel based on Role */}
        <div className="bg-slate-950/40 border border-slate-850 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h4 className="font-semibold text-sm text-slate-200">
              {role === 'INTERVIEWER' ? 'Next steps for Interviewer' : 'Next steps for Candidate'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              {role === 'INTERVIEWER'
                ? 'Fill out the evaluation rubric to finalize the candidate\'s scores and generate the PDF report.'
                : 'Thank you for completing the interview! You can review your final code below or go back to your history.'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-center shrink-0">
            {role === 'INTERVIEWER' ? (
              !hasScore ? (
                <button
                  onClick={() => router.push(`/session/${sessionId}/score`)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-steel hover:bg-steel-light text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  Score Candidate
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/reports/${sessionId}`)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-teal-green hover:bg-teal-green/80 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  View Report
                </button>
              )
            ) : (
              <button
                onClick={() => router.push('/sessions')}
                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold py-2.5 px-4 rounded-lg text-xs border border-slate-700 transition-all cursor-pointer"
              >
                <CornerDownLeft className="w-4 h-4" />
                Back to My Sessions
              </button>
            )}
          </div>
        </div>

        {/* Read-Only Code View */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              Final Code Snapshot ({language})
            </span>
          </div>
          {loading ? (
            <div className="h-64 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-center text-slate-500 text-xs">
              Loading snapshot...
            </div>
          ) : (
            <pre className="h-64 bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-auto whitespace-pre select-text">
              {finalCode}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
