'use client';

import React, { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { supabaseClient } from '@/lib/supabase';
import { Wifi, WifiOff } from 'lucide-react';

interface CodeEditorProps {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  language: string;
  setLanguage: (lang: string) => void;
  code: string;
  setCode: (code: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  initialCode: string;
}

export default function CodeEditor({
  sessionId,
  userId,
  userName,
  userRole,
  language,
  setLanguage,
  code,
  setCode,
  isLocked,
  setIsLocked,
  initialCode,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  // Realtime connection status
  const [isConnected, setIsConnected] = useState(true);
  
  // Ref to hold the current code to bypass closure issues in event handlers
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Ref to hold decorations for remote cursor
  const remoteDecorationsRef = useRef<string[]>([]);
  
  // Ref to track last saved snapshot code
  const lastSavedCodeRef = useRef(initialCode);

  // Initialize editor code
  useEffect(() => {
    setCode(initialCode);
    lastSavedCodeRef.current = initialCode;
  }, [initialCode, setCode]);

  useEffect(() => {
    // 1. Join editor realtime channel
    const channelName = `session_editor_${sessionId}`;
    const channel = supabaseClient.channel(channelName, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
        },
      },
    });

    // 2. Register listeners
    channel
      .on('broadcast', { event: 'code:update' }, (payload: any) => {
        const newCode = payload.payload?.code;
        if (newCode !== undefined && newCode !== codeRef.current) {
          setCode(newCode);
          
          // Apply edits directly to Monaco if mounted to preserve undo stack
          const editor = editorRef.current;
          if (editor) {
            const position = editor.getPosition();
            editor.setValue(newCode);
            if (position) {
              editor.setPosition(position);
            }
          }
        }
      })
      .on('broadcast', { event: 'cursor:move' }, (payload: any) => {
        const { position, name, role } = payload.payload || {};
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco || !position) return;

        // Draw remote cursor caret line
        const range = new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        );

        const borderClass = role === 'INTERVIEWER' 
          ? 'border-l-2 border-steel-light' 
          : 'border-l-2 border-teal-green';

        const decoration = {
          range,
          options: {
            className: `${borderClass} h-5 animate-pulse absolute pointer-events-none`,
            hoverMessage: { value: `**${name}** (${role.toLowerCase()})` },
            isWholeLine: false,
          },
        };

        remoteDecorationsRef.current = editor.deltaDecorations(
          remoteDecorationsRef.current,
          [decoration]
        );
      })
      .on('broadcast', { event: 'editor:lock' }, (payload: any) => {
        const locked = payload.payload?.isLocked;
        if (locked !== undefined) {
          setIsLocked(locked);
        }
      })
      .on('broadcast', { event: 'language:change' }, (payload: any) => {
        const lang = payload.payload?.language;
        if (lang) {
          setLanguage(lang);
        }
      })
      .on('broadcast', { event: 'editor:reset' }, (payload: any) => {
        const template = payload.payload?.code;
        if (template !== undefined) {
          setCode(template);
          const editor = editorRef.current;
          if (editor) {
            editor.setValue(template);
          }
        }
      });

    // 3. Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    });

    // Save channel reference to a local variable for use in unmount callback
    const activeChannel = channel;

    // 4. Set up 30s Database snapshot auto-save
    const snapshotInterval = setInterval(async () => {
      const currentCode = codeRef.current;
      // If code changed since last snapshot save, post snapshot to server
      if (currentCode !== lastSavedCodeRef.current) {
        try {
          const res = await fetch(`/api/sessions/${sessionId}/snapshot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: currentCode, language }),
          });
          if (res.ok) {
            lastSavedCodeRef.current = currentCode;
          }
        } catch (err) {
          console.error('Failed to auto-save code snapshot:', err);
        }
      }
    }, 30000);

    // Clean up
    return () => {
      clearInterval(snapshotInterval);
      supabaseClient.removeChannel(activeChannel);
    };
  }, [sessionId, language, setCode, setIsLocked, setLanguage]);

  // Debounced code broadcast helper (50ms)
  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);

    if (broadcastTimeoutRef.current) {
      clearTimeout(broadcastTimeoutRef.current);
    }

    broadcastTimeoutRef.current = setTimeout(() => {
      const channel = supabaseClient.channel(`session_editor_${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'code:update',
        payload: { code: newCode },
      });
    }, 50);
  };

  // Broadcast cursor moves
  const handleCursorChange = (e: any) => {
    const position = e.position;
    if (!position) return;

    const channel = supabaseClient.channel(`session_editor_${sessionId}`);
    channel.send({
      type: 'broadcast',
      event: 'cursor:move',
      payload: {
        userId,
        name: userName,
        role: userRole,
        position: {
          lineNumber: position.lineNumber,
          column: position.column,
        },
      },
    });
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Expose editor globally for comments helper
    if (typeof window !== 'undefined') {
      (window as any).monacoEditorInstance = editor;
      (window as any).monaco = monaco;
    }

    // Listen to cursor position changes
    editor.onDidChangeCursorPosition(handleCursorChange);
  };

  // Synchronize language and editor lock states if Interviewer changes them
  useEffect(() => {
    if (userRole === 'INTERVIEWER') {
      const channel = supabaseClient.channel(`session_editor_${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'language:change',
        payload: { language },
      });
    }
  }, [language, sessionId, userRole]);

  useEffect(() => {
    if (userRole === 'INTERVIEWER') {
      const channel = supabaseClient.channel(`session_editor_${sessionId}`);
      channel.send({
        type: 'broadcast',
        event: 'editor:lock',
        payload: { isLocked },
      });
    }
  }, [isLocked, sessionId, userRole]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Realtime status indicator */}
      <div className="absolute top-2 right-4 z-10 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 text-[10px] font-semibold text-slate-400 select-none">
        {isConnected ? (
          <>
            <Wifi className="w-3 h-3 text-teal-green animate-pulse" />
            <span>Synced</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-warning animate-bounce" />
            <span className="text-warning">Reconnecting...</span>
          </>
        )}
      </div>

      <div className="flex-1 w-full h-full min-h-0 relative">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12 },
            readOnly: isLocked && userRole === 'CANDIDATE',
          }}
        />
      </div>
    </div>
  );
}
