/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UnoCard } from '../cards/UnoCard.js';
import { Room } from '../../types/game.js';
import {
  Sparkles,
  Users,
  Radio,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Headphones,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface LandingPageProps {
  onOpenCreate: () => void;
  onOpenJoin: (roomCode?: string) => void;
  onOpenHowToPlay: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenCreate,
  onOpenJoin,
  onOpenHowToPlay,
}) => {
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const fetchRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const res = await fetch('/api/rooms/public');
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {
      // Ignored if local or offline
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalPlayersOnline = publicRooms.reduce((acc, r) => acc + r.players.length, 0);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-16 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-rose-600/20 via-sky-600/15 to-amber-500/20 blur-[120px] pointer-events-none" />

        {/* Live Presence Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2.5 py-1.5 px-4 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-xl backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-emerald-400">Multiplayer Live</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-400">
            {publicRooms.length} Active Room{publicRooms.length === 1 ? '' : 's'}
          </span>
        </motion.div>

        {/* Branding Logo & Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-tight text-white mb-3 drop-shadow-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-sky-400">
              classUNO
            </span>
          </h1>

          <p className="font-display font-bold text-2xl sm:text-3xl text-slate-200 tracking-wide mb-3">
            Play. Chat. Connect.
          </p>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8 text-balance">
            Play UNO with your friends in real time. Crystal-clear WebRTC voice chat, server-authoritative rules, and custom private rooms.
          </p>
        </motion.div>

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md justify-center mb-12"
        >
          <button
            onClick={onOpenCreate}
            className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-display font-extrabold text-base tracking-wide shadow-2xl shadow-rose-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Create Room</span>
          </button>

          <button
            onClick={() => onOpenJoin()}
            className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/90 text-white font-display font-bold text-base shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Join Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors underline underline-offset-4 py-2 sm:hidden cursor-pointer"
          >
            How to Play
          </button>
        </motion.div>

        {/* Animated 3D Floating Cards Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative w-full max-w-2xl flex items-center justify-center -space-x-8 sm:-space-x-12 py-4"
        >
          <div className="transform -rotate-15 -translate-y-4 hover:translate-y-[-24px] hover:rotate-[-8deg] transition-all duration-300">
            <UnoCard
              card={{ id: 'c_demo1', color: 'red', type: 'number', value: 7 }}
              size="lg"
            />
          </div>
          <div className="transform -rotate-6 -translate-y-2 hover:translate-y-[-24px] transition-all duration-300 z-10">
            <UnoCard
              card={{ id: 'c_demo2', color: 'blue', type: 'draw2' }}
              size="lg"
            />
          </div>
          <div className="transform rotate-0 -translate-y-6 hover:translate-y-[-28px] transition-all duration-300 z-20 shadow-2xl">
            <UnoCard
              card={{ id: 'c_demo3', color: 'wild', type: 'wild4' }}
              size="lg"
            />
          </div>
          <div className="transform rotate-8 -translate-y-2 hover:translate-y-[-24px] transition-all duration-300 z-10">
            <UnoCard
              card={{ id: 'c_demo4', color: 'green', type: 'reverse' }}
              size="lg"
            />
          </div>
          <div className="transform rotate-16 -translate-y-4 hover:translate-y-[-24px] hover:rotate-[10deg] transition-all duration-300">
            <UnoCard
              card={{ id: 'c_demo5', color: 'yellow', type: 'number', value: 9 }}
              size="lg"
            />
          </div>
        </motion.div>
      </section>

      {/* Public Rooms Browser */}
      <section className="w-full max-w-6xl px-4 py-12 border-t border-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5" />
              <span>Live Public Lobby</span>
            </div>
            <h2 className="font-display font-bold text-2xl text-white">
              Open Game Tables
            </h2>
          </div>

          <button
            onClick={fetchRooms}
            disabled={isLoadingRooms}
            className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
            <span>Refresh Rooms</span>
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="w-full p-12 rounded-3xl bg-slate-950/60 border border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-3">
              🃏
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-1">
              No Public Tables Right Now
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mb-6">
              Be the first to host! Create a room and invite your friends with a 6-character room code.
            </p>
            <button
              onClick={onOpenCreate}
              className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs shadow-lg transition-colors cursor-pointer"
            >
              Host a Game
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {room.code}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {room.players.length} / {room.maxPlayers}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-white truncate mb-1">
                    {room.name}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Host: {room.players[0]?.name || 'Player'}</span>
                    {room.hasPassword && (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Waiting in Lobby
                  </span>

                  <button
                    onClick={() => onOpenJoin(room.code)}
                    className="py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Join Table
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feature Highlights Grid */}
      <section className="w-full max-w-6xl px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-3xl text-white mb-3">
            Built for Competitive Game Nights
          </h2>
          <p className="text-slate-400 text-sm">
            Everything you need for seamless multiplayer gaming without lag, ads, or clunky downloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              Server-Authoritative Sync
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Every card draw, turn order, wild play, and discard is validated on the Node.js game engine. Zero client spoofing, zero desync.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              Peer-to-Peer Voice Chat
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Built-in WebRTC voice channels with live speaking visualizers and microphone controls. No external apps or Discord required.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-2">
              The Real UNO Penalty
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Experience authentic UNO tension: press the UNO button with 1 card remaining before opponents catch you, or suffer the 2-card draw penalty!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-8 px-4 text-center text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-white text-sm tracking-tight">
              classUNO
            </span>
            <span aria-hidden="true">·</span>
            <span>Play. Chat. Connect.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={onOpenHowToPlay} className="hover:text-white transition-colors cursor-pointer">
              Rules
            </button>
            <button onClick={onOpenCreate} className="hover:text-white transition-colors cursor-pointer">
              Host Room
            </button>
            <span>Real-time WebSockets & WebRTC</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
