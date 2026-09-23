/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameState, Player } from '../../types/game.js';
import { soundManager } from '../../lib/audio.js';
import { Trophy, ArrowRight, LogOut, Flame } from 'lucide-react';

interface RoundOverModalProps {
  gameState: GameState;
  localPlayer: Player;
  onRematch: () => void;
  onLeave: () => void;
}

export const RoundOverModal: React.FC<RoundOverModalProps> = ({
  gameState,
  localPlayer,
  onRematch,
  onLeave,
}) => {
  const isRoundEnd = gameState.status === 'ROUND_END' || gameState.status === 'GAME_END';
  const isWinner = gameState.roundWinnerId === localPlayer.id;
  const winner = gameState.players.find((p) => p.id === gameState.roundWinnerId);

  useEffect(() => {
    if (isRoundEnd) {
      soundManager.playWin();
      if (isWinner) {
        // Confetti burst
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
        });
      }
    }
  }, [isRoundEnd, isWinner]);

  if (!isRoundEnd) return null;

  // Sort players by total score descending
  const sortedPlayers = [...gameState.players].sort((a, b) => {
    const scoreA = (gameState.totalScores && gameState.totalScores[a.id]) || a.score || 0;
    const scoreB = (gameState.totalScores && gameState.totalScores[b.id]) || b.score || 0;
    return scoreB - scoreA;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
        >
          {/* Header banner glow */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-3xl">
              {isWinner ? '🏆' : '🃏'}
            </div>

            <h2 className="font-display font-black text-3xl text-white tracking-tight">
              {isWinner ? 'Victory is Yours!' : 'Round Complete!'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              <span className="font-semibold text-white">{winner?.name}</span> emptied their hand first!
            </p>
          </div>

          {/* Leaderboard list */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2">
              <span>Player</span>
              <span>Round / Total Score</span>
            </div>

            {sortedPlayers.map((player, idx) => {
              const roundPts = gameState.roundScores?.[player.id] ?? 0;
              const totalPts = gameState.totalScores?.[player.id] ?? player.score ?? 0;
              const isLocal = player.id === localPlayer.id;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    player.id === winner?.id
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : isLocal
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-xs text-slate-400 w-4 text-center">
                      #{idx + 1}
                    </span>
                    <span className="text-lg">{player.avatar}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-slate-100 flex items-center gap-1.5">
                        {player.name}
                        {isLocal && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
                        {player.id === winner?.id && <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      </span>
                      <span className="text-xs text-slate-400">
                        {player.cardCount} card{player.cardCount === 1 ? '' : 's'} remaining
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-display font-bold text-sm text-amber-400 tabular-nums">
                      {totalPts} pts
                    </div>
                    {roundPts > 0 && (
                      <div className="text-[11px] text-emerald-400 font-medium tabular-nums">
                        +{roundPts} this round
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLeave}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Leave Room
            </button>

            {localPlayer.isHost ? (
              <button
                onClick={onRematch}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Play Next Round</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex-1 py-3 px-3 text-center text-xs text-slate-400 italic">
                Waiting for host to start next round...
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
