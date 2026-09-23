/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Plus, Users, Sparkles } from 'lucide-react';
import { soundManager } from '../../lib/audio.js';

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenJoin: () => void;
  onOpenHowToPlay: () => void;
  onNavigateHome?: () => void;
  inGame?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreate,
  onOpenJoin,
  onOpenHowToPlay,
  onNavigateHome,
  inGame = false,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isEnabled());

  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
  };

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Zone 1: Single text element Brand Zone */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-display font-black text-sm shadow-md group-hover:scale-105 transition-transform">
            U
          </div>
          <span className="font-display font-black text-xl tracking-tight text-white group-hover:text-rose-400 transition-colors">
            classUNO
          </span>
        </button>

        {/* Zone 2: 4 Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={onNavigateHome}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Play Online
          </button>
          <button
            onClick={onOpenJoin}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Join Room
          </button>
          <button
            onClick={onOpenHowToPlay}
            className="hover:text-white transition-colors cursor-pointer"
          >
            How to Play
          </button>
          <button
            onClick={onOpenHowToPlay}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Game Rules
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Sound Mute/Unmute Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          {/* Quick Create Room Button */}
          {!inGame && (
            <button
              onClick={onOpenCreate}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-display font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
