'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, Copy, Check, Play, ExternalLink, Calendar, Search, Code, CheckCircle, Clock } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
}

interface SessionData {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED';
  language: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  joinToken: string;
  problem: Problem | null;
  candidate: { name: string } | null;
  score: { overall: number } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Sessions lists state
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');

  // New Session Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Copy success animation states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, problemsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/problems'),
      ]);
      
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
      }
      
      if (problemsRes.ok) {
        const problemsData = await problemsRes.json();
        setProblems(problemsData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyLink = (sessId: string, token: string) => {
    const joinLink = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(joinLink);
    setCopiedId(sessId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessId}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (res.ok) {
        router.push(`/session/${sessId}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to start session');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Failed to start session.');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    let scheduledAt = null;
    if (scheduledDate) {
      scheduledAt = scheduledTime 
        ? `${scheduledDate}T${scheduledTime}`
        : `${scheduledDate}T12:00:00`;
    }

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          problemId: selectedProblemId || undefined,
          language: selectedLanguage,
          scheduledAt,
        }),
      });

      if (res.ok) {
        const newSess = await res.json();
        setSessions((prev) => [newSess, ...prev]);
        setIsModalOpen(false);
        // Reset form
        setNewTitle('');
        setSelectedProblemId('');
        setSelectedLanguage('javascript');
        setScheduledDate('');
        setScheduledTime('');
      } else {
        const err = await res.json();
        setCreateError(err.error || 'Failed to create session');
      }
    } catch (err) {
      setCreateError('Network error. Failed to create session.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.candidate?.name && s.candidate.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.problem?.title && s.problem.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'active') return s.status === 'ACTIVE';
    if (activeTab === 'upcoming') return s.status === 'SCHEDULED';
    if (activeTab === 'past') return s.status === 'ENDED';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Interviews</h1>
          <p className="text-slate-400 text-sm mt-1">Manage, schedule, and review coding interview sessions.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-steel hover:bg-steel-light text-white font-bold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-steel/20 hover:translate-y-[-1px] transition-all cursor-pointer self-start sm:self-center text-sm"
        >
          <Plus className="w-5 h-5" />
          New Session
        </button>
      </div>

      {/* Tabs and Search Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        {/* Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 self-start">
          {(['all', 'active', 'upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-steel text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search interviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-steel focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-steel border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-semibold">Loading interviews...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
          <Code className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No interviews found</h3>
          <p className="text-slate-500 text-sm mt-1">Try resetting your filters or create a new session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((sess) => {
            const isCopied = copiedId === sess.id;
            return (
              <div
                key={sess.id}
                className={`bg-slate-900 rounded-xl border border-slate-800/80 shadow-md p-6 relative overflow-hidden transition-all hover:border-slate-700 flex flex-col justify-between ${
                  sess.status === 'ACTIVE' ? 'ring-1 ring-teal-green border-transparent' : ''
                }`}
              >
                {/* Visual indicator for active sessions */}
                {sess.status === 'ACTIVE' && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-teal-green"></div>
                )}
                
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sess.status === 'ACTIVE' 
                          ? 'bg-teal-green/10 text-teal-green border border-teal-green/20' 
                          : sess.status === 'SCHEDULED'
                            ? 'bg-amber-500/10 text-warning border border-warning/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {sess.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-teal-green animate-ping"></span>}
                        {sess.status}
                      </span>
                    </div>
                    {sess.status === 'ENDED' && sess.score && (
                      <span className="text-xs font-bold bg-steel/10 border border-steel/20 text-steel-light rounded-lg px-2 py-0.5">
                        Score: {sess.score.overall.toFixed(1)}/10
                      </span>
                    )}
                  </div>

                  {/* Title & metadata */}
                  <h3 className="text-lg font-bold text-white mb-2 truncate" title={sess.title}>
                    {sess.title}
                  </h3>

                  <div className="space-y-2 text-xs text-slate-400 mb-6">
                    <p className="flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-slate-500" />
                      Language: <span className="text-slate-300 font-semibold">{sess.language}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Problem: <span className="text-slate-300 font-semibold">{sess.problem?.title || 'Freeform'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Scheduled: <span className="text-slate-300 font-semibold">
                        {sess.scheduledAt ? new Date(sess.scheduledAt).toLocaleString() : 'As soon as started'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80 mt-auto">
                  {sess.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => handleStartSession(sess.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-steel hover:bg-steel-light text-white font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start Session
                      </button>
                      <button
                        onClick={() => handleCopyLink(sess.id, sess.joinToken)}
                        className="inline-flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white p-2 rounded-lg text-xs transition-all cursor-pointer relative"
                        title="Copy candidate join link"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-teal-green" /> : <Copy className="w-4 h-4" />}
                        {isCopied && (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-teal-green text-[10px] font-bold py-0.5 px-1.5 rounded border border-teal-green/20 shadow">
                            Copied!
                          </span>
                        )}
                      </button>
                    </>
                  )}

                  {sess.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => router.push(`/session/${sess.id}`)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-teal-green hover:bg-teal-green/80 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Room
                      </button>
                      <button
                        onClick={() => handleCopyLink(sess.id, sess.joinToken)}
                        className="inline-flex items-center justify-center bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white p-2 rounded-lg text-xs transition-all cursor-pointer relative"
                        title="Copy candidate join link"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-teal-green" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </>
                  )}

                  {sess.status === 'ENDED' && (
                    <button
                      onClick={() => router.push(`/reports/${sess.id}`)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 hover:text-white font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                      View Report
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden relative">
            {/* Visual background accents inside modal */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-steel/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create New Session</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-900/30 border border-danger text-danger text-sm rounded-lg p-3 text-center">
                  {createError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineer Interview - Alex"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
                />
              </div>

              {/* Problem Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Problem
                </label>
                <select
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all cursor-pointer"
                >
                  <option value="">Freeform Code (No preloaded description)</option>
                  {problems.map((prob) => (
                    <option key={prob.id} value={prob.id}>
                      {prob.title} ({prob.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Default */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Default Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all cursor-pointer"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              {/* Schedule time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Scheduled Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Scheduled Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    disabled={!scheduledDate}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-steel transition-all cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-steel hover:bg-steel-light text-white font-bold py-2 px-5 rounded-lg text-xs shadow hover:shadow-steel/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
