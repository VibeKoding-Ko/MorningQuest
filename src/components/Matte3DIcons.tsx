import React from 'react';

export const Keyboard3DIcon = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-20 h-20 bg-blue-300 rounded-3xl shadow-[5px_15px_30px_rgba(0,0,0,0.15),inset_-4px_-4px_10px_rgba(0,0,0,0.1),inset_4px_4px_10px_rgba(255,255,255,0.7)] flex flex-col items-center justify-center p-3 gap-1.5 transform hover:scale-105 transition-transform ${className}`}>
    <div className="flex gap-1.5">
      <div className="w-4 h-4 bg-blue-200 rounded-lg shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.8)]"></div>
      <div className="w-4 h-4 bg-blue-200 rounded-lg shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.8)]"></div>
      <div className="w-4 h-4 bg-blue-200 rounded-lg shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.8)]"></div>
    </div>
    <div className="flex gap-1.5">
      <div className="w-4 h-4 bg-blue-200 rounded-lg shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.8)]"></div>
      <div className="w-9 h-4 bg-blue-200 rounded-lg shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.8)]"></div>
    </div>
  </div>
);

export const Book3DIcon = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-20 h-20 flex items-center justify-center transform hover:scale-105 transition-transform ${className}`}>
    <div className="absolute w-16 h-14 bg-green-400 rounded-2xl shadow-[5px_15px_30px_rgba(0,0,0,0.15),inset_-4px_-4px_10px_rgba(0,0,0,0.1),inset_4px_4px_10px_rgba(255,255,255,0.7)]"></div>
    <div className="absolute w-14 h-12 bg-white rounded-xl shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.05),inset_2px_2px_4px_rgba(255,255,255,1)] flex flex-col justify-center gap-1.5 p-2">
       <div className="w-full h-1 bg-green-100 rounded-full"></div>
       <div className="w-3/4 h-1 bg-green-100 rounded-full"></div>
       <div className="w-5/6 h-1 bg-green-100 rounded-full"></div>
    </div>
    <div className="absolute w-2 h-14 bg-green-500 rounded-full shadow-[inset_1px_1px_2px_rgba(255,255,255,0.5)]"></div>
  </div>
);

export const Quote3DIcon = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-20 h-20 bg-purple-300 rounded-[28px] rounded-bl-none shadow-[5px_15px_30px_rgba(0,0,0,0.15),inset_-4px_-4px_10px_rgba(0,0,0,0.1),inset_4px_4px_10px_rgba(255,255,255,0.7)] flex items-center justify-center transform hover:scale-105 transition-transform ${className}`}>
    <div className="flex gap-2">
      <div className="w-4 h-6 bg-purple-500 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.5)]"></div>
      <div className="w-4 h-6 bg-purple-500 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.5)]"></div>
    </div>
  </div>
);

export const Document3DIcon = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-16 h-20 bg-orange-300 rounded-2xl shadow-[5px_15px_30px_rgba(0,0,0,0.15),inset_-4px_-4px_10px_rgba(0,0,0,0.1),inset_4px_4px_10px_rgba(255,255,255,0.7)] flex flex-col items-center py-3 gap-2 transform hover:scale-105 transition-transform ${className}`}>
    <div className="w-10 h-1.5 bg-white rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.1)]"></div>
    <div className="w-12 h-1.5 bg-white rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.1)]"></div>
    <div className="w-11 h-1.5 bg-white rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.1)]"></div>
    <div className="w-8 h-1.5 bg-white rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.1)] self-start ml-2"></div>
  </div>
);

export const Gamepad3DIcon = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-20 h-14 bg-slate-300 rounded-full shadow-[5px_15px_30px_rgba(0,0,0,0.15),inset_-4px_-4px_10px_rgba(0,0,0,0.2),inset_4px_4px_10px_rgba(255,255,255,0.7)] flex items-center justify-between px-3.5 transform hover:scale-105 transition-transform ${className}`}>
    <div className="relative w-6 h-6 flex items-center justify-center">
      <div className="absolute w-6 h-2.5 bg-slate-200 rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.2)]"></div>
      <div className="absolute w-2.5 h-6 bg-slate-200 rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.2)]"></div>
    </div>
    <div className="flex gap-1.5 transform rotate-45">
      <div className="w-3.5 h-3.5 bg-pink-400 rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.5)]"></div>
      <div className="w-3.5 h-3.5 bg-sky-400 rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.5)]"></div>
    </div>
  </div>
);

export const Swords3DIcon = ({ className = '' }: { className?: string }) => (
  <div className={`relative w-20 h-20 bg-red-300 rounded-full shadow-[5px_15px_30px_rgba(0,0,0,0.15),inset_-4px_-4px_10px_rgba(0,0,0,0.2),inset_4px_4px_10px_rgba(255,255,255,0.7)] flex items-center justify-center transform hover:scale-105 transition-transform ${className}`}>
    <div className="relative w-12 h-12 flex items-center justify-center">
      <div className="absolute w-12 h-2 bg-red-100 rounded-full transform rotate-45 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.2)]"></div>
      <div className="absolute w-12 h-2 bg-red-100 rounded-full transform -rotate-45 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.2)]"></div>
      <div className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.3)]"></div>
    </div>
  </div>
);
