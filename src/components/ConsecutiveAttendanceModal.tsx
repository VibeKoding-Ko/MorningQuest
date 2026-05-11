import React from 'react';
import { motion } from 'motion/react';
import { Student } from '../types';
import { X, Flame } from 'lucide-react';

interface Props {
  student: Student;
  onClose: () => void;
}

export default function ConsecutiveAttendanceModal({ student, onClose }: Props) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative border-[6px] border-orange-50"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center mt-4">
          <div className="flex flex-col items-center gap-3 mb-6">
             <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shadow-inner">
               <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
             </div>
             <div className="flex flex-col items-center leading-tight">
               <span className="text-sm text-orange-400 font-black uppercase tracking-wider mb-1">연속 참여 현황</span>
               <span className="text-3xl font-black text-orange-600 tracking-tight">{student.consecutiveDays || 0}일 연속 기록!</span>
             </div>
          </div>

          <div className="w-full flex flex-col gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const isReached = (student.consecutiveDays || 0) >= day;
              const bonus = day === 1 ? 0 : day;
              return (
                <div key={day} className={`flex items-center justify-between px-5 py-3 rounded-[1.25rem] border-2 shadow-sm transition-all ${
                  isReached ? 'bg-orange-500 text-white border-orange-600 scale-[1.02] z-10' : 'bg-white text-gray-400 border-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${isReached ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {day}
                    </div>
                    <span className="font-bold text-sm">{day}일차 연속 참여</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isReached && <span className="text-[10px]">✅</span>}
                    <span className={`${isReached ? 'text-white' : 'text-orange-500'} font-black text-sm`}>+{bonus} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-gray-500 text-sm font-bold mt-6 bg-white/60 px-4 py-2 rounded-xl">매일 꾸준히 참여하고 보너스 경험치를 받으세요!</p>
        </div>
      </motion.div>
    </div>
  );
}
