'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Lock, Unlock, RefreshCw, AlertTriangle, MessageSquare, BookOpen, FileText, ChevronUp, ChevronDown, Check, MessageSquareCode } from 'lucide-react';
import { useSession } from 'next-auth/react';
import CodeEditor from '@/components/session/CodeEditor';
import { getStarterTemplate } from '@/lib/templates';
import { supabaseClient } from '@/lib/supabase';
import OutputPanel from '@/components/session/OutputPanel';
import ChatPanel from '@/components/session/ChatPanel';
import NotesPanel from '@/components/session/NotesPanel';
import CommentsPanel from '@/components/session/CommentsPanel';

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  sampleInput: string | null;
  sampleOutput: string | null;
  hints: string | null;
  topicTags: string[];
}

interface InterviewerShellProps {
  sessionId: string;
  sessionTitle: string;
  candidateName: string;
  problem: Problem | null;
  initialLanguage: string;
  initialStatus: string;
  initialCode: string;
}

export default function InterviewerShell({
  sessionId,
  sessionTitle,
  candidateName,
  problem,
  initialLanguage,
  initialStatus,
  initialCode,
}: InterviewerShellProps) {
  const router = useRouter();
  const { data: authSession } = useSession();
  
  const [language, setLanguage] = useState(initialLanguage);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'chat' | 'comments' | 'notes'>('problem');
  const [elapsedTime, setElapsedTime] = useState('00:00');
  
  // Code editor state
  const [code, setCode] = useState(initialCode);

  // Output panel collapse state
  const [outputCollapsed, setOutputCollapsed] = useState(true);

  // Timer simulation
  useEffect(() => {
    let seconds = 0;
    const timer = setInterval(() => {
      seconds += 1;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      setElapsedTime(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLang = e.target.value;
    setLanguage(nextLang);
    const template = getStarterTemplate(nextLang);
    setCode(template);
    
    // Broadcast language templates reset
    const channel = supabaseClient.channel(`session_editor_${sessionId}`);
    channel.send({
      type: 'broadcast',
      event: 'editor:reset',
      payload: { code: template },
    });
  };

  const handleResetEditor = () => {
    if (confirm('Are you sure you want to reset the editor to the starter template? This will erase all current code.')) {
      const template = getStarterTemplate(language);
      setCode(template);
      
      const channel = supabaseClient.channel(`session_editor_${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'editor:reset',
        payload: { code: template },
      });
    }
  };

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to end this interview session? The candidate editor will lock permanently, and you will be taken to scoring.')) {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/lifecycle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ENDED' }),
        });
        if (res.ok) {
          router.refresh(); // Triggers re-evaluation of Server Component -> redirects to EndedScreen / Score
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white max-w-[200px] truncate" title={sessionTitle}>
            {sessionTitle}
          </span>
          <span className="h-4 w-px bg-slate-800"></span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-green animate-ping"></span>
            <span>Candidate: <span className="text-slate-200 font-semibold">{candidateName}</span></span>
          </div>
          <span className="h-4 w-px bg-slate-800"></span>
          <div className="text-xs text-slate-400 font-mono">
            Elapsed: <span className="text-white font-bold">{elapsedTime}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Lock editor button */}
          <button
            onClick={handleLockToggle}
            className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              isLocked 
                ? 'bg-danger/10 border-danger text-danger' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white'
            }`}
            title={isLocked ? 'Unlock candidate editor' : 'Lock candidate editor'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isLocked ? 'Locked' : 'Lock Editor'}
          </button>

          {/* Language selector */}
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-steel transition-all cursor-pointer"
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

          {/* Reset button */}
          <button
            onClick={handleResetEditor}
            className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white py-1.5 px-3 rounded-lg text-xs transition-all cursor-pointer"
            title="Reset code editor"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* End session button */}
          <button
            onClick={handleEndSession}
            className="bg-danger hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all shadow hover:shadow-red-950/20 cursor-pointer"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Main collaborative split pane */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left pane: Monaco Editor & Output panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="flex-1 relative min-h-0">
            <CodeEditor
              sessionId={sessionId}
              userId={authSession?.user?.id || 'interviewer'}
              userName={authSession?.user?.name || 'Interviewer'}
              userRole="INTERVIEWER"
              language={language}
              setLanguage={setLanguage}
              code={code}
              setCode={setCode}
              isLocked={isLocked}
              setIsLocked={setIsLocked}
              initialCode={initialCode}
            />
          </div>

          {/* Bottom output pane */}
          <OutputPanel
            sessionId={sessionId}
            code={code}
            language={language}
            outputCollapsed={outputCollapsed}
            setOutputCollapsed={setOutputCollapsed}
          />
        </div>

        {/* Right pane: tabbed Problem/Chat/Notes panel */}
        <aside className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden min-h-0 shrink-0">
          {/* Tab buttons */}
          <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 shrink-0 justify-between select-none">
            <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-850">
              <button
                onClick={() => setActiveTab('problem')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'problem' ? 'bg-steel text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Problem
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'chat' ? 'bg-steel text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'comments' ? 'bg-steel text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquareCode className="w-3.5 h-3.5" />
                Comments
              </button>
            </div>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                activeTab === 'notes'
                  ? 'bg-navy border-steel/40 text-steel-light'
                  : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-300'
              }`}
            >
              <Lock className="w-3 h-3 text-warning" />
              Notes (Private)
            </button>
          </div>

          {/* Tab content area */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-slate-900">
            {activeTab === 'problem' && (
              <div className="space-y-4">
                {problem ? (
                  <>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-white text-lg">{problem.title}</h3>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        problem.difficulty === 'EASY'
                          ? 'bg-teal-green/10 text-teal-green border-teal-green/20'
                          : problem.difficulty === 'MEDIUM'
                            ? 'bg-amber-500/10 text-warning border border-warning/20'
                            : 'bg-red-500/10 text-danger border border-danger/20'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>

                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-lg border border-slate-850">
                      {problem.description}
                    </div>

                    {problem.sampleInput && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Sample Input</span>
                        <pre className="bg-slate-950 p-2.5 rounded text-xs font-mono text-steel-light border border-slate-850">{problem.sampleInput}</pre>
                      </div>
                    )}
                    {problem.sampleOutput && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Sample Output</span>
                        <pre className="bg-slate-950 p-2.5 rounded text-xs font-mono text-teal-green border border-slate-850">{problem.sampleOutput}</pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                    <p>Freeform Coding Session</p>
                    <p className="text-xs text-slate-650 mt-1">No preloaded problem loaded.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <ChatPanel
                sessionId={sessionId}
                currentUserId={authSession?.user?.id || ''}
                currentUserName={authSession?.user?.name || ''}
                currentUserRole="INTERVIEWER"
              />
            )}

            {activeTab === 'comments' && (
              <CommentsPanel
                sessionId={sessionId}
                currentUserId={authSession?.user?.id || ''}
                currentUserRole="INTERVIEWER"
                editorCode={code}
              />
            )}

            {activeTab === 'notes' && (
              <NotesPanel sessionId={sessionId} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
