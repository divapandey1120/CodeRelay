'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  message: string;
  sentAt: string;
  sender: {
    name: string;
    role: string;
  };
  senderId: string;
}

interface ChatPanelProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
}

export default function ChatPanel({
  sessionId,
  currentUserId,
  currentUserName,
  currentUserRole,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Error loading chat messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [sessionId]);

  // Subscribe to realtime database changes for ChatMessage
  useEffect(() => {
    const chatChannel = supabaseClient
      .channel(`chat_channel_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ChatMessage',
          filter: `sessionId=eq.${sessionId}`,
        },
        async (payload: any) => {
          const newMsg = payload.new;
          
          // To get sender relation details, we can either re-fetch or construct it
          // Constructing is faster. Let's do a quick fetch of this specific message
          try {
            // Re-fetch is safer for getting the 'sender' joined details
            const res = await fetch(`/api/sessions/${sessionId}/messages`);
            if (res.ok) {
              const data = await res.json();
              setMessages(data);
            }
          } catch (err) {
            console.error('Error syncing chat message details:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(chatChannel);
    };
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input;
    setInput('');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) {
        setInput(messageText); // restore input if failed
        const err = await res.json();
        alert(err.error || 'Failed to send message.');
      }
    } catch (err) {
      setInput(messageText);
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      {/* Scrollable messages container */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 select-text max-h-[48vh] min-h-[200px]"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs py-10 gap-2">
            <MessageSquare className="w-8 h-8 text-slate-800" />
            <p>No chat history yet.</p>
            <p className="text-[10px] text-slate-700">Discuss instructions or code problems here.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                {/* Sender metadata */}
                <span className="text-[10px] text-slate-500 font-semibold mb-1">
                  {msg.sender.name} ({msg.sender.role.toLowerCase()})
                </span>
                
                {/* Bubble */}
                <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  isMe 
                    ? 'bg-steel text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                }`}>
                  {msg.message}
                </div>
                
                {/* Timestamp */}
                <span className="text-[9px] text-slate-600 mt-1">
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input Composer form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800/80 shrink-0 select-none">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-650 focus:ring-1 focus:ring-steel transition-all"
        />
        <button 
          type="submit"
          className="inline-flex items-center justify-center p-2 rounded-lg bg-steel hover:bg-steel-light text-white transition-all cursor-pointer shadow hover:shadow-steel/20 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
