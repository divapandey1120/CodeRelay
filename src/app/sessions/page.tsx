'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Code, BookOpen, Clock, Calendar, LogOut } from 'lucide-react';
import Link from 'next/link';

interface SessionData {
  id: string;
  title: string;
  language: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  status: string;
  problem: {
    title: string;
    difficulty: string;
  } | null;
  interviewer: {
    name: string;
  };
}

export default function CandidateSessionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user.role !== 'CANDIDATE') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };
    if (status === 'authenticated') {
      fetchHistory();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900 select-none">
        <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Code className="text-steel-light w-8 h-8" />
          <span>Code<span className="text-steel-light font-medium">Relay</span></span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">{session?.user?.name}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-teal-green/10 border border-teal-green/20 text-teal-green">
              Candidate
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Interview History</h1>
          <p className="text-sm text-slate-400 mt-1">Review the code from your past coding rounds.</p>
        </div>

        {sessions.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
            <BookOpen className="mx-auto h-12 w-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-bold text-slate-355">No sessions recorded</h3>
            <p className="text-slate-500 text-sm mt-1">You will see your coding rounds listed here once complete.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((sess) => (
              <div 
                key={sess.id}
                className="bg-slate-900 rounded-xl border border-slate-800/80 p-6 flex flex-col justify-between hover:border-slate-700 hover:translate-y-[-1px] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-extrabold uppercase bg-slate-800 text-slate-400 border border-slate-700 rounded-full px-2 py-0.5">
                      {sess.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {sess.endedAt ? new Date(sess.endedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 truncate">{sess.title}</h3>
                  
                  <div className="space-y-2 text-xs text-slate-450 mb-6">
                    <p>Interviewer: <span className="text-slate-300 font-semibold">{sess.interviewer.name}</span></p>
                    <p>Language: <span className="text-slate-305 font-bold uppercase">{sess.language}</span></p>
                    <p>Problem: <span className="text-slate-305 font-semibold">{sess.problem?.title || 'Freeform Code'}</span></p>
                  </div>
                </div>

                <Link
                  href={`/sessions/${sess.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all"
                >
                  <Code className="w-3.5 h-3.5" />
                  View Submitted Code
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
