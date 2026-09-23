/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Card, CardColor, GameState, Player } from '../../types/game.js';
import { UnoCard } from '../cards/UnoCard.js';
import { RotateCw, RotateCcw, AlertTriangle, Volume2, Mic, MicOff } from 'lucide-react';

interface UnoTableProps {
  gameState: GameState;
  localPlayer: Player;
  onDrawCard: () => void;
  onChallengeUno?: (targetPlayerId: string) => void;
  isMyTurn: boolean;
}

export const UnoTable: React.FC<UnoTableProps> = ({
  gameState,
  localPlayer,
  onDrawCard,
  onChallengeUno,
  isMyTurn,
}) => {
  const {
    currentCard,
    currentColor,
    drawPileCount,
    turnDirection,
    currentPlayerId,
    players,
    lastAction,
  } = gameState;

  // Color theme mapping for active color
  const colorHex: Record<string, { name: string; bg: string; border: string; glow: string }> = {
    red: { name: 'RED', bg: 'bg-rose-500', border: 'border-rose-400', glow: 'shadow-rose-500/50' },
    blue: { name: 'BLUE', bg: 'bg-sky-500', border: 'border-sky-400', glow: 'shadow-sky-500/50' },
    green: { name: 'GREEN', bg: 'bg-emerald-500', border: 'border-emerald-400', glow: 'shadow-emerald-500/50' },
    yellow: { name: 'YELLOW', bg: 'bg-amber-400', border: 'border-amber-300', glow: 'shadow-amber-400/50' },
  };

  const activeColorInfo = colorHex[currentColor] || colorHex.red;

  // Filter opponent players (exclude local player)
  const opponents = players.filter((p) => p.id !== localPlayer.id);

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-2 sm:p-4 overflow-hidden select-none">
      {/* Top / Side Opponents Area */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-center gap-3 sm:gap-6 z-10 pt-1">
        {opponents.map((player) => {
          const isCurrentTurn = player.id === currentPlayerId;
          const is1CardUnsafe = player.cardCount === 1 && !player.calledUno;

          return (
            <div
              key={player.id}
              className={`relative flex flex-col items-center p-2 sm:p-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 border ${
                isCurrentTurn
                  ? 'bg-slate-900/90 border-rose-500 shadow-xl shadow-rose-500/20 scale-105'
                  : 'bg-slate-950/70 border-slate-800/90'
              }`}
            >
              {/* Turn glowing halo */}
              {isCurrentTurn && (
                <span className="absolute -top-2.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-md animate-pulse">
                  Current Turn
                </span>
              )}

              {/* Avatar + Speaking Indicator */}
              <div className="relative mb-1">
                <div
                  className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-800 flex items-center justify-center text-xl sm:text-2xl shadow-inner border ${
                    player.isSpeaking
                      ? 'border-emerald-400 ring-4 ring-emerald-500/40 animate-pulse'
                      : isCurrentTurn
                      ? 'border-rose-400'
                      : 'border-slate-700'
                  }`}
                >
                  {player.avatar}
                </div>

                {/* Connection Status Dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                    player.isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                  }`}
                  title={player.isConnected ? 'Connected' : 'Reconnecting...'}
                />

                {/* Voice status icon */}
                {player.voiceConnected && (
                  <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                    {player.micMuted ? (
                      <MicOff className="w-2.5 h-2.5 text-rose-400" />
                    ) : (
                      <Mic className={`w-2.5 h-2.5 ${player.isSpeaking ? 'text-emerald-400' : 'text-slate-400'}`} />
                    )}
                  </span>
                )}
              </div>

              {/* Player Name & Card Count */}
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm text-slate-200 truncate max-w-[100px]">
                  {player.name}
                </div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="font-display font-extrabold text-xs text-amber-400 tabular-nums">
                    {player.cardCount}
                  </span>
                  <span className="text-[10px] text-slate-400">cards</span>
                </div>
              </div>

              {/* Opponent Face-down mini hand preview */}
              <div className="flex items-center -space-x-2 mt-1.5 overflow-hidden max-w-[120px] justify-center">
                {Array.from({ length: Math.min(player.cardCount, 6) }).map((_, idx) => (
                  <UnoCard
                    key={idx}
                    card={{ id: `back_${idx}`, color: 'wild', type: 'number', value: 0 }}
                    faceDown
                    size="sm"
                    showBackLabel={false}
                    className="w-5 h-7 rounded-xs shadow-md transform hover:-translate-y-1 transition-transform"
                  />
                ))}
              </div>

              {/* Challenge UNO button if player has 1 card without saying UNO */}
              {is1CardUnsafe && onChallengeUno && (
                <button
                  onClick={() => onChallengeUno(player.id)}
                  className="mt-1.5 py-0.5 px-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shadow animate-bounce cursor-pointer flex items-center gap-1"
                  title="Catch them not saying UNO! Forces 2 card penalty."
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Catch UNO!</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Center Table Card Arena */}
      <div className="relative flex-1 w-full max-w-2xl flex flex-col items-center justify-center my-2 sm:my-4">
        {/* Arena Table Mat */}
        <div className="relative w-72 sm:w-96 md:w-[460px] h-56 sm:h-64 md:h-72 rounded-[48px] bg-slate-950/80 border-2 border-slate-800/80 shadow-2xl flex items-center justify-center p-4 overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Radial Glow matching active color */}
          <div
            className={`absolute inset-0 opacity-25 blur-3xl pointer-events-none transition-colors duration-700 ${activeColorInfo.bg}`}
          />

          {/* Table Center Graphic / Direction Arrows */}
          <div className="absolute inset-4 border border-dashed border-slate-800/70 rounded-[36px] flex items-center justify-between px-6 pointer-events-none">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
              {turnDirection === 1 ? (
                <>
                  <RotateCw className="w-4 h-4 text-slate-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="text-[10px] uppercase tracking-wider">Clockwise</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 text-slate-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span className="text-[10px] uppercase tracking-wider">Counter-CW</span>
                </>
              )}
            </div>

            {/* Active Color Pill Badge */}
            <div className={`px-3 py-1 rounded-full text-white text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 ${activeColorInfo.bg}`}>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{activeColorInfo.name}</span>
            </div>
          </div>

          {/* Cards Center Stack: Draw Pile & Discard Pile */}
          <div className="relative z-10 flex items-center justify-center gap-6 sm:gap-10">
            {/* Draw Pile */}
            <div className="flex flex-col items-center">
              <motion.div
                whileHover={isMyTurn ? { scale: 1.05, y: -4 } : {}}
                whileTap={isMyTurn ? { scale: 0.95 } : {}}
                onClick={isMyTurn ? onDrawCard : undefined}
                className={`relative group ${
                  isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
                }`}
              >
                {/* Visual card stack effect */}
                <div className="absolute inset-0 bg-slate-800 rounded-xl translate-x-1 translate-y-1 opacity-50" />
                <div className="absolute inset-0 bg-slate-700 rounded-xl translate-x-0.5 translate-y-0.5 opacity-70" />

                <UnoCard
                  card={{ id: 'draw_deck', color: 'wild', type: 'number', value: 0 }}
                  faceDown
                  size="md"
                  className={isMyTurn ? 'ring-2 ring-amber-400/80 shadow-amber-400/20' : ''}
                />

                {isMyTurn && (
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-slate-950 font-display font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-lg">
                    DRAW
                  </div>
                )}
              </motion.div>

              <span className="text-[11px] text-slate-400 font-mono mt-3">
                {drawPileCount} left
              </span>
            </div>

            {/* Discard Pile (Active Top Card) */}
            <div className="flex flex-col items-center">
              <motion.div
                key={currentCard?.id || 'discard'}
                initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="relative"
              >
                {currentCard ? (
                  <UnoCard
                    card={currentCard}
                    size="md"
                    className="shadow-2xl"
                    highlightColor={
                      currentColor === 'red'
                        ? '#ef4444'
                        : currentColor === 'blue'
                        ? '#3b82f6'
                        : currentColor === 'green'
                        ? '#10b981'
                        : '#f59e0b'
                    }
                  />
                ) : (
                  <div className="w-20 h-28 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs">
                    Empty
                  </div>
                )}
              </motion.div>

              <span className="text-[11px] text-slate-400 font-medium mt-3 uppercase tracking-wider">
                Discard
              </span>
            </div>
          </div>
        </div>

        {/* Latest Action Ticker Bar */}
        {lastAction && (
          <motion.div
            key={lastAction.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 py-1 px-4 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs flex items-center gap-2 shadow-lg backdrop-blur-md"
          >
            <span className="text-amber-400 font-semibold">{lastAction.playerName}</span>
            <span>{lastAction.text}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
