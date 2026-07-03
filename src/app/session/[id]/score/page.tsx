'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Award, ArrowRight, BookOpen, Clock, Code, MessageSquare, Star } from 'lucide-react';

export default function ScorePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: session, status } = useSession();

  // Rubric scores state
  const [problemSolving, setProblemSolving] = useState(5);
  const [codeQuality, setCodeQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [speed, setSpeed] = useState(5);
  const [feedback, setFeedback] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');

  // Live recalculate overall score
  const overallScore = (problemSolving + codeQuality + communication + speed) / 4;

  useEffect(() => {
    // Basic verification of session state
    const fetchSessionInfo = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}/ended-summary`);
        if (res.ok) {
          // Verify if already scored, if so redirect
          const data = await res.json();
          if (data.hasScore) {
            router.replace(`/reports/${id}`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSessionInfo();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/sessions/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemSolving,
          codeQuality,
          communication,
          speed,
          feedback,
        }),
      });

      if (res.ok) {
        router.push(`/reports/${id}`);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to submit scores.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Failed to submit scores.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl relative overflow-hidden space-y-8">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-steel/15 rounded-full blur-2xl pointer-events-none"></div>
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
              <Award className="w-6 h-6 text-steel-light" />
              Interview Evaluation
            </h1>
            <p className="text-xs text-slate-400 mt-1">Submit rubric feedback to generate the session report.</p>
          </div>
          
          {/* Live Overall Score */}
          <div className="bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Overall Score</span>
            <span className="text-2xl font-black text-steel-light">{overallScore.toFixed(2)}<span className="text-xs text-slate-500 font-normal">/10</span></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-danger text-danger text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Problem Solving */}
            <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  Problem Solving
                </span>
                <span className="text-sm font-black text-steel-light">{problemSolving}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={problemSolving}
                onChange={(e) => setProblemSolving(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-steel"
              />
              <p className="text-[10px] text-slate-500">Algorithmic approach, edge-case coverage, code structure design.</p>
            </div>

            {/* Code Quality */}
            <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wide flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-slate-500" />
                  Code Quality
                </span>
                <span className="text-sm font-black text-steel-light">{codeQuality}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={codeQuality}
                onChange={(e) => setCodeQuality(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-steel"
              />
              <p className="text-[10px] text-slate-500">Syntax mastery, naming conventions, readability, structuring.</p>
            </div>

            {/* Communication */}
            <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  Communication
                </span>
                <span className="text-sm font-black text-steel-light">{communication}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={communication}
                onChange={(e) => setCommunication(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-steel"
              />
              <p className="text-[10px] text-slate-500">Explaining ideas, receptive to hints, constructive collaboration.</p>
            </div>

            {/* Speed */}
            <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-350 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Speed & Efficiency
                </span>
                <span className="text-sm font-black text-steel-light">{speed}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-steel"
              />
              <p className="text-[10px] text-slate-500">Pacing of completion, optimization latency, debugging resolve.</p>
            </div>

          </div>

          {/* Feedback Area */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Structured Written Feedback & Observations
            </label>
            <textarea
              required
              rows={6}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Detail observations about candidate logic, algorithmic improvements, speed, or soft-skills here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-300 text-sm focus:outline-none placeholder-slate-650 focus:ring-1 focus:ring-steel h-36 resize-none"
            />
          </div>

          {/* Footer controls */}
          <div className="border-t border-slate-800 pt-5 flex items-center justify-end gap-3 select-none">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-steel hover:bg-steel-light text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow hover:shadow-steel/20 hover:translate-y-[-0.5px] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit & Generate Report'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
