'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Code, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

export default function CandidateCodeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: session, status } = useSession();
  
  const [finalCode, setFinalCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [sessionTitle, setSessionTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        // We use the ended-summary endpoint because it is scoped and safe for candidates!
        const res = await fetch(`/api/sessions/${id}/ended-summary`);
        if (!res.ok) {
          setError('Failed to fetch details or you do not have permission.');
        } else {
          const data = await res.json();
          setFinalCode(data.finalCode || '// No code was saved.');
          setLanguage(data.language || 'javascript');
          setSessionTitle('Interview Code Review');
        }
      } catch (err) {
        console.error(err);
        setError('Network error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      if (session.user.role !== 'CANDIDATE') {
        router.replace('/dashboard');
      } else {
        fetchSessionData();
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
          <Eye className="w-12 h-12 mx-auto text-danger" />
          <h2 className="text-xl font-bold text-white">Error Loading Code</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <Link href="/sessions" className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg text-xs">
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between select-none">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Link>
        </div>

        {/* Code display card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-slate-950 p-6 border-b border-slate-850 flex items-center gap-3">
            <Code className="text-steel-light w-6 h-6" />
            <div>
              <h1 className="text-lg font-bold text-white">{sessionTitle}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Language: {language}</p>
            </div>
          </div>
          <div className="p-6">
            <pre className="bg-slate-950 border border-slate-850 p-6 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto select-text leading-relaxed h-[60vh]">
              {finalCode}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
