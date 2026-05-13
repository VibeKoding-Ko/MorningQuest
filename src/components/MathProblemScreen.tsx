import React, { useState, useEffect } from 'react';
import { MathProblemList } from './MathProblemRenderer';
import { getTodayDateString } from '../lib/dateUtils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, updateDoc, getDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { Student, DailyTask, Submission } from '../types';
import { generateProblems, getMathPrompt } from '../lib/mathGenerator';
import { CURRICULUM } from '../constants';
import { calculateLevel } from '../lib/levelUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowRight, ChevronLeft, Star, Calculator, Home, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage, useDynamicTranslation } from '../contexts/LanguageContext';
import XpEffect from './XpEffect';

interface MathProblemScreenProps {
  task: DailyTask;
  student: Student;
  onBack: () => void;
  mode?: 'new' | 'view' | 'retry';
  previousSubmission?: Submission | null;
}

export const renderMathText = (text: string) => {
  if (!text) return null;
  
  const parts = text.split(/(LONGDIV\(\d+,\d+\)|FRAC\([?\d]+,[?\d]+\)|MIXED\([?\d]+,[?\d]+,[?\d]+\)|Q_R\([\d.]+,[\d.]+\)|GCD_DIV\(\d+,\d+,\d+,\d+\)|LCM_DIV\(\d+,\d+,\d+,\d+\))/g);
  
  if (parts.length === 1) return text;

  return (
    <div className="inline-flex items-center justify-center flex-wrap gap-1 align-middle">
      {parts.map((part, idx) => {
        if (!part) return null;
        if (part.startsWith('GCD_DIV(') || part.startsWith('LCM_DIV(')) {
          const isLCM = part.startsWith('LCM_DIV');
          const match = part.match(/(?:GCD_DIV|LCM_DIV)\((\d+),(\d+),(\d+),(\d+)\)/);
          if (match) {
            const [_, d, n1, n2, ans] = match;
            return (
              <div key={idx} className="inline-flex items-center gap-4 text-xl font-bold mx-2">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">{d}</span>
                    <span className="text-gray-800">)</span>
                    <div className="flex gap-4 px-2">
                      <span>{n1}</span>
                      <span>{n2}</span>
                    </div>
                  </div>
                  <div className="w-full border-t-2 border-black"></div>
                  <div className="flex gap-4 px-2 mr-2">
                    <span className="text-blue-600">{parseInt(n1)/parseInt(d)}</span>
                    <span className="text-blue-600">{parseInt(n2)/parseInt(d)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">➡</span>
                  <div className="flex flex-col items-center">
                    <span className="text-gray-800">{isLCM ? '최소공배수' : '최대공약수'}</span>
                    <span className="text-blue-600">{ans}</span>
                  </div>
                </div>
              </div>
            );
          }
        }
        if (part.startsWith('LONGDIV(')) {
          const match = part.match(/LONGDIV\((\d+),(\d+)\)/);
          if (match) {
            const [_, dividend, divisor] = match;
            return (
              <div key={idx} className="inline-flex items-end text-2xl font-bold mx-2 pt-1">
                <span className="mr-0.5 mt-2">{divisor}</span>
                <div className="flex flex-col relative">
                  <div className="w-full border-t-2 border-black absolute top-0 left-1.5 right-0 translate-y-[-1px]"></div>
                  <div className="flex items-center">
                    <span className="font-light text-3xl leading-none -mt-1">)</span>
                    <span className="ml-1 pl-0.5">{dividend}</span>
                  </div>
                </div>
              </div>
            );
          }
        }
        if (part.startsWith('FRAC(')) {
          const match = part.match(/FRAC\(([?\d]+),([?\d]+)\)/);
          if (match) {
            const [_, num, den] = match;
            return (
              <div key={idx} className="inline-flex flex-col items-center align-middle mx-1 text-xl">
                <span className="border-b-2 border-black px-1 leading-tight">{num}</span>
                <span className="px-1 leading-tight">{den}</span>
              </div>
            );
          }
        }
        if (part.startsWith('MIXED(')) {
          const match = part.match(/MIXED\(([?\d]+),([?\d]+),([?\d]+)\)/);
          if (match) {
            const [_, w, num, den] = match;
            return (
              <div key={idx} className="inline-flex items-center mx-0.5 text-xl">
                <span className="mr-0.5 font-bold">{w}</span>
                <div className="inline-flex flex-col items-center align-middle">
                  <span className="border-b-2 border-black px-1 leading-tight">{num}</span>
                  <span className="px-1 leading-tight">{den}</span>
                </div>
              </div>
            );
          }
        }
        if (part.startsWith('Q_R(')) {
          const match = part.match(/Q_R\(([\d.]+),([\d.]+)\)/);
          if (match) {
            const [_, q, r] = match;
            return <span key={idx} className="mx-1">{q} ... {r}</span>;
          }
        }
        return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
      })}
    </div>
  );
};

export default function MathProblemScreen({ task, student, onBack, mode = 'new', previousSubmission }: MathProblemScreenProps) {
  const { t, language } = useLanguage();
  
  const rawPromptText = getMathPrompt((task.studentMathConfigs?.[student.studentId] || task.mathConfig).area);
  const translatedPromptText = useDynamicTranslation(rawPromptText);
  
  const initialProblems = (mode === 'view' || mode === 'retry') && previousSubmission
    ? previousSubmission.answers.map((a) => ({ question: a.question, correctAnswer: a.correctAnswer }))
    : [];
  const initialAnswers = (mode === 'view' || mode === 'retry') && previousSubmission
    ? previousSubmission.answers.map((a) => a.userAnswer)
    : new Array(20).fill('');

  const [problems, setProblems] = useState<{ question: string; correctAnswer: string }[]>(initialProblems);
  const [userAnswers, setUserAnswers] = useState<string[]>(initialAnswers);
  const [isSubmitted, setIsSubmitted] = useState(mode === 'view');
  const [score, setScore] = useState(mode === 'view' ? previousSubmission?.score || 0 : 0);
  const [results, setResults] = useState<{ question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]>((mode === 'view' || mode === 'retry') ? previousSubmission?.answers || [] : []);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [xpGainsCount, setXpGainsCount] = useState(previousSubmission?.xpGainsCount ?? 0);
  const [hasProgressed, setHasProgressed] = useState(false);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [timerActive, setTimerActive] = useState(mode === 'new' || mode === 'retry');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
    }
  }, [timerActive, timeLeft]);

  useEffect(() => {
    // Check if first attempt
    const checkFirstAttempt = async () => {
      const today = getTodayDateString();
      const path = `submissions/${student.studentId}_${today}_math`;
      try {
        const subRef = doc(db, 'submissions', `${student.studentId}_${today}_math`);
        const subSnap = await getDoc(subRef);
        if (subSnap.exists()) {
          setIsFirstAttempt(false);
          setXpGainsCount(subSnap.data().xpGainsCount ?? 0);
        } else {
          setIsFirstAttempt(true);
          setXpGainsCount(0);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };
    checkFirstAttempt();

    const formatToUserInput = (expected: string) => {
      return expected.split(/,(?![^()]*\))/g).map(part => {
        if (part.startsWith('Q_R(')) {
          const m = part.match(/Q_R\(([\d.]+),([\d.]+)\)/);
          if (m) return `${m[1]}...${m[2]}`;
        }
        if (part.startsWith('FRAC(')) {
          const m = part.match(/FRAC\((\d+),(\d+)\)/);
          if (m) return `${m[1]}/${m[2]}`;
        }
        if (part.startsWith('MIXED(')) {
          const m = part.match(/MIXED\((\d+),(\d+),(\d+)\)/);
          if (m) return `${m[1]}_${m[2]}/${m[3]}`;
        }
        return part;
      }).join(',');
    };

    // Only generate problems if in new mode and problems are empty
    if (mode === 'new' && problems.length === 0) {
      const today = getTodayDateString();
      const draftId = `math_draft_${student.studentId}_${today}`;
      
      const savedDraft = localStorage.getItem(draftId);
      if (savedDraft) {
        try {
          const data = JSON.parse(savedDraft);
          if (data.area === task.mathConfig.area) {
            setProblems(data.problems);
            setUserAnswers(data.userAnswers);
            return;
          }
        } catch (e) {
          console.error("Failed to parse math draft", e);
        }
      }

      const mathConfig = task.studentMathConfigs?.[student.studentId] || task.mathConfig;
      const count = mathConfig.problemCount || 20;
      const generated = generateProblems(mathConfig.grade, mathConfig.semester || 1, mathConfig.area || '', count);
      const initials = new Array(generated.length).fill('');
      if (generated.length > 0) {
        initials[0] = formatToUserInput(generated[0].correctAnswer);
      }

      try {
        localStorage.setItem(draftId, JSON.stringify({
          problems: generated,
          userAnswers: initials,
          area: mathConfig.area,
          date: today,
          studentId: student.studentId
        }));
      } catch (e) {
        console.error("Draft save failed", e);
      }

      setProblems(generated);
      setUserAnswers(initials);
    }
  }, [task, mode, student.studentId]);

  // Debounced save for answers
  useEffect(() => {
    if (mode === 'new' && problems.length > 0 && !isSubmitted) {
      const today = getTodayDateString();
      const draftId = `math_draft_${student.studentId}_${today}`;
      const timer = setTimeout(() => {
        try {
          const existingDraft = localStorage.getItem(draftId);
          if (existingDraft) {
            const data = JSON.parse(existingDraft);
            data.userAnswers = userAnswers;
            localStorage.setItem(draftId, JSON.stringify(data));
          }
        } catch (e) {
          console.error("Draft update failed", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userAnswers, problems, isSubmitted, mode, student.studentId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const today = getTodayDateString();
    let correctCount = 0;
    const finalResults = problems.map((p, i) => {
      let isCorrect = true;
      const ans = userAnswers[i] ? userAnswers[i].trim() : '';
      
      const expectedParts = p.correctAnswer.split(/,(?![^()]*\))/g);
      const userParts = ans.split(/,(?![^()]*\))/g);

      if (expectedParts.length !== userParts.length) {
        isCorrect = false;
      } else if (expectedParts.length === 6 && !expectedParts.some(x => x.includes('('))) {
        // Special case for relation_mul_div which has 6 plain numbers
        const p1 = expectedParts[0], n1 = expectedParts[1], n2 = expectedParts[2];
        const p2 = expectedParts[3], n3 = expectedParts[4], n4 = expectedParts[5];
        const valid1 = `${p1},${n1},${n2},${p2},${n3},${n4}`;
        const valid2 = `${p2},${n3},${n4},${p1},${n1},${n2}`;
        if (ans !== valid1 && ans !== valid2) isCorrect = false;
      } else {
        for (let j = 0; j < expectedParts.length; j++) {
          const exp = expectedParts[j].trim();
          const uAns = userParts[j] ? userParts[j].trim() : '';
          
          if (exp.startsWith('Q_R(')) {
            const match = exp.match(/Q_R\(([\d.]+),([\d.]+)\)/);
            if (!match || uAns !== `${match[1]}...${match[2]}`) isCorrect = false;
          } else if (exp.startsWith('FRAC(')) {
            const match = exp.match(/FRAC\((\d+),(\d+)\)/);
            if (!match || uAns !== `${match[1]}/${match[2]}`) isCorrect = false;
          } else if (exp.startsWith('MIXED(')) {
            const match = exp.match(/MIXED\((\d+),(\d+),(\d+)\)/);
            if (!match || uAns !== `${match[1]}_${match[2]}/${match[3]}`) isCorrect = false;
          } else {
            if (uAns !== exp) isCorrect = false;
          }
        }
      }

      if (isCorrect) correctCount++;
      return {
        question: p.question,
        userAnswer: ans,
        correctAnswer: p.correctAnswer,
        isCorrect
      };
    });

    const finalScore = Math.round((correctCount / problems.length) * 100);
    setScore(finalScore);
    setResults(finalResults);
    setIsSubmitted(true);
    setShowCompletionPopup(true);
    setTimerActive(false);

    // Save submission
    
    // Get unit and area info for metadata
    const mathConfig = task.studentMathConfigs?.[student.studentId] || task.mathConfig;
    const grade = mathConfig.grade;
    const semester = mathConfig.semester || 1;
    const unitId = mathConfig.unit;
    const unitInfo = CURRICULUM[grade as keyof typeof CURRICULUM]?.[semester as 1|2]?.find(u => u.id === unitId);
    const areaInfo = unitInfo?.areas.find(a => a.id === mathConfig.area);

    const isCoreTask = task.coreTasks?.includes('math');
    const maxRewards = 1;
    const canEarnXp = xpGainsCount < maxRewards;

    let xpGain = 0;
    if (canEarnXp) {
      xpGain = Math.round((finalScore / 100) * 25);
    }

    const submission: Submission = {
      studentId: student.studentId,
      classId: student.classId,
      date: today,
      type: 'math',
      score: finalScore,
      isFirstAttempt,
      xpGainsCount: xpGainsCount + (xpGain > 0 ? 1 : 0),
      answers: finalResults,
      grade,
      semester,
      unitId,
      unitName: unitInfo?.name,
      areaId: mathConfig.area,
      areaName: areaInfo?.name
    };

    try {
      await setDoc(doc(db, 'submissions', `${student.studentId}_${today}_math`), submission);

      // Update student XP/Level if first attempt or they can earn XP
      if (canEarnXp && xpGain > 0) {
        const rewardStars = 2;

        const newXp = student.xp + xpGain;
        const newLevel = calculateLevel(newXp);
        
        const updates: any = {
          xp: newXp,
          level: newLevel,
          lastMathCompletedDate: today,
          starPieces: (student.starPieces || 0) + rewardStars,
          [`dailyXp.${today}`]: increment(xpGain) // increment today's XP
        };

        // Progression logic: score >= 80 and sequential mode
        if (mathConfig.mode === 'sequential' && finalScore >= 80) {
          if (unitInfo) {
            const currentAreaIndex = unitInfo.areas.findIndex(a => a.id === mathConfig.area);
            if (currentAreaIndex !== -1 && currentAreaIndex + 1 < unitInfo.areas.length) {
              updates.currentAreaId = unitInfo.areas[currentAreaIndex + 1].id;
              setHasProgressed(true);
            }
          }
        }

        await updateDoc(doc(db, 'students', student.studentId), updates).catch(e => {
            handleFirestoreError(e, OperationType.UPDATE, `students/${student.studentId}`);
        });
        setEarnedXp(xpGain);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `submissions/${student.studentId}_${today}_math`);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-blue-50 pb-12">
      <header className="bg-white p-6 shadow-sm border-b border-blue-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-blue-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> {t('go_back')}
          </button>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-800">{t('solve_math')}</h2>
            <p className="text-xs text-blue-600 font-bold">
              {task.mathConfig.grade}{t('grade')} {task.mathConfig.semester || 1}학기 - {
                (() => {
                  const units = CURRICULUM[task.mathConfig.grade as keyof typeof CURRICULUM]?.[(task.mathConfig.semester || 1) as 1|2] || [];
                  for (const u of units) {
                    const area = u.areas.find(a => a.id === task.mathConfig.area);
                    if (area) return area.name.replace(/\(.*?\)/g, '').trim();
                  }
                  return task.mathConfig.area.replace(/\(.*?\)/g, '').trim();
                })()
              }
            </p>
          </div>
          <div className="w-20 flex justify-end">
            {mode !== 'view' && (
              <div className={`lg:hidden text-sm font-bold px-2 py-1 rounded-lg shadow-sm border ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-100'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Timer Progress Bar */}
      {mode !== 'view' && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 hidden lg:flex z-10">
          <div className={`text-sm font-bold px-2 py-1 rounded-lg shadow-sm border ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-100'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="h-64 w-4 bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
            <motion.div 
              className={`w-full absolute bottom-0 rounded-full ${timeLeft < 60 ? 'bg-red-500' : timeLeft < 300 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              initial={{ height: '100%' }}
              animate={{ height: `${(timeLeft / 900) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 mt-8 relative">
        <div className={`bg-white rounded-3xl p-8 shadow-xl shadow-blue-100 border-2 border-white space-y-8 ${showCompletionPopup ? 'pointer-events-none opacity-50 select-none' : ''}`}>
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-blue-800">{translatedPromptText}</h3>
          </div>
          
          <div className="w-full">
            <MathProblemList 
                problems={problems} 
                userAnswers={userAnswers}
                results={results.length > 0 ? results : undefined}
                onChangeAnswer={(i, val) => {
                  const newAnswers = [...userAnswers];
                  newAnswers[i] = val;
                  setUserAnswers(newAnswers);
                  if (results && results.length > 0) {
                    const newResults = [...results];
                    if (newResults[i]) {
                      (newResults[i] as any).isCorrect = undefined;
                    }
                    setResults(newResults);
                  }
                }} 
                mode={mode === 'new' ? 'new' : 'solve'}
                area={(task.studentMathConfigs?.[student.studentId] || task.mathConfig).area}
             />
          </div>

          {mode !== 'view' && (
            <div className="w-full mt-12 flex justify-center pb-8 border-t border-gray-100 pt-8">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || userAnswers.some(a => !a || a.trim() === '')}
                className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
                {t('submit')}
              </button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showCompletionPopup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center relative border-4 border-white"
            >
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-200">
                <Trophy className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">오늘의 수학과제를 완료하였습니다!</h2>
              
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <p className="text-blue-800 font-bold text-lg">
                  {results.filter(r => r.isCorrect).length} / {problems.length} 정답
                </p>
              </div>

              {earnedXp !== null && earnedXp > 0 ? (
                 <p className="text-blue-600 font-bold text-lg mb-6">경험치 {earnedXp} 획득!</p>
              ) : (
                  <p className="text-gray-500 font-bold mb-6">문제 풀이를 완료했습니다.</p>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowCompletionPopup(false);
                    setIsSubmitted(false);
                  }}
                  className="w-full bg-white text-blue-600 border-2 border-blue-600 py-3 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" /> 다시 풀기
                </button>
                <button
                  onClick={onBack}
                  className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Home className="w-5 h-5" /> 돌아가기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {earnedXp !== null && earnedXp > 0 && (
        <XpEffect xp={earnedXp} onComplete={() => setEarnedXp(null)} />
      )}
    </div>
  );
}
