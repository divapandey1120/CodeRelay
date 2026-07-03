'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Cloud, CloudRain, CloudLightning } from 'lucide-react';

interface NotesPanelProps {
  sessionId: string;
}

export default function NotesPanel({ sessionId }: NotesPanelProps) {
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');

  // Load notes on mount
  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/sessions/${sessionId}/notes`);
        if (res.ok) {
          const data = await res.json();
          setNoteText(data.body || '');
        }
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [sessionId]);

  // Debounced note save helper (500ms)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleNoteChange = (value: string) => {
    setNoteText(value);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteBody: value }),
        });

        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        console.error('Error auto-saving notes:', err);
        setSaveStatus('error');
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-xs py-10">
        Loading private notepad...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 select-none">
      {/* Save Status Banner header */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-warning" />
          <span>Strictly Private Notes</span>
        </div>
        
        <div className="flex items-center gap-1">
          {saveStatus === 'saved' && (
            <>
              <Cloud className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-500">Saved</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <CloudRain className="w-3.5 h-3.5 text-steel-light animate-pulse" />
              <span className="text-[10px] text-steel-light">Saving...</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <CloudLightning className="w-3.5 h-3.5 text-danger animate-bounce" />
              <span className="text-[10px] text-danger">Save failed</span>
            </>
          )}
        </div>
      </div>

      {/* Notepad body */}
      <textarea
        value={noteText}
        onChange={(e) => handleNoteChange(e.target.value)}
        className="flex-1 w-full bg-slate-950 border border-slate-850 rounded-lg p-4 text-sm font-sans text-slate-200 focus:outline-none placeholder-slate-650 focus:ring-1 focus:ring-steel h-72 resize-none select-text"
        placeholder="Type private feedback notes here. This textbox auto-saves. The candidate never receives these observations, even under direct network inspection."
      />
    </div>
  );
}
