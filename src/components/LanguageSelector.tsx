import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative flex items-center justify-center bg-white/50 backdrop-blur-sm p-1.5 sm:px-2.5 sm:py-1 rounded-full border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 transition-colors">
      <Globe className="w-4 h-4 text-gray-500 sm:text-gray-400 sm:mr-1.5 shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer sm:opacity-100 sm:relative sm:w-auto sm:h-auto sm:bg-transparent text-xs font-bold outline-none"
      >
        <option value="ko">한국어</option>
        <option value="en">English</option>
        <option value="ru">Русский</option>
        <option value="zh">中文</option>
        <option value="vi">Tiếng Việt</option>
      </select>
    </div>
  );
}
