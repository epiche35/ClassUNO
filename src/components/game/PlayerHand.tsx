/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Card, GameState, Player } from '../../types/game.js';
import { UnoCard } from '../cards/UnoCard.js';
import { PlusCircle, Sparkles, AlertCircle } from 'lucide-react';
import { soundManager } from '../../lib/audio.js';

interface PlayerHandProps {
  hand: Card[];
  gameState: GameState;
  localPlayer: Player;
  onPlayCard: (card: Card) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  isMyTurn: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  gameState,
  localPlayer,
  onPlayCard,
  onDrawCard,
  onCallUno,
  isMyTurn,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { currentColor, currentCard } = gameState;

  const isCardPlayable = (card: Card): boolean => {
    if (!isMyTurn) return false;
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (currentCard && card.type === currentCard.type) {
      if (card.type === 'number') {
        return card.value === currentCard.value;
      }
      return true;
    }
    return false;
  };

  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;
    if (!isCardPlayable(card)) return;
    soundManager.playCard();
    onPlayCard(card);
  };

  const handleDrawClick = () => {
    if (!isMyTurn) return;
    soundManager.playDraw();
    onDrawCard();
  };

  const handleUnoClick = () => {
    soundManager.playUno();
    onCallUno();
  };

  // UNO button state: can call when 1 or 2 cards remaining
  const canCallUno = hand.length <= 2;
  const alreadyCalled = localPlayer.calledUno;

  return (
    <div className="w-full flex flex-col items-center z-20 pb-2 px-2 sm:px-6">
      {/* Turn Banner & Action Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-2 px-2">
        {/* Left: Turn Status Alert */}
        <div className="flex items-center gap-2">
          {isMyTurn ? (
            <div className="flex items-center gap-2 py-1 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-display font-extrabold text-xs sm:text-sm shadow-lg animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>YOUR TURN</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span>Waiting for turn...</span>
            </div>
          )}
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            ({hand.length} card{hand.length === 1 ? '' : 's'} in hand)
          </span>
        </div>

        {/* Right: Quick Draw Card & UNO Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Draw Button */}
          {isMyTurn && (
            <button
              onClick={handleDrawClick}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Draw Card</span>
            </button>
          )}

          {/* Glowing UNO! Button */}
          <motion.button
            whileHover={canCallUno ? { scale: 1.08 } : {}}
            whileTap={canCallUno ? { scale: 0.95 } : {}}
            onClick={canCallUno ? handleUnoClick : undefined}
            disabled={!canCallUno || alreadyCalled}
            className={`py-1.5 px-4 sm:px-6 rounded-2xl font-display font-black text-sm sm:text-base tracking-wider transition-all duration-200 shadow-xl cursor-pointer ${
              alreadyCalled
                ? 'bg-emerald-600/60 text-white border border-emerald-400/40 cursor-default'
                : canCallUno
                ? 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 text-white shadow-rose-600/40 animate-bounce ring-2 ring-white/60'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-50'
            }`}
          >
            {alreadyCalled ? '✓ UNO CALLED' : 'UNO!'}
          </motion.button>
        </div>
      </div>

      {/* Horizontally Scrollable Cards Fan */}
      <div
        ref={scrollContainerRef}
        className="w-full max-w-5xl overflow-x-auto overflow-y-visible py-4 px-4 flex items-center justify-start sm:justify-center -space-x-4 sm:-space-x-6 md:-space-x-8 scrollbar-thin"
        style={{ minHeight: '160px' }}
      >
        {hand.map((card, index) => {
          const playable = isCardPlayable(card);

          return (
            <motion.div
              key={card.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              className="shrink-0 transition-transform duration-150"
              style={{
                zIndex: index + 1,
              }}
            >
              <UnoCard
                card={card}
                isPlayable={playable}
                onClick={() => handleCardClick(card)}
                size="hand"
                className={playable ? 'ring-2 ring-white shadow-rose-500/30' : ''}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
