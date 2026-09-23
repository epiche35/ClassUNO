/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, Volume2, Radio } from 'lucide-react';
import { Player } from '../../types/game.js';

interface VoiceControlBarProps {
  isConnected: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  playersInVoice: Player[];
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  error?: string | null;
}

export const VoiceControlBar: React.FC<VoiceControlBarProps> = ({
  isConnected,
  isMuted,
  isSpeaking,
  playersInVoice,
  onJoin,
  onLeave,
  onToggleMute,
  error,
}) => {
  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-1.5 px-3 shadow-xl">
        {!isConnected ? (
          <button
            onClick={onJoin}
            className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Join Voice</span>
          </button>
        ) : (
          <>
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">Voice Connected</span>
              <span className="text-[10px] text-slate-500 font-mono">({playersInVoice.length})</span>
            </div>

            {/* Mute/Unmute */}
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                  : isSpeaking
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50'
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isMuted ? 'Muted' : isSpeaking ? 'Speaking' : 'Mic Active'}</span>
            </button>

            {/* Leave Voice */}
            <button
              onClick={onLeave}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700/80 text-slate-400 transition-colors cursor-pointer"
              title="Leave Voice Chat"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
