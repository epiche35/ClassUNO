/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JoinRoomSchema } from '../../lib/validation.js';
import { X, Lock, KeyRound, ArrowRight } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  initialCode?: string;
  onClose: () => void;
  onSubmit: (data: {
    playerName: string;
    roomCode: string;
    password?: string;
    avatar: string;
  }) => void;
  isSubmitting?: boolean;
}

const AVATARS = ['🦊', '🐯', '🤖', '🧙', '🚀', '🐼', '🦁', '👾', '🦄', '⚡'];

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  initialCode = '',
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('classuno_name') || '' : '';
  });
  const [roomCode, setRoomCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setRoomCode(initialCode.toUpperCase().trim());
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      playerName,
      roomCode: roomCode.toUpperCase().trim(),
      password: password.trim() ? password.trim() : undefined,
      avatar,
    };

    const res = JoinRoomSchema.safeParse(payload);
    if (!res.success) {
      setError(res.error.issues[0]?.message || 'Please check your inputs.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('classuno_name', playerName.trim());
    }

    onSubmit(payload);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="font-display font-black text-2xl text-white">
              Join Game Room
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Enter the 6-character room code or join via an invite link.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Choose Avatar
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {AVATARS.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      avatar === av
                        ? 'bg-sky-500/20 border-2 border-sky-500 scale-110 shadow-lg'
                        : 'bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Nickname
              </label>
              <input
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Phoenix"
                maxLength={16}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Room Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                6-Character Room Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD"
                  maxLength={6}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold tracking-widest text-amber-400 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors pl-9 uppercase"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Password (if room locked) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Room Password (If Required)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password if private"
                  maxLength={32}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors pl-9"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white font-display font-extrabold text-sm tracking-wide shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Connecting...' : 'Join Game Table'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
