'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Code, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');

  useEffect(() => {
    const checkToken = async () => {
      try {
        const res = await fetch(`/api/join/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to join the session.');
          setLoading(false);
          return;
        }

        if (data.valid) {
          if (data.authenticated) {
            // Already logged in, redirect directly to room
            router.replace(data.redirectUrl);
          } else {
            // Not logged in, redirect to register with candidate role & join url preserved
            setSessionTitle(data.sessionTitle);
            const redirectUrl = `/register?role=CANDIDATE&redirect=${encodeURIComponent(`/join/${token}`)}`;
            router.replace(redirectUrl);
          }
        }
      } catch (err) {
        console.error('Error joining session:', err);
        setError('A network error occurred. Please refresh or try again.');
        setLoading(false);
      }
    };

    checkToken();
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold">Verifying your invitation link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden text-center">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-danger/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-danger/15 text-danger border border-danger/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Invitation Link Error
            </h1>
            <p className="text-sm text-slate-400">
              {error}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all"
            >
              Go to Homepage
            </Link>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 text-slate-400 hover:text-white text-xs transition-all"
            >
              Sign In with another account
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
