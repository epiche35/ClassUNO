/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Player, Room } from '../../types/game.js';
import { Copy, Check, Play, ShieldAlert, LogOut, Users, Link2, Share2, Sparkles } from 'lucide-react';
import { soundManager } from '../../lib/audio.js';

interface LobbyViewProps {
  room: Room;
  localPlayer: Player;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  isStarting?: boolean;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  localPlayer,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  isStarting = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/?room=${room.code}` : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const canStart = room.players.length >= 2;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Top Room Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl mb-6 relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono tracking-wider uppercase text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                Game Lobby
              </span>
              {room.hasPassword && (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Password Protected
                </span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {room.name}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Waiting for players to join. Share the invite link or 6-character room code.
            </p>
          </div>

          {/* Room Code & Copy Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
            <div className="text-center sm:text-left px-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Room Code</span>
              <span className="font-mono font-black text-2xl tracking-widest text-amber-400">
                {room.code}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Code'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Copy Invite Link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Invite Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Players Grid */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="font-display font-bold text-sm text-slate-200">
              Players ({room.players.length} / {room.maxPlayers})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {canStart ? 'Ready to launch!' : 'Need at least 2 players to start'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {room.players.map((player) => {
            const isLocal = player.id === localPlayer.id;

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex flex-col items-center text-center relative ${
                  isLocal
                    ? 'bg-slate-900 border-rose-500/60 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Host badge */}
                {player.isHost && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    HOST
                  </span>
                )}

                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl mb-3 shadow-inner">
                  {player.avatar}
                </div>

                <div className="font-display font-bold text-base text-white truncate max-w-[140px]">
                  {player.name}
                  {isLocal && <span className="text-xs text-slate-400 font-normal ml-1">(You)</span>}
                </div>

                {/* Status Indicator */}
                <div className="mt-3">
                  {player.isHost ? (
                    <span className="text-xs font-semibold text-amber-400">
                      Room Leader
                    </span>
                  ) : player.isReady ? (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Ready
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500">
                      Not Ready
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Empty Slots */}
          {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).map((_, i) => (
            <div
              key={`empty_${i}`}
              className="p-4 rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/20 flex flex-col items-center justify-center text-slate-600 min-h-[140px]"
            >
              <Users className="w-6 h-6 mb-2 opacity-40" />
              <span className="text-xs">Open Slot</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Lobby Actions */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <button
          onClick={onLeaveRoom}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Room</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Non-host ready toggle */}
          {!localPlayer.isHost && (
            <button
              onClick={onToggleReady}
              className={`flex-1 sm:flex-none py-2.5 px-6 rounded-xl font-display font-bold text-xs transition-all cursor-pointer ${
                localPlayer.isReady
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }`}
            >
              {localPlayer.isReady ? 'Cancel Ready' : 'I am Ready!'}
            </button>
          )}

          {/* Host Start Game Button */}
          {localPlayer.isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart || isStarting}
              className="flex-1 sm:flex-none py-3 px-8 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-black text-sm tracking-wide shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isStarting ? 'Launching...' : 'Start Game'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
