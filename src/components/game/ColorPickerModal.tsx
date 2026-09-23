/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onSelectColor: (color: 'red' | 'blue' | 'green' | 'yellow') => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onSelectColor,
}) => {
  if (!isOpen) return null;

  const colors: Array<{ id: 'red' | 'blue' | 'green' | 'yellow'; name: string; bg: string; hover: string; ring: string }> = [
    { id: 'red', name: 'Red', bg: 'bg-rose-500', hover: 'hover:bg-rose-600', ring: 'ring-rose-400' },
    { id: 'blue', name: 'Blue', bg: 'bg-sky-500', hover: 'hover:bg-sky-600', ring: 'ring-sky-400' },
    { id: 'green', name: 'Green', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', ring: 'ring-emerald-400' },
    { id: 'yellow', name: 'Yellow', bg: 'bg-amber-400', hover: 'hover:bg-amber-500', ring: 'ring-amber-300' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
        >
          {/* Subtle glow header */}
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 bg-gradient-to-tr from-rose-500 via-sky-500 to-amber-400 flex items-center justify-center shadow-lg">
            <span className="text-xl">🎨</span>
          </div>

          <h3 className="font-display font-bold text-2xl text-white mb-2">
            Choose Next Color
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Select the active color for the next player.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {colors.map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectColor(c.id)}
                className={`h-24 rounded-2xl ${c.bg} ${c.hover} text-white font-display font-bold text-lg shadow-lg flex flex-col items-center justify-center transition-all cursor-pointer border border-white/20`}
              >
                <span>{c.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
