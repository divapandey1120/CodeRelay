'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-steel/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-green/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header / Nav */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900 relative z-10">
        <div className="text-2xl font-bold tracking-tight text-white">
          Code<span className="text-steel-light font-medium">Relay</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold hover:text-white transition-all text-slate-300 px-3 py-2"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-steel hover:bg-steel-light text-white px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-steel/20"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center py-20 relative z-10">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-steel/30 bg-steel/5 text-steel-light text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-green animate-ping"></span>
            Real-Time Collaboration Platform
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none">
            Live technical interviews,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-steel-light to-teal-green">
              simplified and professional
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Conduct live coding sessions with real-time code synchronization, sandboxed code execution, private notes, and automatic interview report generation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/register?role=INTERVIEWER"
              className="bg-steel hover:bg-steel-light text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-steel/30 hover:translate-y-[-1px] transition-all text-center"
            >
              Sign Up as Interviewer
            </Link>
            <Link
              href="/login"
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-100 font-bold py-3 px-8 rounded-lg shadow-lg hover:translate-y-[-1px] transition-all text-center"
            >
              Join a Session
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl w-full mt-24">
          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-xl text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-lg bg-steel/10 flex items-center justify-center text-steel-light mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5V9m12.748 8c-.766-3.695-2.29-7.142-4.485-10.026m-3.14-2.08A13.908 13.908 0 0015 9.5V11.5" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-time Sync</h3>
            <p className="text-slate-400 text-sm">
              Keystroke-level code and cursor sync between interviewer and candidate with &lt;50ms perceived latency.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-xl text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-lg bg-steel/10 flex items-center justify-center text-steel-light mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Lang Execution</h3>
            <p className="text-slate-400 text-sm">
              Execute code securely using Judge0 sandboxing across JavaScript, TypeScript, Python, Go, Rust, C++, C, and Java.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-xl text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-lg bg-steel/10 flex items-center justify-center text-steel-light mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Evaluation & Notes</h3>
            <p className="text-slate-400 text-sm">
              Private notepad for interviewers and inline range comments that candidates can see and reply to.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-900 p-6 rounded-xl text-left hover:border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-lg bg-steel/10 flex items-center justify-center text-steel-light mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PDF Report Export</h3>
            <p className="text-slate-400 text-sm">
              Instantly compile scores, chat history, inline comments, final code, and execution run logs into a downloadable PDF report.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-slate-900 text-center text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} CodeRelay. All rights reserved.
      </footer>
    </div>
  );
}
