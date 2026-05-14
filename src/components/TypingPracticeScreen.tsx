import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Trophy, ArrowRight, Keyboard, Star, Lock, CheckCircle2 } from 'lucide-react';
import { Keyboard3DIcon, Book3DIcon, Quote3DIcon, Document3DIcon, Gamepad3DIcon, Swords3DIcon } from './Matte3DIcons';
import { calculateTypingScoreFromStats, StageKey } from '../lib/typingScore';
import { useLanguage } from '../contexts/LanguageContext';
import RankingModal from './RankingModal';
import wordsData from '../data/words.json';
import sentencesData from '../data/sentences.json';
import paragraphsData from '../data/paragraphs.json';

const KEY_CODE_TO_KOREAN: Record<string, string> = {
  'KeyQ': 'ㅂ', 'KeyW': 'ㅈ', 'KeyE': 'ㄷ', 'KeyR': 'ㄱ', 'KeyT': 'ㅅ', 'KeyY': 'ㅛ', 'KeyU': 'ㅕ', 'KeyI': 'ㅑ', 'KeyO': 'ㅐ', 'KeyP': 'ㅔ',
  'KeyA': 'ㅁ', 'KeyS': 'ㄴ', 'KeyD': 'ㅇ', 'KeyF': 'ㄹ', 'KeyG': 'ㅎ', 'KeyH': 'ㅗ', 'KeyJ': 'ㅓ', 'KeyK': 'ㅏ', 'KeyL': 'ㅣ', 'Semicolon': ';',
  'KeyZ': 'ㅋ', 'KeyX': 'ㅌ', 'KeyC': 'ㅊ', 'KeyV': 'ㅍ', 'KeyB': 'ㅠ', 'KeyN': 'ㅜ', 'KeyM': 'ㅡ', 'Comma': ',', 'Period': '.', 'Slash': '/'
};

const getTypingSequence = (text: string): string[] => {
  const CHO_CHARS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG_CHARS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONG_CHARS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  let seq: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode >= 0xac00 && charCode <= 0xd7a3) {
      const offset = charCode - 0xac00;
      const jong = offset % 28;
      const jung = Math.floor((offset - jong) / 28) % 21;
      const cho = Math.floor(Math.floor((offset - jong) / 28) / 21);
      
      seq.push(CHO_CHARS[cho]);
      
      if (jung === 9) seq.push('ㅗ', 'ㅏ');
      else if (jung === 10) seq.push('ㅗ', 'ㅐ');
      else if (jung === 11) seq.push('ㅗ', 'ㅣ');
      else if (jung === 14) seq.push('ㅜ', 'ㅓ');
      else if (jung === 15) seq.push('ㅜ', 'ㅔ');
      else if (jung === 16) seq.push('ㅜ', 'ㅣ');
      else if (jung === 19) seq.push('ㅡ', 'ㅣ');
      else seq.push(JUNG_CHARS[jung]);
      
      if (jong > 0) {
        if (jong === 3) seq.push('ㄱ', 'ㅅ');
        else if (jong === 5) seq.push('ㄴ', 'ㅈ');
        else if (jong === 6) seq.push('ㄴ', 'ㅎ');
        else if (jong === 9) seq.push('ㄹ', 'ㄱ');
        else if (jong === 10) seq.push('ㄹ', 'ㅁ');
        else if (jong === 11) seq.push('ㄹ', 'ㅂ');
        else if (jong === 12) seq.push('ㄹ', 'ㅅ');
        else if (jong === 13) seq.push('ㄹ', 'ㅌ');
        else if (jong === 14) seq.push('ㄹ', 'ㅍ');
        else if (jong === 15) seq.push('ㄹ', 'ㅎ');
        else if (jong === 18) seq.push('ㅂ', 'ㅅ');
        else seq.push(JONG_CHARS[jong]);
      }
    } else {
      seq.push(text[i]);
    }
  }
  return seq;
};

const isJamoPrefix = (input: string, target: string) => {
  if (!input || !target) return false;
  const inputSeq = getTypingSequence(input.normalize('NFC')).join('');
  const targetSeq = getTypingSequence(target.normalize('NFC')).join('');
  return targetSeq.startsWith(inputSeq) || inputSeq.startsWith(targetSeq);
};

export const getCorrectStrokes = (target: string, input: string): number => {
    const targetSeq = getTypingSequence(target);
    const inputSeq = getTypingSequence(input);
    
    let correctCount = 0;
    for (let i = 0; i < Math.min(targetSeq.length, inputSeq.length); i++) {
        if (targetSeq[i] === inputSeq[i]) {
            const isDouble = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅒ', 'ㅖ'].includes(targetSeq[i]);
            correctCount += isDouble ? 2 : 1;
        } else {
            break;
        }
    }
    return correctCount;
};

const getStrokeCount = (text: string) => {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Hangul Syllables
    if (charCode >= 0xac00 && charCode <= 0xd7a3) {
      const offset = charCode - 0xac00;
      const jong = offset % 28;
      const jung = Math.floor((offset - jong) / 28) % 21;
      const cho = Math.floor(Math.floor((offset - jong) / 28) / 21);
      
      const doubleCho = [1, 4, 8, 10, 13].includes(cho);
      count += doubleCho ? 2 : 1;
      
      const doubleJung = [9, 10, 11, 14, 15, 16, 19].includes(jung);
      count += doubleJung ? 2 : 1;
      
      if (jong > 0) {
        const doubleJong = [2, 3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18, 20].includes(jong);
        count += doubleJong ? 2 : 1;
      }
    } else {
      count += 1;
    }
  }
  return count;
};

const LEVELS: Record<number, string[]> = {
  1: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';'],
  2: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅃ', 'ㅉ', 'ㄸ', 'ㄲ'],
  3: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅡ', ',', '.', '/', 'ㅒ', 'ㅖ', '<', '>', '?'],
  4: ['ㅎ', 'ㅗ', 'ㅅ', 'ㅛ', 'ㅠ', 'ㅜ', 'ㅆ'],
  5: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'],
  6: [] // this will be handled dynamically in getRandomChar
};

const getRandomChar = (step: number) => {
  let pool = LEVELS[step];
  if (step === 5) {
    // 5단계: !@#$%^&*()_+는 확률 10%
    const isSpecial = Math.random() < 0.1;
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const specials = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'];
    pool = isSpecial ? specials : numbers;
  } else if (step === 6) {
    // 6단계 전체 (이전 단계들을 적절히 섞음, 5단계도 포함할 수 있지만 특수기호 비율 조절)
    pool = [...LEVELS[1], ...LEVELS[2], ...LEVELS[3], ...LEVELS[4], ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']];
  }
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
};

const HOME_ROW_KEYS = ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';'];

const needsLeftShift = (char: string | undefined): boolean => {
  if (!char) return false;
  const leftShiftChars = ['ㅒ', 'ㅖ', '<', '>', '?', '!', '@', '#', '$', '%'];
  return leftShiftChars.includes(char);
};

const needsRightShift = (char: string | undefined): boolean => {
  if (!char) return false;
  const rightShiftChars = ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', '^', '&', '*', '(', ')', '_', '+'];
  return rightShiftChars.includes(char);
};

const getUnshiftedKey = (char: string | undefined): string | null => {
  if (!char) return null;
  const map: Record<string, string> = {
    'ㅃ': 'ㅂ', 'ㅉ': 'ㅈ', 'ㄸ': 'ㄷ', 'ㄲ': 'ㄱ', 'ㅆ': 'ㅅ',
    'ㅒ': 'ㅐ', 'ㅖ': 'ㅔ', '<': ',', '>': '.', '?': '/',
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '='
  };
  return map[char] || char;
};
const getHomeKeyToHide = (target: string | undefined): string | null => {
  if (!target) return null;
  const map: Record<string, string> = {
    'ㅂ': 'ㅁ', 'ㅋ': 'ㅁ', 'ㅃ': 'ㅁ', '1': 'ㅁ', '!': 'ㅁ',
    'ㅈ': 'ㄴ', 'ㅌ': 'ㄴ', 'ㅉ': 'ㄴ', '2': 'ㄴ', '@': 'ㄴ',
    'ㄷ': 'ㅇ', 'ㅊ': 'ㅇ', 'ㄸ': 'ㅇ', '3': 'ㅇ', '#': 'ㅇ',
    'ㄱ': 'ㄹ', 'ㅅ': 'ㄹ', 'ㅍ': 'ㄹ', 'ㅠ': 'ㄹ', 'ㄲ': 'ㄹ', 'ㅆ': 'ㄹ', '4': 'ㄹ', '$': 'ㄹ', '5': 'ㄹ', '%': 'ㄹ',
    'ㅛ': 'ㅓ', 'ㅕ': 'ㅓ', 'ㅗ': 'ㅓ', 'ㅜ': 'ㅓ', 'ㅡ': 'ㅓ', '6': 'ㅓ', '^': 'ㅓ', '7': 'ㅓ', '&': 'ㅓ',
    'ㅑ': 'ㅏ', '8': 'ㅏ', '*': 'ㅏ', ',': 'ㅏ', '<': 'ㅏ',
    'ㅐ': 'ㅣ', 'ㅒ': 'ㅣ', '9': 'ㅣ', '(': 'ㅣ', '.': 'ㅣ', '>': 'ㅣ',
    'ㅔ': ';', 'ㅖ': ';', '0': ';', ')': ';', '-': ';', '_': ';', '=': ';', '+': ';', '/': ';', '?': ';'
  };
  return map[target] || null;
};

const ROW1 = [
  { label: '`', shift: '~' }, { label: '1', shift: '!' }, { label: '2', shift: '@' }, { label: '3', shift: '#' }, { label: '4', shift: '$' }, { label: '5', shift: '%' }, { label: '6', shift: '^' }, { label: '7', shift: '&' }, { label: '8', shift: '*' }, { label: '9', shift: '(' }, { label: '0', shift: ')' }, { label: '-', shift: '_' }, { label: '=', shift: '+' }, { label: '⌫', w: 'flex-grow min-w-[40px] max-w-[60px] sm:min-w-[50px] sm:max-w-[70px]' }
];
const ROW2 = [
  { label: 'Tab', w: 'flex-grow min-w-[30px] sm:min-w-[45px] max-w-[70px]' }, { label: 'ㅂ', shift: 'ㅃ' }, { label: 'ㅈ', shift: 'ㅉ' }, { label: 'ㄷ', shift: 'ㄸ' }, { label: 'ㄱ', shift: 'ㄲ' }, { label: 'ㅅ', shift: 'ㅆ' }, { label: 'ㅛ' }, { label: 'ㅕ' }, { label: 'ㅑ' }, { label: 'ㅐ', shift: 'ㅒ' }, { label: 'ㅔ', shift: 'ㅖ' }, { label: '[' }, { label: ']' }, { label: '\\', w: 'flex-grow min-w-[40px] max-w-[50px] sm:max-w-[70px]' }
];
const ROW3 = [
  { label: 'Caps', w: 'flex-grow min-w-[40px] sm:min-w-[55px] max-w-[80px]' }, { label: 'ㅁ' }, { label: 'ㄴ' }, { label: 'ㅇ' }, { label: 'ㄹ' }, { label: 'ㅎ' }, { label: 'ㅗ' }, { label: 'ㅓ' }, { label: 'ㅏ' }, { label: 'ㅣ' }, { label: ';' }, { label: '\'' }, { label: 'Enter', w: 'flex-grow min-w-[50px] max-w-[70px] sm:max-w-[90px]' }
];
const ROW4 = [
  { id: 'ShiftL', label: 'Shift', w: 'flex-grow min-w-[50px] sm:min-w-[70px] max-w-[100px]' }, { label: 'ㅋ' }, { label: 'ㅌ' }, { label: 'ㅊ' }, { label: 'ㅍ' }, { label: 'ㅠ' }, { label: 'ㅜ' }, { label: 'ㅡ' }, { label: ',', shift: '<' }, { label: '.', shift: '>' }, { label: '/', shift: '?' }, { id: 'ShiftR', label: 'Shift', w: 'flex-grow min-w-[60px] max-w-[80px] sm:max-w-[110px]' }
];
const ROW5 = [
  { label: 'Ctrl', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }, { label: 'Win', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }, { label: 'Alt', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }, { label: '한자', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }, { label: 'Space', w: 'flex-grow min-w-[120px] max-w-[180px] sm:min-w-[180px] sm:max-w-[260px]' }, { label: '한/영', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }, { label: 'Alt', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }, { label: 'Fn', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }, { label: 'Ctrl', w: 'flex-grow min-w-[30px] max-w-[40px] sm:min-w-[44px] sm:max-w-[48px]' }
];

function VirtualKey({ label, shiftLabel, isTarget, isHomeRow, widthClass = "w-8 sm:w-11 text-[10px] sm:text-xs" }: { key?: React.Key, label: string, shiftLabel?: string, isTarget: boolean, isHomeRow: boolean, widthClass?: string }) {
  let bgClass = "bg-white border-gray-300 text-gray-700";
  if (isTarget) {
    bgClass = "bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300 z-10 font-black scale-110 shadow-lg text-sm sm:text-base";
  } else if (isHomeRow) {
    bgClass = "bg-yellow-100 border-yellow-300 text-yellow-800";
  }

  return (
    <div className={`${widthClass} h-9 sm:h-11 border border-b-[3px] sm:border-b-[4px] rounded-md sm:rounded-lg flex flex-col justify-center items-center font-bold transition-all ${bgClass} overflow-hidden px-1`}>
      {shiftLabel && <span className="text-[8px] sm:text-[9px] leading-none mb-0.5 opacity-80">{shiftLabel}</span>}
      <span className="truncate w-full text-center leading-none">{label}</span>
    </div>
  );
}

import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Student } from '../types';

interface Props {
  initialGrade?: number;
  student?: Student;
  onClose: () => void;
  onComplete: (cpm: number, accuracy: number, score?: number, menu?: string, step?: number) => void;
}

type ViewState = 'HOME' | 'PRACTICE';
type MenuType = 'BASIC' | 'WORD' | 'SENTENCE' | 'PARAGRAPH' | 'GAME' | 'BATTLE';

const MAX_TARGET = 50;

const getStageKeyForBasic = (s: number): StageKey => {
  switch(s) {
    case 1: return '기초_1단계_기본자리';
    case 2: return '기초_2단계_윗자리';
    case 3: return '기초_3단계_아랫자리';
    case 4: return '기초_4단계_가운데자리';
    case 5: return '기초_5단계_숫자자리';
    case 6: return '기초_6단계_전체자리';
    default: return '기초_1단계_기본자리';
  }
};

export default function TypingPracticeScreen({ onClose, onComplete, initialGrade, student }: Props) {
  const { t } = useLanguage();
  const studentGrade = student?.grade || 1;
  const gradeToUse = initialGrade || studentGrade;
  const [view, setView] = useState<ViewState>('HOME');
  const [menu, setMenu] = useState<MenuType>('BASIC');
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  
  const [step, setStep] = useState(gradeToUse);
  const [items, setItems] = useState<{id: number, char: string, status: 'pending'|'correct'|'incorrect', errorCount?: number}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [activeTypingTime, setActiveTypingTime] = useState<number>(0);
  const [wordStartTime, setWordStartTime] = useState<number | null>(null);
  const [correctChars, setCorrectChars] = useState(0);
  const [lastMeasuredCpm, setLastMeasuredCpm] = useState<number>(0);
  const [typedStrokes, setTypedStrokes] = useState<number>(0);
  const [sessionMaxCpm, setSessionMaxCpm] = useState<number>(0);
  const [selectedParagraph, setSelectedParagraph] = useState<{title: string, content: string} | null>(null);
  const [now, setNow] = useState(Date.now());

  // States specific to the new features
  const [basicScores, setBasicScores] = useState<Record<number, number>>(student?.typingBasicScores || {1:0, 2:0, 3:0, 4:0, 5:0, 6:0});
  const [maxWordCpm, setMaxWordCpm] = useState<number>(student?.typingMaxCpm || 0);
  const [paragraphScore, setParagraphScore] = useState<number>(student?.typingParagraphScore || 0);
  const [wordInput, setWordInput] = useState('');
  
  const [stars, setStars] = useState<Record<string, number>>(student?.typingStars || {
    BASIC: 0,
    WORD: 0,
    SENTENCE: 0,
    PARAGRAPH: 0
  });

  const prevStats = useRef({ stars, maxWordCpm, paragraphScore, basicScores });
  useEffect(() => {
    if (!student?.studentId) return;
    
    // Check if changed
    const p = prevStats.current;
    if (
      JSON.stringify(p.stars) !== JSON.stringify(stars) ||
      p.maxWordCpm !== maxWordCpm ||
      p.paragraphScore !== paragraphScore ||
      JSON.stringify(p.basicScores) !== JSON.stringify(basicScores)
    ) {
      const updateData: Partial<Student> = {
        typingMaxCpm: maxWordCpm,
        typingParagraphScore: paragraphScore,
        typingStars: stars,
        typingBasicScores: basicScores
      };
      
      updateDoc(doc(db, 'students', student.studentId), updateData).catch(err => {
         console.error("Failed to update typing stats", err);
      });
      
      prevStats.current = { stars, maxWordCpm, paragraphScore, basicScores };
    }
  }, [stars, maxWordCpm, paragraphScore, basicScores, student]);

  // Calculate generic basic stars
  useEffect(() => {
    const total = (Object.values(basicScores) as number[]).reduce((a: number, b: number) => a + b, 0);
    let s = 0;
    if (total >= 140) s = 3;
    else if (total >= 120) s = 2;
    else if (total >= 80) s = 1;

    setStars(prev => prev.BASIC !== s ? { ...prev, BASIC: s } : prev);
  }, [basicScores]);

  useEffect(() => {
    if (view === 'PRACTICE' && !completed && startTime) {
      const interval = setInterval(() => setNow(Date.now()), 100);
      return () => clearInterval(interval);
    }
  }, [view, completed, startTime]);

  const maxTarget = menu === 'BASIC' ? 50 : (menu === 'WORD' ? 50 : (menu === 'SENTENCE' ? 20 : (menu === 'PARAGRAPH' ? Math.max(1, items.length) : 200)));
  const elapsedMinutes = startTime ? (now - startTime) / 60000 : 0.01;
  const wordActiveMinutes = (activeTypingTime + (wordStartTime ? now - wordStartTime : 0)) / 60000;
  
  let currentCpm = 0;
  if (menu === 'BASIC') {
    currentCpm = elapsedMinutes > 0 ? Math.floor(currentIndex / Math.max(0.01, elapsedMinutes)) : 0;
  } else if (menu === 'WORD' || menu === 'SENTENCE' || menu === 'PARAGRAPH') {
    if (completed) {
       currentCpm = wordActiveMinutes > 0 ? Math.floor(typedStrokes / Math.max(0.01, wordActiveMinutes)) : 0;
    } else {
       if (wordStartTime) {
         const currentWordStrokes = wordInput && items[currentIndex]?.char ? getCorrectStrokes(items[currentIndex].char, wordInput) : 0;
         if (menu === 'PARAGRAPH') {
           const totalStrokesObj = typedStrokes + currentWordStrokes;
           currentCpm = wordActiveMinutes > 0 ? Math.floor(totalStrokesObj / wordActiveMinutes) : 0;
         } else {
           const currentWordMinutes = (now - wordStartTime) / 60000;
           currentCpm = currentWordMinutes > 0 && wordInput ? Math.floor(currentWordStrokes / currentWordMinutes) : 0;
         }
       } else {
         currentCpm = lastMeasuredCpm;
       }
    }
  }

  let currentAccuracy = 100;
  if (menu === 'BASIC' || menu === 'WORD') {
    currentAccuracy = currentIndex + mistakes > 0 ? Math.floor((currentIndex / (currentIndex + mistakes)) * 100) : 100;
  } else {
    currentAccuracy = correctChars + mistakes > 0 ? Math.floor((correctChars / (correctChars + mistakes)) * 100) : 100;
  }
  
  const SCORE_LIMITS: Record<number, number> = { 1: 40, 2: 60, 3: 80, 4: 100, 5: 120, 6: 140 };

  const currentScoreInfo = calculateTypingScoreFromStats({
    totalChars: menu === 'BASIC' ? maxTarget : (menu === 'WORD' ? items.reduce((acc, it) => acc + it.char.length, 0) : items.reduce((acc, it) => acc + it.char.length, 0)),
    correctChars: menu === 'BASIC' ? currentIndex : (menu === 'WORD' ? items.reduce((acc, it, idx) => acc + (idx < currentIndex && it.status === 'correct' ? it.char.length : 0), 0) : correctChars),
    wrongChars: mistakes,
    elapsedSeconds: (menu === 'SENTENCE' || menu === 'PARAGRAPH') ? ((activeTypingTime + (wordStartTime ? now - wordStartTime : 0)) / 1000 || 0.6) : (startTime ? (now - startTime) / 1000 : 0.6),
    stageKey: menu === 'BASIC' ? getStageKeyForBasic(step) : (menu === 'WORD' ? '단어연습' : (menu === 'SENTENCE' ? '문장연습' : '문단연습'))
  });
  
  let currentScore = currentScoreInfo.finalScore;
  if (menu === 'BASIC' && currentScore > SCORE_LIMITS[step]) {
     currentScore = SCORE_LIMITS[step];
  }

  // Update records on completion
  useEffect(() => {
    if (completed) {
      if (menu === 'BASIC') {
         setBasicScores(prev => {
            if (currentScore > prev[step]) {
               return { ...prev, [step]: currentScore };
            }
            return prev;
         });
         if (currentScore >= SCORE_LIMITS[step]) {
            // Success
         }
      } else if (menu === 'WORD') {
         setMaxWordCpm(prev => currentCpm > prev ? currentCpm : prev);
         if (currentAccuracy >= 80) {
            setStars(prev => prev.WORD !== 3 ? { ...prev, WORD: 3 } : prev);
         }
      } else if (menu === 'SENTENCE') {
         if (currentAccuracy >= 80) {
            setStars(prev => prev.SENTENCE !== 3 ? { ...prev, SENTENCE: 3 } : prev);
         }
      } else if (menu === 'PARAGRAPH') {
         setParagraphScore(prev => currentScore > prev ? currentScore : prev);
         if (currentAccuracy >= 80) {
            setStars(prev => prev.PARAGRAPH !== 3 ? { ...prev, PARAGRAPH: 3 } : prev);
         }
      }
    }
  }, [completed, menu, step, currentScore, currentCpm, currentAccuracy]);

  const clearPracticeState = () => {
    setCompleted(false);
    setItems([]);
    setCurrentIndex(0);
    setMistakes(0);
    setCorrectChars(0);
    setTypedStrokes(0);
    setStartTime(null);
    setWordStartTime(null);
    setActiveTypingTime(0);
    setSelectedParagraph(null);
  };

  const initLevel = (lvl: number) => {
    const newItems = [];
    if (menu === 'BASIC') {
      let lastChar = '';
      for (let i = 0; i < maxTarget; i++) {
        let char = getRandomChar(lvl);
        while (char === lastChar) {
          char = getRandomChar(lvl);
        }
        lastChar = char;
        newItems.push({ id: i, char, status: 'pending' as const });
      }
    } else if (menu === 'WORD' || menu === 'SENTENCE') {
      const sourceData = menu === 'WORD' ? wordsData : sentencesData;
      const levelsMap = sourceData as Record<string, string[]>;
      const pool = [...(levelsMap[lvl.toString()] || levelsMap["1"])];
      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      for (let i = 0; i < maxTarget; i++) {
         const char = pool[i % pool.length];
         newItems.push({ id: i, char, status: 'pending' as const });
      }
      setWordInput('');
    } else if (menu === 'PARAGRAPH') {
       // Paragraphs are selected by user, so we will probably init them when a user selects a title
       // Not here in the automatic initialization for now.
    }
    
    setStep(lvl);
    setItems(newItems);
    setCurrentIndex(0);
    setMistakes(0);
    setCompleted(false);
    setStartTime(null);
    setWordStartTime(null);
    setActiveTypingTime(0);
    setCorrectChars(0);
    setLastMeasuredCpm(0);
    setTypedStrokes(0);
    setSessionMaxCpm(0);
  };

  // Initialize queue for practice
  useEffect(() => {
    if (view === 'PRACTICE' && items.length === 0 && menu !== 'PARAGRAPH') {
      initLevel(step);
    }
  }, [view, menu, step]);

  // Handle keystrokes
  useEffect(() => {
    if (view !== 'PRACTICE' || menu !== 'BASIC' || completed || items.length === 0 || currentIndex >= maxTarget) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier combinations
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.code.includes('Shift') || e.code.includes('Control') || e.code.includes('Alt') || e.code.includes('Meta')) return;
      
      let mappedChar = KEY_CODE_TO_KOREAN[e.code];
      const actualTarget = items[currentIndex].char;

      if (e.shiftKey && mappedChar) {
         const shiftMap: Record<string, string> = {
           'ㅂ': 'ㅃ', 'ㅈ': 'ㅉ', 'ㄷ': 'ㄸ', 'ㄱ': 'ㄲ', 'ㅅ': 'ㅆ',
           'ㅐ': 'ㅒ', 'ㅔ': 'ㅖ',
           ',': '<', '.': '>', '/': '?'
         };
         mappedChar = shiftMap[mappedChar] || mappedChar;
      }
      
      // Numbers and special chars handling if not in KEY_CODE_TO_KOREAN
      if (!mappedChar && e.key.length === 1) {
         mappedChar = e.key;
      }

      if (mappedChar) {
        setStartTime(prev => prev || Date.now());
        const isCorrect = (mappedChar === actualTarget || e.key === actualTarget);
        
        if (isCorrect) {
           setItems(prev => {
             const newItems = [...prev];
             newItems[currentIndex] = { ...newItems[currentIndex], status: 'correct' };
             return newItems;
           });
           setCurrentIndex(prev => {
             const nextIndex = prev + 1;
             if (nextIndex >= maxTarget) setCompleted(true);
             return nextIndex;
           });
        } else {
           setMistakes(m => m + 1);
           setItems(prev => {
             const newItems = [...prev];
             newItems[currentIndex] = { 
               ...newItems[currentIndex], 
               status: 'incorrect',
               errorCount: (newItems[currentIndex].errorCount || 0) + 1
             };
             return newItems;
           });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, menu, completed, items, currentIndex, maxTarget]);

  const handleLevelChange = (newStep: number) => {
    initLevel(newStep);
  };

  const calculateResults = () => {
    let cpm = 0;
    let accuracy = 0;
    
    if (menu === 'BASIC') {
      const elapsedMinutes = startTime ? (Date.now() - startTime) / 60000 : 1;
      cpm = Math.max(10, Math.floor(maxTarget / elapsedMinutes));
      accuracy = Math.max(0, Math.floor((maxTarget / Math.max(1, maxTarget + mistakes)) * 100));
    } else if (menu === 'WORD' || menu === 'SENTENCE' || menu === 'PARAGRAPH') {
      const elapsedMinutes = activeTypingTime / 60000;
      cpm = elapsedMinutes > 0 ? Math.floor(typedStrokes / (elapsedMinutes || 0.01)) : 0;
      if (menu === 'WORD') {
         accuracy = currentIndex + mistakes > 0 ? Math.floor((currentIndex / (currentIndex + mistakes)) * 100) : 100;
      } else {
         accuracy = correctChars + mistakes > 0 ? Math.floor((correctChars / (correctChars + mistakes)) * 100) : 100;
      }
    }
    
    return { cpm, accuracy };
  };

  const handleNextLevel = () => {
    const nextStep = step < (menu === 'WORD' ? 6 : 5) ? step + 1 : 1;
    handleLevelChange(nextStep);
  };

  const renderPracticeButton = (title: string, Icon: any, menuKey: MenuType, requireKey?: MenuType) => {
    const isLocked = requireKey && (stars[requireKey as keyof typeof stars] || 0) < 3;
    const starsCount = stars[menuKey as keyof typeof stars] || 0;

    return (
      <button 
        onClick={() => {
          if (isLocked) {
             alert('이전 단계에서 별 3개를 획득해야 합니다.');
             return;
          }
          if (menuKey === 'BASIC' || menuKey === 'WORD' || menuKey === 'SENTENCE' || menuKey === 'PARAGRAPH') {
            setMenu(menuKey);
            if (menuKey !== 'BASIC') {
              setStep(Math.min(6, Math.max(1, studentGrade)));
            } else {
              let startStep = 6; // default to last step if all done
              for (let i = 1; i <= 6; i++) {
                if ((basicScores[i] || 0) < SCORE_LIMITS[i]) {
                  startStep = i;
                  break;
                }
              }
              setStep(startStep);
            }
            clearPracticeState();
            setView('PRACTICE');
          } else {
            alert('준비 중입니다!');
          }
        }}
        className={`group bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col items-center justify-center gap-3 relative ${isLocked ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all'}`}
      >
        {isLocked && (
          <div className="absolute top-3 right-3">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <div className="transform scale-[0.6] sm:scale-75 h-16 sm:h-20 flex items-center justify-center">
          <Icon />
        </div>
        <span className="text-base sm:text-lg font-black text-gray-800">{title}</span>
        <div className="flex gap-1 mt-1">
           {[1, 2, 3].map(i => (
             <Star key={i} className={`w-5 h-5 ${i <= starsCount ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
           ))}
        </div>
      </button>
    );
  };

  const renderGameButton = (title: string, Icon: any, menuKey: MenuType, isBattle = false) => {
    const bgClass = isBattle ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-slate-800 hover:bg-slate-700';
    const textClass = isBattle ? 'text-red-700' : 'text-white';
    
    return (
      <button 
        onClick={() => { alert('준비 중입니다!'); }}
        className={`group rounded-2xl shadow-sm border hover:-translate-y-1 hover:shadow-md transition-all p-4 sm:p-6 flex flex-col items-center justify-center gap-3 ${bgClass}`}
      >
        <div className="transform scale-[0.6] sm:scale-75 h-16 sm:h-20 flex items-center justify-center">
          <Icon />
        </div>
        <span className={`text-base sm:text-lg font-black ${textClass}`}>{title}</span>
      </button>
    );
  };

  const handleWordSubmit = (e?: React.FormEvent, forcedValue?: string) => {
    if (e) e.preventDefault();
    if (!items[currentIndex]) return;
    const actualWord = items[currentIndex].char;
    // For BASIC practice, we still use the direct char comparison in onChange, this is for WORD practice forms.
    const valToUse = forcedValue !== undefined ? forcedValue : wordInput.trim();
    const isCorrect = valToUse === actualWord;
    
    setItems(prev => {
      const newItems = [...prev];
      newItems[currentIndex] = { 
        ...newItems[currentIndex], 
        status: isCorrect ? 'correct' : 'incorrect',
        errorCount: (newItems[currentIndex].errorCount || 0) + (!isCorrect ? 1 : 0)
      };
      return newItems;
    });

    if (menu === 'WORD') {
      if (!isCorrect) {
        setMistakes(m => m + 1);
      }
    } else {
      if (!isCorrect) {
        let errs = 0;
        const target = actualWord;
        const input = valToUse;
        const maxLen = Math.max(target.length, input.length);
        for (let i = 0; i < maxLen; i++) {
          if (target[i] !== input[i]) errs++;
        }
        setMistakes(m => m + errs);
      }
      setCorrectChars(c => c + actualWord.length);
    }
    
    let newWordActiveTime = activeTypingTime;
    let currentWordTime = 0;
    if (wordStartTime) {
      currentWordTime = Date.now() - wordStartTime;
      newWordActiveTime += currentWordTime;
      setActiveTypingTime(newWordActiveTime);
      setWordStartTime(null);
    }
    
    const currentWordStrokes = getCorrectStrokes(actualWord, wordInput.trim());
    const newStrokes = typedStrokes + currentWordStrokes;
    setTypedStrokes(newStrokes);

    const currentWordMinutes = currentWordTime / 60000;
    const endOfWordCpm = menu === 'PARAGRAPH'
      ? (newWordActiveTime > 0 ? Math.floor(newStrokes / (newWordActiveTime / 60000)) : 0)
      : (currentWordMinutes > 0 ? Math.floor(currentWordStrokes / currentWordMinutes) : 0);
    // Cap at reasonable max to avoid the 10000 issue when elapsed time is extremely small
    if (endOfWordCpm > sessionMaxCpm && endOfWordCpm < 2000) {
      setSessionMaxCpm(endOfWordCpm);
    }
    
    // Update the displayed CPM
    setLastMeasuredCpm(endOfWordCpm < 2000 ? endOfWordCpm : lastMeasuredCpm);

    setWordInput('');
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    if (nextIndex >= maxTarget) setCompleted(true);
  };

  // --- RENDERING ---

  if (view === 'HOME') {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b border-gray-200 shrink-0 relative z-20">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-500 font-bold hover:text-purple-600 transition-all shrink-0">
            <ChevronLeft className="w-6 h-6" /> {t('go_back')}
          </button>
          <h1 className="text-xl font-black text-gray-800 absolute left-1/2 -translate-x-1/2">
            타자 연습
          </h1>
          <button 
            onClick={() => setIsRankingOpen(true)}
            className="group flex flex-1 md:flex-none items-center justify-center bg-yellow-400 hover:bg-yellow-500 px-3 py-2 sm:px-4 rounded-xl border-none shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-yellow-900 font-bold whitespace-nowrap shrink-0"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-300 to-amber-500 text-white flex items-center justify-center shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.1)] mr-1.5 transition-transform group-hover:scale-110 group-hover:rotate-6">
               <Trophy className="w-3.5 h-3.5 drop-shadow-sm" />
            </div>
            <span className="hidden sm:inline">타자 랭킹</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto flex flex-col justify-center items-center p-6">
          <div className="flex flex-col gap-8 w-full max-w-5xl">
            {/* ROW 1: Practice Modules */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {renderPracticeButton('기초 연습', Keyboard3DIcon, 'BASIC')}
              {renderPracticeButton('단어 연습', Book3DIcon, 'WORD', 'BASIC')}
              {renderPracticeButton('문장 연습', Quote3DIcon, 'SENTENCE', 'WORD')}
              {renderPracticeButton('장문 연습', Document3DIcon, 'PARAGRAPH', 'SENTENCE')}
            </div>
            
            {/* ROW 2: Game Modules */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto w-full">
              {renderGameButton('타자 게임', Gamepad3DIcon, 'GAME', false)}
              {renderGameButton('타자 배틀', Swords3DIcon, 'BATTLE', true)}
            </div>
          </div>
        </main>

        {student && (
           <RankingModal 
             isOpen={isRankingOpen} 
             onClose={() => setIsRankingOpen(false)} 
             currentStudent={student} 
             rankingType="typing" 
           />
        )}
      </div>
    );
  }

  // --- PRACTICE VIEW ---
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <header className="bg-white px-6 py-4 flex items-center shadow-sm border-b border-gray-200 shrink-0 relative z-20">
        <button onClick={() => { setView('HOME'); clearPracticeState(); }} className="flex items-center gap-2 text-gray-500 font-bold hover:text-purple-600 transition-all shrink-0">
          <ChevronLeft className="w-6 h-6" /> {t('go_back')}
        </button>
        <div className="flex-1 flex justify-center">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-full hide-scrollbar">
            {(['WORD', 'SENTENCE', 'PARAGRAPH'].includes(menu) ? [Math.min(6, Math.max(1, studentGrade))] : [1, 2, 3, 4, 5, 6]).map(lvl => {
              const basicNames = ['기본자리', '윗자리', '아랫자리', '가운데자리', '숫자자리', '전체'];
              const isBasic = menu === 'BASIC';
              const isCompleted = isBasic && (basicScores[lvl] || 0) >= SCORE_LIMITS[lvl];
              const isLocked = isBasic && lvl > 1 && (basicScores[lvl - 1] || 0) < SCORE_LIMITS[lvl - 1];

              return (
                <button
                  key={lvl}
                  onClick={() => {
                    if (['WORD', 'SENTENCE', 'PARAGRAPH'].includes(menu)) return;
                    if (isLocked) {
                      alert(`이전 단계 최고 점수(${SCORE_LIMITS[lvl - 1]}점)를 달성해야 열립니다.`);
                      return;
                    }
                    handleLevelChange(lvl);
                  }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold transition-all text-xs sm:text-sm flex flex-col items-center leading-tight relative ${
                    step === lvl 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:bg-gray-200'
                  } ${['WORD', 'SENTENCE', 'PARAGRAPH'].includes(menu) ? 'cursor-default' : ''} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isCompleted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 border-2 border-red-500 bg-white/90 shadow-sm rounded-full flex items-center justify-center -rotate-12 pointer-events-none z-50 opacity-50">
                      <span className="text-red-500 font-extrabold text-[10px]">완료</span>
                    </div>
                  )}
                  <div className="flex gap-1 items-center relative z-10">
                    <span>{menu === 'BASIC' ? `${lvl}단계` : `${lvl}학년`}</span>
                    {isLocked && <Lock className="w-3 h-3" />}
                  </div>
                  {menu === 'BASIC' && <span className="font-medium text-[10px] sm:text-xs relative z-10">{basicNames[lvl-1]}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar overflow-x-hidden flex flex-col items-center p-4 sm:p-6 relative bg-gray-50">
        <div className="flex-1 flex flex-col items-center w-full max-w-4xl relative min-h-max">
          {menu === 'PARAGRAPH' && !selectedParagraph ? (
            <div className="w-full h-full flex flex-col items-center pt-4 sm:pt-8 overflow-hidden">
               <h2 className="text-2xl font-black mb-6 text-center text-gray-800">
                  제재글 선택
               </h2>
               <div className="flex-1 w-full max-w-3xl overflow-y-auto hide-scrollbar pb-8 px-2 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
                 {((paragraphsData as Record<string, any[]>)[step.toString()] || []).map((p: any, idx: number) => (
                   <button
                     key={idx}
                     onClick={() => {
                        setSelectedParagraph(p);
                        const parts = p.content.split('\n').filter((s: string) => s.trim().length > 0);
                        const newItems = parts.map((part: string, i: number) => ({ id: i, char: part.trim(), status: 'pending' as const }));
                        setItems(newItems);
                        setCurrentIndex(0);
                        setMistakes(0);
                        setCompleted(false);
                        setStartTime(null);
                        setWordStartTime(null);
                        setActiveTypingTime(0);
                        setCorrectChars(0);
                        setLastMeasuredCpm(0);
                        setTypedStrokes(0);
                        setSessionMaxCpm(0);
                     }}
                     className="bg-white p-5 rounded-2xl shadow-sm border-2 border-gray-100 hover:border-blue-400 hover:shadow-md transition-all text-left flex flex-col gap-2 group h-full"
                   >
                     <div className="text-lg font-black text-gray-800 group-hover:text-blue-600 transition-colors">{p.title}</div>
                     <div className="text-sm text-gray-500 line-clamp-2 leading-relaxed whitespace-pre-wrap">{p.content}</div>
                   </button>
                 ))}
               </div>
            </div>
          ) : (
             <>
          {/* STATS AND PROGRESS */}
          <div className="w-full flex items-center justify-between bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-sm border border-gray-100 mb-4 flex-wrap gap-4">
             <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                {menu !== 'BASIC' && (
                  <div className="flex flex-col flex-1 sm:flex-none sm:min-w-[120px]">
                     <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm font-bold mb-1">
                       <span className="animate-pulse">⚡</span> 타수
                     </div>
                     <div className="text-lg sm:text-xl font-black text-blue-600 flex items-baseline gap-1">
                       {currentCpm} <span className="text-xs sm:text-sm text-gray-400 font-bold">타/분</span>
                     </div>
                     <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (currentCpm / 500) * 100)}%` }}></div>
                     </div>
                  </div>
                )}
                {['WORD', 'SENTENCE', 'PARAGRAPH'].includes(menu) && (
                   <>
                     <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                     <div className="flex flex-col flex-1 sm:flex-none min-w-[50px]">
                        <div className="text-gray-500 text-xs sm:text-sm font-bold mb-1">최고 타수</div>
                        <div className="text-lg sm:text-xl font-black text-purple-600 flex items-baseline gap-1">
                          {sessionMaxCpm}<span className="text-xs sm:text-sm text-gray-400 font-bold">타/분</span>
                        </div>
                     </div>
                   </>
                )}
                <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                <div className="flex flex-col flex-1 sm:flex-none sm:min-w-[120px]">
                   <div className="text-gray-500 text-xs sm:text-sm font-bold mb-1">정확도</div>
                   <div className="text-lg sm:text-xl font-black text-gray-800 flex items-baseline gap-1">
                     {currentAccuracy}<span className="text-xs sm:text-sm text-gray-400 font-bold">%</span>
                   </div>
                   <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                     <div className={`h-full rounded-full transition-all ${currentAccuracy >= 80 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${currentAccuracy}%` }}></div>
                   </div>
                </div>
                <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
                <div className="flex flex-col flex-1 sm:flex-none min-w-[50px]">
                   <div className="text-gray-500 text-xs sm:text-sm font-bold mb-1">오타</div>
                   <div className="text-lg sm:text-xl font-black text-red-500 flex items-baseline gap-1">
                     {mistakes}<span className="text-xs sm:text-sm text-gray-400 font-bold">개</span>
                   </div>
                </div>
             </div>
             
             {menu !== 'PARAGRAPH' && (
               <div className="text-right">
                  <div className="text-gray-500 text-xs sm:text-sm font-bold mb-1">진행</div>
                  <div className="text-lg sm:text-xl font-black text-gray-800">{currentIndex} <span className="text-xs sm:text-sm text-gray-400">/ {maxTarget}</span></div>
               </div>
             )}
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-start pt-2 sm:pt-4 relative min-h-[160px]">
             
             {menu === 'PARAGRAPH' ? (
                <div className="w-full max-w-4xl flex flex-col justify-start gap-6 sm:gap-8 mt-2 px-2 sm:px-6">
                  {items.slice(Math.floor(currentIndex / 4) * 4, Math.floor(currentIndex / 4) * 4 + 4).map((item) => {
                     const isCurrent = item.id === currentIndex;
                     const isPast = item.id < currentIndex;
                     const sentenceFontSize = 'text-lg sm:text-xl';
                     const textClass = `font-badasseugi text-left break-keep whitespace-pre-wrap w-full ${sentenceFontSize} leading-snug transition-all ${isPast ? 'text-black' : 'text-gray-800'}`;

                     return (
                        <div key={item.id} className="w-full flex flex-col gap-1 relative">
                           <div className={textClass}>
                              {isPast ? item.char : (
                                item.char.split('').map((char, i) => {
                                  const inputChar = isCurrent ? wordInput[i] : undefined;
                                  const isCorrect = inputChar !== undefined && char.normalize('NFC') === inputChar.normalize('NFC');
                                  const isWrong = inputChar !== undefined && !isCorrect && !isJamoPrefix(inputChar, char);
                                  
                                  return (
                                    <span 
                                      key={i} 
                                      className={isWrong ? 'text-red-500 opacity-100' : (isCorrect ? 'text-black opacity-100' : (isCurrent && inputChar !== undefined ? 'opacity-80' : 'opacity-40'))}
                                    >
                                      {char}
                                    </span>
                                  );
                                })
                              )}
                           </div>
                           {isCurrent ? (
                             <input
                               type="text"
                               autoFocus
                               value={wordInput}
                               onChange={e => {
                                 setStartTime(prev => prev || Date.now());
                                 if (!wordStartTime) setWordStartTime(Date.now());
                                 let val = e.target.value;
                                 if (val.startsWith(' ')) val = val.trimStart();
                                 setWordInput(val.normalize('NFC'));
                               }}
                               onKeyDown={e => {
                                 if (e.key === 'Enter') {
                                   e.preventDefault();
                                   handleWordSubmit(e as any);
                                 } else if (e.code === 'Space') {
                                   const targetLen = item.char.length || 0;
                                   if (wordInput.trim().length >= targetLen) {
                                     e.preventDefault();
                                     setTimeout(() => handleWordSubmit(e as any, wordInput.trim()), 10);
                                     e.currentTarget.value = '';
                                     setWordInput('');
                                   }
                                 }
                               }}
                               className={`w-full outline-none text-left bg-transparent border-0 border-b-[3px] border-gray-400 focus:border-black font-badasseugi text-black pb-1 ${sentenceFontSize}`}
                               placeholder=""
                               autoComplete="off"
                               spellCheck={false}
                             />
                           ) : (
                             <div className={`w-full border-b-[3px] ${isPast ? 'border-transparent' : 'border-gray-200'} h-[30px] sm:h-[36px]`}></div>
                           )}
                        </div>
                     );
                  })}
                </div>
             ) : (
               <>
                 <div className={`relative w-full ${menu === 'WORD' ? 'h-[160px] sm:h-[200px]' : (menu === 'SENTENCE' ? 'h-[160px] sm:h-[180px]' : 'h-[120px] sm:h-[160px]')} flex flex-col items-center justify-start`}>
                    <div className={`relative w-full flex items-center justify-center ${menu === 'SENTENCE' ? 'h-[100px] sm:h-[120px]' : 'h-[100px] sm:h-[140px]'}`}>
                       <AnimatePresence>
                         {items.map((item) => {
                           const offset = item.id - currentIndex;
                           if (menu === 'SENTENCE' && offset !== 0) return null;
                           const maxOffset = menu === 'WORD' ? 2 : 3;
                           if (offset < -1 || offset > maxOffset) return null;

                           const isCurrent = offset === 0;
                           const isPast = offset < 0;

                           let xOffset = (menu === 'BASIC' || menu === 'WORD') ? offset * (menu === 'WORD' ? 180 : 90) : 0;
                           let yOffset = 0;
                           if (menu === 'SENTENCE') {
                                yOffset = -60;
                           }
                           let scale = isCurrent ? 1.2 : 0.9;
                           if (menu === 'SENTENCE') scale = isCurrent ? 1 : 0.9;
                           
                           let opacity = isCurrent ? 1 : (offset === -1 ? 0.3 : (offset >= 3 ? 0 : 0.7 - offset * 0.15));
                           
                           let itemClass = menu === 'WORD' ? 'px-4 min-w-[120px] h-20 sm:min-w-[160px] sm:h-28 ' : 'w-20 h-20 sm:w-28 sm:h-28 ';
                           let textClass = 'font-black whitespace-nowrap overflow-hidden text-ellipsis ';
                           
                           const isSentence = menu === 'SENTENCE';
                           const len = item.char.length;
                           const sentenceFontSize = 'text-xl sm:text-2xl';

                           if (isSentence) {
                               itemClass = 'w-[90%] max-w-[800px] py-4 px-6 ';
                               textClass = `font-badasseugi text-left break-keep whitespace-pre-wrap w-full ${sentenceFontSize} leading-snug transition-all `;
                               if (isCurrent) {
                                  itemClass += ' bg-transparent z-10';
                                  textClass += ' text-gray-800';
                               } else if (isPast) {
                                  itemClass += ' bg-transparent z-0 opacity-50';
                                  textClass += ' text-gray-400';
                               } else {
                                  itemClass += ' bg-transparent z-0 opacity-50';
                                  textClass += ' text-gray-400';
                               }
                           } else {
                               if (isCurrent) {
                                 if (item.status === 'incorrect') {
                                    itemClass += 'bg-red-50 border-4 border-red-500 rounded-3xl shadow-[0_10px_20px_-5px_rgba(239,68,68,0.3)] z-10';
                                    textClass += menu === 'WORD' ? ' text-2xl sm:text-4xl text-red-500' : ' text-5xl sm:text-6xl text-red-500';
                                 } else {
                                    itemClass += 'bg-white border-4 border-blue-400 rounded-3xl shadow-[0_10px_20px_-5px_rgba(59,130,246,0.3)] z-10';
                                    textClass += menu === 'WORD' ? ' text-2xl sm:text-4xl text-blue-600' : ' text-5xl sm:text-6xl text-blue-600';
                                 }
                               } else if (isPast) {
                                 itemClass += `border-2 rounded-2xl shadow-sm ${item.status === 'incorrect' ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'}`;
                                 textClass += menu === 'WORD' ? ` text-xl sm:text-2xl ${item.status === 'incorrect' ? 'text-red-500' : 'text-green-500'}` : ` text-3xl sm:text-4xl ${item.status === 'incorrect' ? 'text-red-500' : 'text-green-500'}`;
                                 if (menu === 'BASIC') itemClass = itemClass.replace('w-20 sm:w-28', 'w-16 sm:w-20').replace('h-20 sm:h-28', 'h-16 sm:h-20');
                               } else {
                                 itemClass += 'bg-white border-2 border-gray-200 rounded-2xl shadow-sm';
                                 textClass += menu === 'WORD' ? ' text-xl sm:text-2xl text-gray-400' : ' text-3xl sm:text-4xl text-gray-400';
                                 if (menu === 'BASIC') itemClass = itemClass.replace('w-20 sm:w-28', 'w-16 sm:w-20').replace('h-20 sm:h-28', 'h-16 sm:h-20');
                               }
                           }

                           return (
                             <motion.div
                               key={item.id}
                               initial={
                                 menu === 'SENTENCE'
                                  ? { opacity: 0, y: yOffset + 50, scale: 0.5 }
                                  : { opacity: 0, x: xOffset + 50, scale: 0.5, rotate: menu === 'WORD' ? 5 : 10 }
                               }
                               animate={{ 
                                 x: isCurrent && item.status === 'incorrect' && !isSentence ? 
                                    (item.errorCount && item.errorCount % 2 === 0 ? [xOffset, xOffset - 10, xOffset + 10, xOffset - 10, xOffset + 10, xOffset] : [xOffset, xOffset + 10, xOffset - 10, xOffset + 10, xOffset - 10, xOffset])
                                    : xOffset, 
                                 y: yOffset,
                                 opacity, 
                                 scale, 
                                 rotate: isCurrent || menu === 'SENTENCE' ? 0 : offset * (menu === 'WORD' ? 1 : 2) 
                               }}
                               exit={
                                 menu === 'SENTENCE'
                                  ? { opacity: 0, y: -200, scale: 0.5 }
                                  : { opacity: 0, x: -150, scale: 0.5, rotate: -20 }
                               }
                               transition={{ 
                                 type: "spring", 
                                 stiffness: 300, 
                                 damping: 25,
                                 x: { duration: 0.4 }
                               }}
                               className={`absolute flex items-center justify-center shrink-0 origin-center ${itemClass}`}
                               style={{ zIndex: 10 - Math.abs(offset) }}
                             >
                               {isSentence && isCurrent ? (
                                 <span className={textClass}>
                                   {item.char.split('').map((char, i) => {
                                     const inputChar = wordInput[i];
                                     const isCorrect = inputChar !== undefined && char.normalize('NFC') === inputChar.normalize('NFC');
                                     const isWrong = inputChar !== undefined && !isCorrect && !isJamoPrefix(inputChar, char);
                                     return (
                                       <span 
                                         key={i} 
                                         className={isWrong ? 'text-red-500 opacity-100' : (isCorrect ? 'text-black opacity-100' : (inputChar !== undefined ? 'opacity-80' : 'opacity-40'))}
                                       >
                                         {char}
                                       </span>
                                     );
                                   })}
                                 </span>
                               ) : (
                                 <span className={textClass}>
                                   {item.char}
                                 </span>
                               )}
                             </motion.div>
                           );
                         })}
                       </AnimatePresence>
                    </div>
                    
                    {(menu === 'WORD' || menu === 'SENTENCE') && items[currentIndex] && (
                      <div className={`flex justify-center transition-all ${menu === 'SENTENCE' ? 'absolute top-[20%] sm:top-[10%] left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-30' : 'w-[80%] max-w-[600px] mt-2 sm:mt-4'}`}>
                        <input
                          type="text"
                          autoFocus
                          value={wordInput}
                          onChange={e => {
                            setStartTime(prev => prev || Date.now());
                            if (!wordStartTime) setWordStartTime(Date.now());
                            let val = e.target.value;
                            if (menu === 'WORD' && val.endsWith(' ') && val.trim().length > 0) {
                              const forcedVal = val.trim().normalize('NFC');
                              setWordInput(forcedVal);
                              e.target.value = '';
                              handleWordSubmit(undefined, forcedVal);
                              return;
                            }
                            if (val.startsWith(' ')) val = val.trimStart();
                            setWordInput(val.normalize('NFC'));
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleWordSubmit(e as any);
                            } else if (e.code === 'Space') {
                              if (menu === 'WORD') {
                                // Do not prevent default so that Space is caught by onChange
                              } else if (menu === 'SENTENCE') {
                                const targetLen = items[currentIndex]?.char.length || 0;
                                if (wordInput.trim().length >= targetLen) {
                                  e.preventDefault();
                                  setTimeout(() => handleWordSubmit(e as any, wordInput.trim()), 10);
                                  e.currentTarget.value = '';
                                  setWordInput('');
                                }
                              }
                            }
                          }}
                          className={`w-full outline-none transition-all ${menu === 'SENTENCE' ? 'text-left bg-transparent border-0 border-b-[3px] border-gray-400 focus:border-black rounded-none font-badasseugi text-black px-6 py-2 text-xl sm:text-2xl shadow-none' : 'text-center text-3xl sm:text-4xl font-bold text-blue-600 bg-transparent border-0 border-b-4 border-gray-300 focus:border-blue-500 px-2'}`}
                          placeholder=""
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    )}
                 </div>
               </>
             )}
            </div>
          </>
         )}
        </div>

        {/* VIRTUAL KEYBOARD */}
        {(() => {
          let targetJamo = items[currentIndex]?.char;
          if (menu === 'WORD' || menu === 'SENTENCE') {
            const targetStr = items[currentIndex]?.char || '';
            const inputStr = wordInput || '';
            const targetSeq = getTypingSequence(targetStr.normalize('NFC'));
            const inputSeq = getTypingSequence(inputStr.normalize('NFC'));
            if (inputSeq.length < targetSeq.length) {
              targetJamo = targetSeq[inputSeq.length];
            } else {
              targetJamo = 'EnterSpace';
            }
          }
          const showKeyboard = menu === 'BASIC' || menu === 'WORD' || menu === 'SENTENCE';
          if (!showKeyboard) return null;
          return (
          <div className={`w-full max-w-3xl bg-gray-100/50 p-2 sm:p-4 rounded-[20px] sm:rounded-[28px] border-2 border-gray-200 shadow-md mt-auto shrink-0 select-none mx-auto ${menu === 'SENTENCE' ? 'mb-8 sm:mb-16' : 'mb-2 sm:mb-4'}`}>
             <div className="flex flex-col gap-1 sm:gap-2 p-1 sm:p-2">
                <div className="flex gap-1 justify-center">
                   {ROW1.map((k: any, i) => <VirtualKey key={i} label={k.label} shiftLabel={k.shift} widthClass={k.w} isTarget={getUnshiftedKey(targetJamo) === k.label || ((targetJamo === 'Enter' || targetJamo === 'EnterSpace') && k.label === 'Enter')} isHomeRow={false} />)}
                </div>
                <div className="flex gap-1 justify-center">
                   {ROW2.map((k: any, i) => <VirtualKey key={i} label={k.label} shiftLabel={k.shift} widthClass={k.w} isTarget={getUnshiftedKey(targetJamo) === k.label} isHomeRow={HOME_ROW_KEYS.includes(k.label) && getHomeKeyToHide(targetJamo) !== k.label} />)}
                </div>
                <div className="flex gap-1 justify-center">
                   {ROW3.map((k: any, i) => <VirtualKey key={i} label={k.label} shiftLabel={k.shift} widthClass={k.w} isTarget={getUnshiftedKey(targetJamo) === k.label || ((targetJamo === 'Enter' || targetJamo === 'EnterSpace') && k.label === 'Enter')} isHomeRow={HOME_ROW_KEYS.includes(k.label) && getHomeKeyToHide(targetJamo) !== k.label} />)}
                </div>
                <div className="flex gap-1 justify-center">
                   {ROW4.map((k: any, i) => {
                     const isTarget = (() => {
                       const char = targetJamo;
                       if (k.id === 'ShiftL') return needsLeftShift(char);
                       if (k.id === 'ShiftR') return needsRightShift(char);
                       return getUnshiftedKey(char) === k.label;
                     })();
                     return <VirtualKey key={i} label={k.label} shiftLabel={k.shift} widthClass={k.w} isTarget={isTarget} isHomeRow={HOME_ROW_KEYS.includes(k.label) && getHomeKeyToHide(targetJamo) !== k.label} />;
                   })}
                </div>
                <div className="flex gap-1 justify-center">
                   {ROW5.map((k: any, i) => <VirtualKey key={i} label={k.label} shiftLabel={k.shift} widthClass={k.w} isTarget={getUnshiftedKey(targetJamo) === k.label || ((targetJamo === ' ' || targetJamo === 'EnterSpace') && k.label === 'Space')} isHomeRow={false} />)}
                </div>
             </div>
          </div>
          );
        })()}

        {/* COMPLETION MODAL */}
        <AnimatePresence>
          {completed && (
            <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
              >
                {(() => {
                  const isSuccess = menu === 'BASIC' ? currentScore >= SCORE_LIMITS[step] : currentAccuracy >= 80;
                  return (
                    <>
                      {isSuccess ? (
                        <>
                          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden object-cover opacity-30 select-none">
                             <div className="absolute top-4 left-4 w-12 h-12 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl"></div>
                             <div className="absolute top-12 right-12 w-16 h-16 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl"></div>
                             <div className="absolute bottom-12 left-20 w-20 h-20 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl"></div>
                          </div>

                          <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
                            <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-yellow-500" />
                          </div>
                          <h2 className="relative z-10 text-3xl sm:text-4xl font-black text-gray-800 mb-6">오늘의 타자연습 성공!</h2>
                        </>
                      ) : (
                        <>
                          <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white">
                            <span className="text-5xl">🥺</span>
                          </div>
                          <h2 className="relative z-10 text-3xl sm:text-4xl font-black text-gray-800 mb-2">앗, 아쉬워요!</h2>
                          <p className="relative z-10 text-gray-500 mb-6 text-base sm:text-lg font-bold">
                            {menu === 'BASIC' ? `최고 점수 ${SCORE_LIMITS[step]}점에 도달하지 못했어요.` : '정확도가 조금 부족해요. (목표: 80%)'}<br/>
                            조금만 더 집중해서 다시 해볼까요?
                          </p>
                        </>
                      )}
                      
                      <div className="relative z-10 flex border-y border-gray-100 py-4 mb-6">
                         <div className="flex-1 flex flex-col items-center border-r border-gray-100">
                            <span className="text-gray-400 font-bold text-sm">정확도</span>
                            <span className={`text-2xl font-black ${currentAccuracy >= 80 ? 'text-green-500' : 'text-red-500'}`}>{currentAccuracy}%</span>
                         </div>
                         {menu !== 'BASIC' && (
                           <div className="flex-1 flex flex-col items-center border-r border-gray-100">
                              <span className="text-gray-400 font-bold text-sm">속도</span>
                              <span className="text-2xl font-black text-blue-500">{currentCpm}</span>
                           </div>
                         )}
                         <div className="flex-1 flex flex-col items-center">
                            <span className="text-gray-400 font-bold text-sm">점수</span>
                            <span className={`text-2xl font-black ${menu === 'BASIC' && currentScore >= SCORE_LIMITS[step] ? 'text-yellow-500' : 'text-gray-700'}`}>{currentScore}</span>
                         </div>
                      </div>

                      <div className="relative z-10 flex flex-col gap-3">
                        {isSuccess ? (
                          <button
                            onClick={() => {
                              const { cpm, accuracy } = calculateResults();
                              onComplete(cpm, accuracy, currentScore, menu, step);
                              setView('HOME');
                              clearPracticeState();
                            }}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg sm:text-xl hover:bg-blue-700 transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> 확인
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLevelChange(step)}
                            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg sm:text-xl hover:bg-orange-600 transition-all shadow-[0_10px_20px_-5px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2"
                          >
                            다시 도전하기
                          </button>
                        )}
                        {!isSuccess && (
                          <button
                            onClick={() => {
                              setView('HOME'); 
                              clearPracticeState();
                            }}
                            className="w-full bg-gray-100 text-gray-600 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-200 transition-all"
                          >
                            {t('go_back')}
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

