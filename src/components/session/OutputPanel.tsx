'use client';

import React, { useState, useEffect } from 'react';
import { Play, Clock, Cpu, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, XCircle, Terminal, HelpCircle } from 'lucide-react';

interface RunHistoryItem {
  id: string;
  stdout: string | null;
  stderr: string | null;
  status: string;
  timeMs: number | null;
  memoryKb: number | null;
  stdin: string | null;
  runAt: string;
  triggeredBy: { name: string; role: string } | null;
  code: string;
}

interface OutputPanelProps {
  sessionId: string;
  code: string;
  language: string;
  outputCollapsed: boolean;
  setOutputCollapsed: (collapsed: boolean) => void;
}

export default function OutputPanel({
  sessionId,
  code,
  language,
  outputCollapsed,
  setOutputCollapsed,
}: OutputPanelProps) {
  const [stdin, setStdin] = useState('');
  const [running, setRunning] = useState(false);
  
  // Current output execution state
  const [output, setOutput] = useState<{
    stdout: string;
    stderr: string;
    status: string;
    timeMs: number | null;
    memoryKb: number | null;
    errorType?: 'platform' | 'code' | 'none';
  } | null>(null);

  // History list
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Fetch past run history on mount
  useEffect(() => {
    const fetchRunHistory = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/runs`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Error fetching run history:', err);
      }
    };
    fetchRunHistory();
  }, [sessionId]);

  const handleRunCode = async () => {
    setRunning(true);
    setOutputCollapsed(false); // Expand panel automatically
    setOutput(null);

    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          code,
          language,
          stdin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Platform level execution failure (e.g. 502 / Judge0 down)
        setOutput({
          stdout: '',
          stderr: data.error || 'Connection to execution service failed.',
          status: 'Execution Service Error',
          timeMs: null,
          memoryKb: null,
          errorType: 'platform',
        });
      } else {
        // Code level result (success, runtime error, compilation error)
        const isError = data.status !== 'Accepted';
        setOutput({
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          status: data.status,
          timeMs: data.timeMs,
          memoryKb: data.memoryKb,
          errorType: isError ? 'code' : 'none',
        });

        // Prepend to local run history
        const newRunItem: RunHistoryItem = {
          id: data.runId,
          stdout: data.stdout,
          stderr: data.stderr,
          status: data.status,
          timeMs: data.timeMs,
          memoryKb: data.memoryKb,
          stdin: stdin || null,
          runAt: data.runAt || new Date().toISOString(),
          triggeredBy: { name: data.triggeredBy || 'User', role: 'PARTICIPANT' },
          code,
        };
        setHistory((prev) => [newRunItem, ...prev]);
      }
    } catch (err: any) {
      console.error(err);
      setOutput({
        stdout: '',
        stderr: err.message || 'Could not communicate with the server.',
        status: 'Network Error',
        timeMs: null,
        memoryKb: null,
        errorType: 'platform',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900 flex flex-col shrink-0">
      {/* Toggle header bar */}
      <div 
        onClick={() => setOutputCollapsed(!outputCollapsed)}
        className="h-10 px-6 flex items-center justify-between bg-slate-900 border-b border-slate-800 select-none cursor-pointer hover:bg-slate-850/50 transition-all"
      >
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-slate-500" />
          Console & Runs
        </span>
        <div className="flex items-center gap-2">
          {running && (
            <span className="text-[10px] text-steel-light font-bold flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-steel-light animate-ping"></span>
              Executing code...
            </span>
          )}
          <button className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-all">
            {outputCollapsed ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Expanded panel body */}
      {!outputCollapsed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-slate-950 max-h-72 overflow-y-auto select-text font-mono text-xs">
          
          {/* Stdin Configuration Column */}
          <div className="p-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              Input variables
            </h4>
            <div>
              <label className="block text-[10px] text-slate-650 mb-1">Standard Input (stdin)</label>
              <textarea
                rows={4}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Supply runtime input variables here..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-300 text-xs focus:outline-none placeholder-slate-600 focus:ring-1 focus:ring-steel h-32 resize-none"
              />
            </div>
          </div>

          {/* Active Run Output Column */}
          <div className="p-4 flex flex-col justify-between min-h-[160px] lg:col-span-2">
            <div className="space-y-3 flex-1">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Last Run Status
              </h4>
              
              {!output && !running && (
                <p className="text-slate-600 italic">// Click 'Run Code' to send this script to Judge0.</p>
              )}

              {running && (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <div className="w-6 h-6 border-2 border-steel border-t-transparent rounded-full animate-spin"></div>
                  <span>Waiting for execution result...</span>
                </div>
              )}

              {output && (
                <div className="space-y-3">
                  {/* Status header banner */}
                  <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold ${
                    output.errorType === 'platform'
                      ? 'bg-amber-950/20 border-warning/35 text-warning'
                      : output.errorType === 'code'
                        ? 'bg-red-950/20 border-danger/35 text-danger'
                        : 'bg-teal-green/10 border-teal-green/30 text-teal-green'
                  }`}>
                    {output.errorType === 'platform' && <AlertTriangle className="w-4 h-4" />}
                    {output.errorType === 'code' && <XCircle className="w-4 h-4" />}
                    {output.errorType === 'none' && <CheckCircle className="w-4 h-4" />}
                    <span>Status: {output.status}</span>
                    
                    {output.timeMs !== null && (
                      <span className="ml-auto text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {output.timeMs}ms
                      </span>
                    )}
                    {output.memoryKb !== null && (
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {output.memoryKb} KB
                      </span>
                    )}
                  </div>

                  {/* Standard output logs */}
                  {output.stdout && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Standard Output</span>
                      <pre className="bg-slate-900 border border-slate-850 p-2.5 rounded text-xs text-slate-200 overflow-x-auto whitespace-pre">
                        {output.stdout}
                      </pre>
                    </div>
                  )}

                  {/* Standard error logs */}
                  {output.stderr && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {output.errorType === 'platform' ? 'Platform Error Logs' : 'Standard Error'}
                      </span>
                      <pre className="bg-slate-900 border border-slate-850 p-2.5 rounded text-xs text-red-400 overflow-x-auto whitespace-pre">
                        {output.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Run History List (Expandable) */}
            {history.length > 0 && (
              <div className="border-t border-slate-800 pt-4 mt-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Run History ({history.length})
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {history.map((run) => {
                    const isExpanded = expandedHistoryId === run.id;
                    const isErr = run.status !== 'Accepted';
                    return (
                      <div key={run.id} className="bg-slate-900/50 border border-slate-850 rounded-lg p-2.5">
                        <div 
                          onClick={() => setExpandedHistoryId(isExpanded ? null : run.id)}
                          className="flex items-center justify-between cursor-pointer text-[10px] select-none"
                        >
                          <span className={`font-bold uppercase tracking-wide ${isErr ? 'text-danger' : 'text-teal-green'}`}>
                            {run.status}
                          </span>
                          <span className="text-slate-500">
                            {new Date(run.runAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-2.5 space-y-2 border-t border-slate-800 pt-2 text-[10px] text-slate-400">
                            {run.stdin && (
                              <p><span className="text-slate-500 font-bold">Input:</span> {run.stdin}</p>
                            )}
                            {run.stdout && (
                              <div>
                                <span className="text-slate-500 font-bold">Stdout:</span>
                                <pre className="bg-slate-950 p-1.5 rounded text-slate-300 mt-1 max-h-20 overflow-y-auto font-mono text-[9px]">{run.stdout}</pre>
                              </div>
                            )}
                            {run.stderr && (
                              <div>
                                <span className="text-slate-550 font-bold">Stderr:</span>
                                <pre className="bg-slate-950 p-1.5 rounded text-red-400 mt-1 max-h-20 overflow-y-auto font-mono text-[9px]">{run.stderr}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Runner actions bar */}
      <div className="h-12 px-6 bg-slate-900/50 flex items-center justify-between border-t border-slate-800/50 relative z-10 select-none">
        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-650" />
          Code is executing in a secure Judge0 sandbox environment.
        </span>
        <button
          onClick={handleRunCode}
          disabled={running}
          className="inline-flex items-center gap-1.5 bg-steel hover:bg-steel-light text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all shadow hover:translate-y-[-0.5px] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <Play className="w-3.5 h-3.5" />
          {running ? 'Running...' : 'Run Code'}
        </button>
      </div>
    </div>
  );
}
