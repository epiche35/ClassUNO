/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Sparkles, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[88vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-black text-2xl text-white">
                  How to Play classUNO
                </h2>
                <p className="text-slate-400 text-xs">Official real-time rules & scoring</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto py-4 space-y-6 text-slate-300 text-sm pr-1">
            {/* Objective */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <h3 className="font-display font-bold text-base text-amber-400 mb-1 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                The Objective
              </h3>
              <p className="text-slate-400 leading-relaxed text-xs sm:text-sm">
                Be the first player to play all cards from your hand into the discard pile. Score points each round based on the cards left in your opponents' hands!
              </p>
            </div>

            {/* Turn rules */}
            <div>
              <h3 className="font-display font-bold text-sm text-white mb-2 uppercase tracking-wider">
                Matching Rules
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-3">
                On your turn, you must match a card from your hand with the top card on the discard pile by:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="font-bold text-rose-400 block mb-1">Color Match</span>
                  <span>Play any card matching the active color (Red, Blue, Green, Yellow).</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="font-bold text-sky-400 block mb-1">Number / Symbol</span>
                  <span>Match the same number (0-9) or action symbol regardless of color.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="font-bold text-amber-400 block mb-1">Wild Cards</span>
                  <span>Wild and Wild Draw 4 cards can be played on any card at any time.</span>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div>
              <h3 className="font-display font-bold text-sm text-white mb-2 uppercase tracking-wider">
                Special Action Cards
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-display font-bold text-rose-400 shrink-0">⊘ SKIP:</span>
                  <span className="text-slate-400">The next player in rotation is skipped and loses their turn.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-display font-bold text-sky-400 shrink-0">⇄ REVERSE:</span>
                  <span className="text-slate-400">Reverses the direction of play. (In a 2-player game, Reverse acts as a Skip).</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-display font-bold text-emerald-400 shrink-0">+2 DRAW TWO:</span>
                  <span className="text-slate-400">The next player must draw 2 cards from the deck and forfeits their turn.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-display font-bold text-amber-400 shrink-0">★ WILD:</span>
                  <span className="text-slate-400">Play anytime and choose the active color for the next player.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-display font-bold text-purple-400 shrink-0">+4 WILD DRAW 4:</span>
                  <span className="text-slate-400">Play anytime, select next color, and the next player must draw 4 cards and skip turn.</span>
                </div>
              </div>
            </div>

            {/* The UNO Rule */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30">
              <h3 className="font-display font-bold text-sm text-rose-400 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                The UNO! Button & Penalty Rule
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                When you have only <strong>1 card remaining</strong>, you must press the large <strong className="text-rose-400">UNO!</strong> button! If an opponent clicks "Catch UNO!" on you before you call it, you must draw <strong>2 penalty cards</strong>!
              </p>
            </div>

            {/* Scoring */}
            <div>
              <h3 className="font-display font-bold text-sm text-white mb-2 uppercase tracking-wider">
                Scoring Guide
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="font-bold text-slate-200 block">Number 0-9</span>
                  <span className="text-slate-400">Face value (0-9 pts)</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="font-bold text-sky-400 block">Action Cards</span>
                  <span className="text-slate-400">20 pts each</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                  <span className="font-bold text-amber-400 block">Wild Cards</span>
                  <span className="text-slate-400">50 pts each</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Got It, Let's Play!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
