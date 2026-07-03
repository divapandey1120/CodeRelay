'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import { Clock, Code } from 'lucide-react';

interface WaitingScreenProps {
  sessionId: string;
  sessionTitle: string;
  interviewerName: string;
}

export default function WaitingScreen({
  sessionId,
  sessionTitle,
  interviewerName,
}: WaitingScreenProps) {
  const router = useRouter();

  useEffect(() => {
    // Listen for database changes to this session row
    const sessionChannel = supabaseClient
      .channel(`session_waiting_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Session',
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'ACTIVE') {
            // Re-fetch page server-side to load active shells
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(sessionChannel);
    };
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-steel/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-green/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-steel/10 border border-steel/20 flex items-center justify-center text-steel-light animate-pulse">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-steel-light bg-steel/10 px-2.5 py-0.5 rounded-full border border-steel/20">
              Scheduled
            </span>
            <h1 className="text-xl font-bold text-white truncate px-4" title={sessionTitle}>
              {sessionTitle}
            </h1>
            <p className="text-sm text-slate-400">
              Interviewer: <span className="text-slate-300 font-semibold">{interviewerName}</span>
            </p>
          </div>

          <div className="py-4 border-y border-slate-800/80">
            <p className="text-sm text-slate-300 leading-relaxed">
              Your interviewer will start the session shortly. You do not need to refresh this page — the workspace will load automatically as soon as the session begins.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
            <Code className="w-4 h-4 text-slate-600 animate-bounce" />
            <span>Connecting to collaborative environment...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
