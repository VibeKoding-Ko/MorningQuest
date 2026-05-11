import React from 'react';
import { motion } from 'motion/react';
import { Student } from '../types';
import { RankIcon, RankBadge } from '../lib/rank';
import { X, Trophy, Flame, Star, Target, LogOut } from 'lucide-react';
import { getLevelProgress } from '../lib/levelUtils';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  student: Student;
  onClose: () => void;
  onLogout: () => void;
}

export default function StudentInfoModal({ student, onClose, onLogout }: Props) {
  const { t } = useLanguage();
  const { level, currentLevelXp, nextLevelXp, progressPercent } = getLevelProgress(student.xp);
  const progress = progressPercent;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-end justify-center p-0 sm:p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.8}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        exit={{ y: '100%' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'none' }}
        className="bg-white rounded-t-[2.5rem] sm:rounded-b-[2.5rem] p-8 pb-12 sm:pb-8 w-full max-w-md shadow-2xl relative overflow-y-auto max-h-[90vh] border-t-[6px] sm:border-[6px] border-blue-50 modal-scrollbar"
      >
        <div 
          className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden cursor-pointer hover:bg-gray-300 transition-colors" 
          onClick={onClose}
        />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10 hidden sm:block"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 mt-2 sm:mt-4">
          <div className="relative inline-block mb-4 group">
            <div className="absolute inset-0 bg-blue-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <RankIcon level={student.level} className="w-28 h-28 sm:w-32 sm:h-32 text-6xl mx-auto drop-shadow-2xl relative z-10 transition-transform group-hover:scale-105" />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-b from-yellow-300 to-yellow-500 text-yellow-900 text-sm font-black px-4 py-1.5 rounded-2xl border-[3px] border-white shadow-lg z-20">
              Lv.{student.level}
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">{student.nickname || student.name}</h2>
          <p className="text-gray-400 font-bold mt-1">
            {student.school ? `${student.school} ` : ''}{student.grade}학년 {student.class}반
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-black text-blue-400 uppercase tracking-wider">레벨 진행도</span>
            <span className="text-sm font-black text-blue-600">
              다음 레벨까지 {nextLevelXp - currentLevelXp}XP
            </span>
          </div>
          <div className="h-5 bg-white rounded-full overflow-hidden mb-3 border-[3px] border-white shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 rounded-full"
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-black">
            <span>{currentLevelXp} XP</span>
            <span>{nextLevelXp} XP</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
            <span className="text-[10px] text-gray-400 font-black uppercase mb-1">누적 경험치</span>
            <span className="text-xl font-black text-gray-800">{student.xp.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <Star className="w-8 h-8 text-indigo-500 fill-indigo-500 mb-2" />
            <span className="text-[10px] text-gray-400 font-black uppercase mb-1">보유 별조각</span>
            <span className="text-xl font-black text-indigo-700">{student.starPieces || 0}</span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl font-black transition-all border-2 border-dashed border-gray-200 hover:border-red-200"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </motion.div>
    </div>
  );
}
