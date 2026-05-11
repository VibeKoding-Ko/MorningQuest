import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';

interface XpEffectProps {
  xp: number;
  onComplete: () => void;
}

export default function XpEffect({ xp, onComplete }: XpEffectProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
          {xp > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1.2, y: -50 }}
              exit={{ opacity: 0, scale: 1.5, y: -100 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-50"
                />
                <div className="bg-white px-8 py-4 rounded-full shadow-2xl border-4 border-yellow-400 flex items-center gap-3 relative z-10">
                  <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                  <span className="text-4xl font-black text-yellow-600">+{xp} XP</span>
                </div>
              </div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-2xl font-bold text-white drop-shadow-md"
              >
                경험치 획득!
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3"
            >
              <span className="text-lg font-bold">오늘의 학습이 종료되어 더이상 경험치를 얻을 수 없습니다.</span>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
