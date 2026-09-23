/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Card, CardColor } from '../../types/game.js';
import { Ban, RotateCcw } from 'lucide-react';

interface UnoCardProps {
  card: Card;
  isPlayable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'hand';
  className?: string;
  faceDown?: boolean;
  highlightColor?: string;
  showBackLabel?: boolean;
}

export const UnoCard: React.FC<UnoCardProps> = ({
  card,
  isPlayable = false,
  onClick,
  size = 'md',
  className = '',
  faceDown = false,
  highlightColor,
  showBackLabel = true,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-18 text-xs rounded-md',
    md: 'w-20 h-28 text-sm rounded-xl',
    lg: 'w-28 h-40 text-lg rounded-2xl',
    hand: 'w-24 sm:w-28 md:w-32 h-36 sm:h-42 md:h-48 text-base sm:text-lg rounded-2xl shadow-xl',
  };

  const colorStyles: Record<CardColor, { bg: string; border: string; text: string; shadow: string }> = {
    red: {
      bg: 'bg-gradient-to-br from-rose-500 to-red-600',
      border: 'border-rose-400',
      text: 'text-rose-600',
      shadow: 'shadow-rose-950/40',
    },
    blue: {
      bg: 'bg-gradient-to-br from-sky-500 to-blue-600',
      border: 'border-sky-400',
      text: 'text-blue-600',
      shadow: 'shadow-blue-950/40',
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
      border: 'border-emerald-300',
      text: 'text-emerald-600',
      shadow: 'shadow-emerald-950/40',
    },
    yellow: {
      bg: 'bg-gradient-to-br from-amber-400 to-amber-500',
      border: 'border-amber-300',
      text: 'text-amber-600',
      shadow: 'shadow-amber-950/40',
    },
    wild: {
      bg: 'bg-gradient-to-br from-slate-900 via-neutral-900 to-black',
      border: 'border-neutral-600',
      text: 'text-white',
      shadow: 'shadow-black/60',
    },
  };

  const style = colorStyles[card.color];

  // If face down (back of card)
  if (faceDown) {
    return (
      <div
        className={`relative select-none border border-slate-700 bg-gradient-to-br from-neutral-900 via-slate-950 to-black flex items-center justify-center p-1.5 transition-transform ${sizeClasses[size]} ${className}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="w-full h-full rounded-lg border-2 border-rose-600/40 bg-slate-900/90 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-600/20 via-transparent to-transparent opacity-60" />
          <div className="w-10/12 h-3/5 rounded-[50%] bg-gradient-to-tr from-rose-600 to-red-500 rotate-[-30deg] flex items-center justify-center shadow-lg border border-rose-300/40">
            {showBackLabel && (
              <span className="font-display font-extrabold text-white text-xs sm:text-sm tracking-wider uppercase drop-shadow-md">
                UNO
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderCenterContent = () => {
    switch (card.type) {
      case 'number':
        return (
          <span className={`font-display font-black text-3xl sm:text-4xl md:text-5xl drop-shadow-sm ${style.text}`}>
            {card.value}
          </span>
        );
      case 'skip':
        return <Ban className={`w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5] ${style.text}`} />;
      case 'reverse':
        return <RotateCcw className={`w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5] ${style.text}`} />;
      case 'draw2':
        return (
          <span className={`font-display font-black text-2xl sm:text-3xl tracking-tighter ${style.text}`}>
            +2
          </span>
        );
      case 'wild':
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 shadow-inner border border-white/40">
            <div className="bg-rose-500" />
            <div className="bg-sky-500" />
            <div className="bg-amber-400" />
            <div className="bg-emerald-500" />
          </div>
        );
      case 'wild4':
        return (
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full overflow-hidden grid grid-cols-2 grid-rows-2 shadow-inner mb-0.5 border border-white/40">
              <div className="bg-rose-500" />
              <div className="bg-sky-500" />
              <div className="bg-amber-400" />
              <div className="bg-emerald-500" />
            </div>
            <span className="font-display font-black text-white text-xl sm:text-2xl drop-shadow-md tracking-tighter">
              +4
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCornerBadge = (position: 'top-left' | 'bottom-right') => {
    const isBottom = position === 'bottom-right';
    const alignClass = isBottom
      ? 'bottom-1.5 right-2 rotate-180'
      : 'top-1.5 left-2';

    let content: React.ReactNode = null;
    if (card.type === 'number') {
      content = card.value;
    } else if (card.type === 'skip') {
      content = <Ban className="w-3 h-3 stroke-[2.5]" />;
    } else if (card.type === 'reverse') {
      content = <RotateCcw className="w-3 h-3 stroke-[2.5]" />;
    } else if (card.type === 'draw2') {
      content = '+2';
    } else if (card.type === 'wild') {
      content = '★';
    } else if (card.type === 'wild4') {
      content = '+4';
    }

    return (
      <div
        className={`absolute ${alignClass} font-display font-bold text-xs sm:text-sm text-white/95 drop-shadow flex items-center justify-center pointer-events-none select-none`}
      >
        {content}
      </div>
    );
  };

  return (
    <motion.div
      whileHover={isPlayable ? { y: -16, scale: 1.05, transition: { duration: 0.15 } } : {}}
      whileTap={isPlayable ? { scale: 0.98 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`relative select-none border-2 ${style.border} ${style.bg} ${style.shadow} ${sizeClasses[size]} p-1.5 transition-all duration-200 ${
        isPlayable
          ? 'cursor-pointer hover:ring-4 hover:ring-white/80 ring-offset-2 ring-offset-slate-900 shadow-2xl'
          : onClick
          ? 'cursor-not-allowed opacity-65 grayscale-[30%]'
          : 'cursor-default'
      } ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: highlightColor ? `0 0 20px ${highlightColor}` : undefined,
      }}
    >
      {/* Corner indicators */}
      {renderCornerBadge('top-left')}
      {renderCornerBadge('bottom-right')}

      {/* Center White Oval/Diamond */}
      <div className="w-full h-full rounded-xl bg-white/95 flex items-center justify-center relative overflow-hidden shadow-inner rotate-[-18deg]">
        <div className="rotate-[18deg] flex items-center justify-center">
          {renderCenterContent()}
        </div>
      </div>
    </motion.div>
  );
};
