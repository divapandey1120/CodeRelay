'use client';

import React, { useState, useEffect } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { MessageSquarePlus, CornerDownRight, MessageSquareCode, Check, Eye } from 'lucide-react';

interface Comment {
  id: string;
  lineStart: number;
  lineEnd: number;
  body: string;
  createdAt: string;
  author: {
    name: string;
    role: string;
  };
  authorId: string;
}

interface CommentsPanelProps {
  sessionId: string;
  currentUserId: string;
  currentUserRole: string;
  editorCode: string; // triggers re-check of selection if needed
}

export default function CommentsPanel({
  sessionId,
  currentUserId,
  currentUserRole,
  editorCode,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection state
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [sessionId]);

  // Subscribe to realtime database changes for Comment
  useEffect(() => {
    const commentChannel = supabaseClient
      .channel(`comments_channel_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Comment',
          filter: `sessionId=eq.${sessionId}`,
        },
        async () => {
          // Re-fetch all comments to get updated joins
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(commentChannel);
    };
  }, [sessionId]);

  // Read Monaco selection by querying window global editor
  // In Next.js/React, we can access the global editor instance or check periodically
  useEffect(() => {
    const checkSelection = () => {
      const editor = (window as any).monacoEditorInstance;
      if (editor) {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
          setSelectedRange({
            start: selection.startLineNumber,
            end: selection.endLineNumber,
          });
          return;
        }
      }
      setSelectedRange(null);
    };

    // Listen for selection changes inside Monaco if mapped
    const interval = setInterval(checkSelection, 800);
    return () => clearInterval(interval);
  }, [editorCode]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRange || !newCommentBody.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineStart: selectedRange.start,
          lineEnd: selectedRange.end,
          commentBody: newCommentBody.trim(),
        }),
      });

      if (res.ok) {
        setNewCommentBody('');
        setSelectedRange(null);
        // Clear Monaco selection
        const editor = (window as any).monacoEditorInstance;
        if (editor) {
          editor.setSelection(new (window as any).monaco.Selection(0,0,0,0));
        }
        fetchComments();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post comment.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFocusComment = (lineStart: number, lineEnd: number) => {
    const editor = (window as any).monacoEditorInstance;
    const monaco = (window as any).monaco;
    if (editor && monaco) {
      editor.setSelection(new monaco.Selection(lineStart, 1, lineEnd, 100));
      editor.revealLineInCenter(lineStart);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 select-text max-h-[48vh] min-h-[200px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs py-10">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs py-10 gap-2">
            <MessageSquareCode className="w-8 h-8 text-slate-800" />
            <p>No inline comments yet.</p>
            <p className="text-[10px] text-slate-700 text-center max-w-[200px]">
              Select a range of code inside the editor to attach an inline comment.
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id}
              className="bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-lg p-3 space-y-2 transition-all"
            >
              {/* Card header */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-1.5 font-semibold">
                <span className="text-slate-400">
                  {comment.author.name} ({comment.author.role.toLowerCase()})
                </span>
                <button
                  onClick={() => handleFocusComment(comment.lineStart, comment.lineEnd)}
                  className="inline-flex items-center gap-1 text-steel-light hover:text-white transition-all cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  Lines {comment.lineStart === comment.lineEnd ? comment.lineStart : `${comment.lineStart}-${comment.lineEnd}`}
                </button>
              </div>
              
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                {comment.body}
              </p>
              
              <div className="text-[9px] text-slate-650 text-right">
                {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selector input area */}
      <div className="border-t border-slate-800/80 pt-2 shrink-0 select-none">
        {selectedRange ? (
          <form onSubmit={handlePostComment} className="space-y-2.5">
            <div className="bg-steel/10 border border-steel/20 rounded-lg p-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-steel-light">
                Commenting on Lines {selectedRange.start === selectedRange.end ? selectedRange.start : `${selectedRange.start}-${selectedRange.end}`}
              </span>
              <button 
                type="button"
                onClick={() => setSelectedRange(null)}
                className="text-[10px] text-slate-500 hover:text-white"
              >
                Clear
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="Type inline comment..."
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-steel transition-all"
              />
              <button 
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center p-2 rounded-lg bg-steel hover:bg-steel-light text-white transition-all cursor-pointer shadow hover:shadow-steel/20 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <MessageSquarePlus className="w-4 h-4 text-slate-600 animate-pulse" />
            <span>Select code ranges in Monaco to add inline comments.</span>
          </div>
        )}
      </div>
    </div>
  );
}
