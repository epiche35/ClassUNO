/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Player } from '../../types/game.js';
import { Send, Smile, MessageSquare, X } from 'lucide-react';
import { soundManager } from '../../lib/audio.js';

interface ChatPanelProps {
  messages: ChatMessage[];
  localPlayer: Player;
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  localPlayer,
  onSendMessage,
  isOpen,
  onClose,
}) => {
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickEmojis = ['😂', '🔥', '🃏', '👏', '😱', '💥', '👀', '🎉'];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    setShowEmojis(false);
    soundManager.playChat();
  };

  const handleEmojiClick = (emoji: string) => {
    onSendMessage(emoji);
    setShowEmojis(false);
    soundManager.playChat();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 text-slate-200 w-full sm:w-80 md:w-96 shadow-2xl relative z-40">
      {/* Header */}
      <div className="p-3.5 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-rose-400" />
          <span className="font-display font-bold text-sm text-white">Room Chat</span>
          <span className="text-xs text-slate-500 font-mono">({messages.length})</span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-3 text-xs sm:text-sm">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
            <span className="text-2xl mb-2">💬</span>
            <p className="text-xs">No messages yet. Say hi to the room!</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="py-1 px-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-center text-slate-400 text-xs">
                <span className="text-slate-300 font-medium">{msg.message}</span>
              </div>
            );
          }

          const isMe = msg.playerId === localPlayer.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-xs">{msg.playerAvatar}</span>
                <span className={`text-xs font-semibold ${isMe ? 'text-rose-400' : 'text-sky-400'}`}>
                  {isMe ? 'You' : msg.playerName}
                </span>
                <span className="text-[10px] text-slate-500">{formatTime(msg.timestamp)}</span>
              </div>

              <div
                className={`p-2.5 px-3 rounded-2xl max-w-[85%] break-words text-xs sm:text-sm shadow-sm ${
                  isMe
                    ? 'bg-rose-600 text-white rounded-tr-xs'
                    : 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700/60'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Emojis Drawer */}
      {showEmojis && (
        <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-around">
          {quickEmojis.map((e) => (
            <button
              key={e}
              onClick={() => handleEmojiClick(e)}
              className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showEmojis
              ? 'bg-rose-500/20 border-rose-500 text-rose-400'
              : 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Quick Emojis"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          maxLength={200}
          className="flex-1 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:hover:bg-rose-500 text-white shadow transition-all cursor-pointer"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
