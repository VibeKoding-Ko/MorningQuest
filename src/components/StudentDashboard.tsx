import React, { useState, useEffect } from 'react';
import { Joyride, Step } from 'react-joyride';
import { TutorialTooltip } from './TutorialTooltip';
import { getTodayDateString } from '../lib/dateUtils';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, orderBy, limit, setDoc, updateDoc, increment } from 'firebase/firestore';
import { Student, DailyTask, Submission } from '../types';
import { useAuth } from '../App';
import { CURRICULUM } from '../constants';
import { calculateLevel, getLevelProgress } from '../lib/levelUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, BookOpen, Calculator, Star, TrendingUp, CheckCircle2, Trophy as TrophyIcon, Medal, Award, LogOut, Hand, Moon, Sun, Crown, Heart, Send, ChevronLeft, PenTool, Keyboard, Target, Info, Package, ArrowRight, Sparkles, Maximize, Minimize } from 'lucide-react';
import MathProblemScreen from './MathProblemScreen';
import TopicWritingScreen from './TopicWritingScreen';
import TypingPracticeScreen from './TypingPracticeScreen';
import RankingModal from './RankingModal';
import ShopScreen from './ShopScreen';
import StudentMissionScreen from './StudentMissionScreen';
import StudentInfoModal from './StudentInfoModal';
import InventoryModal from './InventoryModal';
import TitleSelectorModal from './TitleSelectorModal';
import ConsecutiveAttendanceModal from './ConsecutiveAttendanceModal';
import XpEffect from './XpEffect';

import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';
import { RankIcon, RankBadge } from '../lib/rank';
import { MindDiary } from '../types';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  if (!user) return null;
  const student = user as Student;
  const [dailyTask, setDailyTask] = useState<DailyTask | null>(null);

  const [runTutorial, setRunTutorial] = useState(false);
  const [tutorialKey, setTutorialKey] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const tutorialSteps: Step[] = React.useMemo(() => [
    { target: '#tutorial-student-1', content: t('tutorial_student_1' as any) || '프로필을 누르면 지금까지 획득한 XP와 레벨업에 필요한 XP를 확인할 수 있습니다.', placement: 'bottom', skipBeacon: true },
    { target: '#tutorial-student-2', content: t('tutorial_student_2' as any) || '선생님이 내주신 특별 과제를 확인하고 도전해보세요.', placement: 'bottom', skipBeacon: true },
    { target: '#tutorial-student-3', content: t('tutorial_student_3' as any) || '과제를 완료하고 모은 별조각으로 상점에서 아이템을 살 수 있어요.', placement: 'bottom', skipBeacon: true },
    { target: '#tutorial-student-4', content: t('tutorial_student_4' as any) || '내가 구매한 아이템이나 칭호를 모아볼 수 있는 창고예요.', placement: 'bottom', skipBeacon: true },
    { target: '#tutorial-student-5', content: t('tutorial_student_5' as any) || '오늘의 학습 항목이에요. 미션 완료하고 XP와 별조각을 모아보세요!', placement: 'top', skipBeacon: true },
    { target: '#tutorial-student-6', content: t('tutorial_student_6' as any) || '친구들과 함께 공부하며 오늘의 랭킹 1위에 도전해보세요!', placement: 'top', skipBeacon: true }
  ], [language, t]);

  useEffect(() => {
    const tutorialKey = `tutorial_seen_student_${student.studentId}`;
    if (!localStorage.getItem(tutorialKey)) {
      setRunTutorial(true);
      localStorage.setItem(tutorialKey, 'true');
    }
  }, [student.studentId]);

  const handleTutorialCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
      localStorage.setItem(`tutorial_seen_student_${student.studentId}`, 'true');
    }
  };

  const startTutorial = () => {
    setTutorialKey(prev => prev + 1);
    setRunTutorial(true);
  };

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [typingSubmission, setTypingSubmission] = useState<any | null>(null);
  const [ranking, setRanking] = useState<Student[]>([]);
  const [isSolvingMath, setIsSolvingMath] = useState(false);
  const [showMathRetryModal, setShowMathRetryModal] = useState(false);
  const [mathMode, setMathMode] = useState<'new' | 'view' | 'retry'>('new');
  const [isLiteracyOpen, setIsLiteracyOpen] = useState(false);
  const [isTypingOpen, setIsTypingOpen] = useState(false);
  const [showKeyboardPopup, setShowKeyboardPopup] = useState(false);
  const [isStudentInfoOpen, setIsStudentInfoOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isTitleSelectorOpen, setIsTitleSelectorOpen] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(student.nickname || '');
  
  // Mind Diary State
  const [isWritingDiary, setIsWritingDiary] = useState(false);
  const [isEditingDiary, setIsEditingDiary] = useState(false);
  const [mindDiary, setMindDiary] = useState<MindDiary | null>(null);
  const [diaryMood, setDiaryMood] = useState('😊');
  const [diaryContent, setDiaryContent] = useState('');
  const [isSubmittingDiary, setIsSubmittingDiary] = useState(false);

  // Topic Writing State
  const [isWritingTopic, setIsWritingTopic] = useState(false);
  const [topicWriting, setTopicWriting] = useState<any>(null);

  // Modal State
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMissionOpen, setIsMissionOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  // Nickname Setup State
  const [newNickname, setNewNickname] = useState('');
  const [newSetupPassword, setNewSetupPassword] = useState('');
  const [isSubmittingNickname, setIsSubmittingNickname] = useState(false);

  // XP Effect State
  const [earnedXp, setEarnedXp] = useState<number | null>(null);

  useEffect(() => {
    // Update consecutive days logic
    const updateActiveDate = async () => {
      const today = getTodayDateString();
      if (student.lastActiveDate !== today) {
        let newConsecutive = 1;
        if (student.lastActiveDate) {
          const lastDate = new Date(student.lastActiveDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            newConsecutive = Math.min((student.consecutiveDays || 0) + 1, 7);
          }
        }
        
        try {
          const bonusXp = newConsecutive >= 2 ? newConsecutive : 0;
          let currentXp = student.xp || 0;
          
          if (bonusXp > 0) {
            // Read fresh data just in case
            const docRef = doc(db, 'students', student.studentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              currentXp = docSnap.data().xp || 0;
            }
          }

          const newXp = currentXp + bonusXp;
          const newLevel = calculateLevel(newXp);

          const updates: any = {
            lastActiveDate: today,
            consecutiveDays: newConsecutive,
          };
          if (bonusXp > 0) {
            updates.xp = newXp;
            updates.level = newLevel;
            updates[`dailyXp.${today}`] = increment(bonusXp);
          }

          await updateDoc(doc(db, 'students', student.studentId), updates);

          if (bonusXp > 0) {
            setEarnedXp(bonusXp);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `students/${student.studentId}`);
        }
      }
    };
    updateActiveDate();
  }, [student.studentId, student.lastActiveDate, student.consecutiveDays, student.xp]);

  useEffect(() => {
    if (!student.classId) return;

    const today = getTodayDateString();
    const taskRef = doc(db, 'dailyTasks', `${student.classId}_${today}`);
    const unsubTask = onSnapshot(taskRef, async (snapshot) => {
      if (snapshot.exists()) {
        setDailyTask(snapshot.data() as DailyTask);
      } else {
        const prevQ = query(
          collection(db, 'dailyTasks'), 
          where('classId', '==', student.classId),
          orderBy('date', 'desc'),
          limit(1)
        );
        try {
          const prevSnap = await getDocs(prevQ);
          if (!prevSnap.empty) {
            setDailyTask({ ...prevSnap.docs[0].data() as DailyTask, date: today });
          } else {
            setDailyTask(null);
          }
        } catch (e) {
          setDailyTask(null);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `dailyTasks/${student.classId}_${today}`);
    });

    const subRef = doc(db, 'submissions', `${student.studentId}_${today}_math`);
    const unsubSub = onSnapshot(subRef, (snapshot) => {
      if (snapshot.exists()) setSubmission(snapshot.data() as Submission);
      else setSubmission(null);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `submissions/${student.studentId}_${today}_math`);
    });

    const rankQ = query(collection(db, 'students'), where('classId', '==', student.classId));
      const unsubRank = onSnapshot(rankQ, (snapshot) => {
      const allStudents = snapshot.docs.map(d => d.data() as Student & { dailyXp?: Record<string, number> });
      // Sort by today's XP descending
      allStudents.sort((a, b) => {
        const aToday = (a.dailyXp && a.dailyXp[today]) || 0;
        const bToday = (b.dailyXp && b.dailyXp[today]) || 0;
        if (bToday !== aToday) return bToday - aToday;
        // fallback to total xp
        return b.xp - a.xp;
      });
      // Show top students, prioritizing those with XP today
      setRanking(allStudents.slice(0, 7));
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });

    const diaryRef = doc(db, 'mindDiaries', `${student.studentId}_${today}`);
    const unsubDiary = onSnapshot(diaryRef, (snapshot) => {
      if (snapshot.exists()) {
        setMindDiary(snapshot.data() as MindDiary);
      } else {
        setMindDiary(null);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });

    const topicRef = doc(db, 'topicWritings', `${student.studentId}_${today}`);
    const unsubTopic = onSnapshot(topicRef, (snapshot) => {
      if (snapshot.exists()) {
        setTopicWriting(snapshot.data());
      } else {
        setTopicWriting(null);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });

    const typingRef = doc(db, 'submissions', `${student.studentId}_${today}_typing`);
    const unsubTyping = onSnapshot(typingRef, (snapshot) => {
      if (snapshot.exists()) setTypingSubmission(snapshot.data());
      else setTypingSubmission(null);
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });

    return () => {
      unsubTask();
      unsubSub();
      unsubRank();
      unsubDiary();
      unsubTopic();
      unsubTyping();
    };
  }, [student.classId, student.studentId]);

  const handleDiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (diaryContent.trim().length < 50 || isSubmittingDiary) return;

    setIsSubmittingDiary(true);
    const today = getTodayDateString();
    const diaryId = `${student.studentId}_${today}`;
    
    try {
      const isCoreTask = dailyTask?.coreTasks?.includes('mindDiary');
      const maxRewards = 1;
      const xpGainsCount = mindDiary?.xpGainsCount || 0;
      const canEarnXp = xpGainsCount < maxRewards;

      await setDoc(doc(db, 'mindDiaries', diaryId), {
        id: diaryId,
        studentId: student.studentId,
        classId: student.classId,
        date: today,
        mood: diaryMood,
        content: diaryContent.trim(),
        createdAt: mindDiary ? mindDiary.createdAt : Date.now(),
        updatedAt: Date.now(),
        xpGainsCount: canEarnXp ? xpGainsCount + 1 : xpGainsCount
      }, { merge: true });
      
      if (canEarnXp) {
        // Calculate rewards
        const rewardXp = isCoreTask ? 20 : 5;
        const diaryStars = 2;

        const newXp = student.xp + rewardXp;
        const newLevel = calculateLevel(newXp);
        await updateDoc(doc(db, 'students', student.studentId), {
          xp: newXp,
          level: newLevel,
          starPieces: (student.starPieces || 0) + diaryStars,
          [`dailyXp.${today}`]: increment(rewardXp)
        });
        setEarnedXp(rewardXp); // Show XP effect
        if (mindDiary) alert('마음일기가 수정되었고 추가 경험치를 획득했습니다!');
      } else {
        if (mindDiary) alert('마음일기가 수정되었습니다!');
      }

      setDiaryContent('');
      setIsWritingDiary(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'mindDiaries');
    } finally {
      setIsSubmittingDiary(false);
    }
  };

  const handleTypingComplete = async (cpm: number, accuracy: number, score?: number, menu?: string, step?: number) => {
    const today = getTodayDateString();
    const isCoreTask = dailyTask?.coreTasks?.includes('typing');
    
    let todaysTypings: any[] = [];
    try {
      const q = query(
        collection(db, 'submissions'),
        where('studentId', '==', student.studentId),
        where('date', '==', today),
        where('type', '==', 'typing')
      );
      const docsSnap = await getDocs(q);
      todaysTypings = docsSnap.docs.map(d => d.data());
    } catch (e) {
      console.error(e);
    }

    const bScores = student.typingBasicScores || {};
    const limits = [40, 60, 80, 100, 120, 140];
    const isAllBasicCompleted = limits.every((limit, idx) => (bScores[idx + 1] || 0) >= limit);

    const alreadyGotTypingXpToday = todaysTypings.some(t => t.score > 0);
    let finalXp = 0;
    
    if (!alreadyGotTypingXpToday) {
      finalXp = isCoreTask ? 20 : 5;
    }

    const typingStars = finalXp > 0 ? 2 : 0;

    const subId = typingSubmission ? `${student.studentId}_${today}_typing_${Date.now()}` : `${student.studentId}_${today}_typing`;

    try {
      await setDoc(doc(db, 'submissions', subId), {
        studentId: student.studentId,
        classId: student.classId,
        date: today,
        type: 'typing',
        menu: menu || 'UNKNOWN',
        cpm,
        accuracy,
        score: finalXp, // Use score field for XP earned
        typingPracticeScore: score,
        isFirstAttempt: !typingSubmission,
        createdAt: Date.now()
      });

      const newXp = student.xp + finalXp;
      const newLevel = calculateLevel(newXp);
      
      const updates: any = {
        xp: newXp,
        level: newLevel,
        starPieces: (student.starPieces || 0) + typingStars,
        [`dailyXp.${today}`]: increment(finalXp)
      };
      
      if (cpm > (student.typingMaxCpm || 0)) {
        updates.typingMaxCpm = cpm;
      }
      if (score !== undefined && score > (student.typingMaxScore || 0)) {
        updates.typingMaxScore = score;
      }

      await updateDoc(doc(db, 'students', student.studentId), updates).catch(e => {
          handleFirestoreError(e, OperationType.UPDATE, `students/${student.studentId}`);
      });

      if (finalXp > 0) {
        setEarnedXp(finalXp);
      } else {
        alert('오늘 이미 타자연습 경험치를 획득했습니다.');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `submissions/${subId}`);
    }
  };

  let effectiveTask = dailyTask;

  if (dailyTask?.studentMathConfigs?.[student.studentId]) {
    effectiveTask = {
      ...dailyTask,
      mathConfig: {
        ...dailyTask.mathConfig,
        ...dailyTask.studentMathConfigs[student.studentId]
      }
    };
  }

  if (effectiveTask?.mathConfig?.mode === 'sequential') {
    const grade = effectiveTask.mathConfig.grade;
    const semester = effectiveTask.mathConfig.semester;
    const unitId = effectiveTask.mathConfig.unit;
    const unit = CURRICULUM[grade as keyof typeof CURRICULUM]?.[semester as 1|2]?.find(u => u.id === unitId);
    
    let targetAreaId = student.currentAreaId;
    
    if (!targetAreaId || !unit?.areas.find(a => a.id === targetAreaId)) {
      targetAreaId = unit?.areas[0]?.id || '';
    }

    effectiveTask = {
      ...effectiveTask,
      mathConfig: {
        ...effectiveTask.mathConfig,
        area: targetAreaId
      }
    };
  } else if (!dailyTask) {
    effectiveTask = {
      classId: student.classId,
      date: getTodayDateString(),
      mathConfig: {
        mode: 'manual',
        grade: student.grade,
        semester: 1,
        area: CURRICULUM[student.grade as keyof typeof CURRICULUM]?.[1]?.[0]?.areas?.[0]?.id || '1_1_1_1'
      }
    };
  }

  if (isSolvingMath && effectiveTask) {
    return (
      <MathProblemScreen 
        task={effectiveTask} 
        student={student} 
        onBack={() => setIsSolvingMath(false)} 
        mode={mathMode}
        previousSubmission={submission}
      />
    );
  }

  if (isWritingTopic) {
    return (
      <TopicWritingScreen 
        student={student} 
        onBack={() => setIsWritingTopic(false)} 
        dailyTask={dailyTask}
      />
    );
  }

  if (isWritingDiary) {
    return (
      <div className="min-h-screen bg-pink-50 pb-12">
        <header className="bg-white p-6 shadow-sm border-b border-pink-100">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button onClick={() => setIsWritingDiary(false)} className="flex items-center gap-2 text-gray-500 font-bold hover:text-pink-600 transition-all">
              <ChevronLeft className="w-6 h-6" /> {t('go_back')}
            </button>
            <div className="text-center">
              <h2 className="text-xl font-black text-gray-800">{t('mind_diary')}</h2>
            </div>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-pink-100 border-2 border-white">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-8 h-8 text-pink-500" />
              <h2 className="text-2xl font-black text-gray-800">{t('tell_us_your_feeling')}</h2>
            </div>
            
            {mindDiary && !isEditingDiary ? (
              <div className="space-y-4">
                <div className="bg-pink-50 rounded-2xl p-6 border border-pink-100">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{mindDiary.mood}</span>
                      <span className="font-bold text-gray-700">{mindDiary.date}</span>
                    </div>
                    {!mindDiary.teacherComment && (
                      <button
                        onClick={() => {
                          setDiaryMood(mindDiary.mood);
                          setDiaryContent(mindDiary.content);
                          setIsEditingDiary(true);
                        }}
                        className="px-3 py-1.5 bg-pink-100 text-pink-600 rounded-lg text-sm font-bold hover:bg-pink-200 transition-colors"
                      >
                        {t('edit')}
                      </button>
                    )}
                  </div>
                  <p className="text-gray-800 text-lg whitespace-pre-wrap">{mindDiary.content}</p>
                </div>
                
                {mindDiary.teacherComment && (
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 ml-8 relative">
                    <div className="absolute -left-3 top-6 w-0 h-0 border-t-[10px] border-t-transparent border-r-[12px] border-r-blue-50 border-b-[10px] border-b-transparent"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-blue-800">{t('teacher_comment')}</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{mindDiary.teacherComment}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={async (e) => {
                await handleDiarySubmit(e);
                setIsEditingDiary(false);
              }} className="space-y-6">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-4">{t('how_are_you_feeling_today')}</label>
                  <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
                    {['😊', '🥰', '🥳', '🤩', '😌', '😎', '😇', '🤔', '😐', '😶', '🥱', '😴', '😔', '🥺', '😭', '😥', '😰', '😱', '😠', '😡'].map(mood => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setDiaryMood(mood)}
                        className={`text-3xl sm:text-4xl p-2 sm:p-3 rounded-2xl transition-all ${diaryMood === mood ? 'bg-pink-100 scale-110 shadow-md' : 'hover:bg-gray-50 grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-4">{t('write_to_teacher_50')}</label>
                  <textarea
                    value={diaryContent}
                    onChange={(e) => setDiaryContent(e.target.value)}
                    placeholder={t('write_detail_50')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 outline-none resize-none h-40 text-lg"
                    maxLength={300}
                  />
                  <p className={`text-right text-sm mt-2 font-bold ${diaryContent.length < 50 ? 'text-red-500' : 'text-green-500'}`}>
                    {diaryContent.length} / 50자 이상 (최대 300자)
                  </p>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={diaryContent.length < 50 || isSubmittingDiary}
                    className="flex items-center gap-2 bg-pink-500 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-pink-200"
                  >
                    <Send className="w-6 h-6" />
                    {t('submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  const { progressPercent } = getLevelProgress(student.xp);
  const progress = progressPercent;

  const isCoreTask = (taskId: string) => dailyTask?.coreTasks?.includes(taskId);
  const getMaxRewards = (taskId: string) => 1;
  const getXpGainsCount = (subData: any) => subData?.xpGainsCount || (subData ? 1 : 0);
  
  const isTaskCompleted = (taskId: string, subData: any) => {
    return subData ? getXpGainsCount(subData) >= getMaxRewards(taskId) : false;
  };

  const getBadgeContent = (taskId: string) => {
    const isCore = isCoreTask(taskId);
    let xpText = isCore ? "20 XP" : "5 XP";
    if (taskId === 'math' && isCore) xpText = "최대 25 XP";
    return (
      <div className="flex items-center gap-1">
        <span className="font-black">{xpText}</span>
        <span className="ml-1 text-yellow-500">★</span> <span className="font-black">2</span>
      </div>
    );
  };

  if (!student.nickname) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-white text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4">
            <button onClick={logout} className="text-sm font-bold text-gray-400 hover:text-red-500">로그아웃</button>
          </div>
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
            <Sparkles className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">환영합니다!</h2>
          <p className="text-gray-500 font-bold mb-6">친구들에게 보여질 닉네임과 사용할 비밀번호(숫자 4자리)를 설정해주세요.</p>
          
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all text-center text-lg font-bold mb-4"
            placeholder="닉네임 입력 (2자 이상)"
            maxLength={10}
          />

          <input
            type="password"
            value={newSetupPassword}
            onChange={(e) => setNewSetupPassword(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all text-center text-lg font-bold mb-6"
            placeholder="비밀번호 숫자 4자리"
            maxLength={4}
          />
          
          <button
            onClick={async () => {
              if (newNickname.trim().length < 2) {
                alert('닉네임을 2자 이상 입력해주세요.');
                return;
              }
              if (newSetupPassword.length !== 4) {
                alert('비밀번호를 숫자 4자리로 입력해주세요.');
                return;
              }
              setIsSubmittingNickname(true);
              try {
                await updateDoc(doc(db, 'students', student.studentId), {
                  nickname: newNickname.trim(),
                  password: newSetupPassword
                });
                setIsSubmittingNickname(false);
              } catch (e) {
                console.error(e);
                alert('저장에 실패했습니다.');
                setIsSubmittingNickname(false);
              }
            }}
            disabled={isSubmittingNickname || newNickname.length < 2 || newSetupPassword.length !== 4}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
          >
            {isSubmittingNickname ? '저장 중...' : '시작하기'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-indigo-50 pb-12 font-sans selection:bg-blue-200">
      <Joyride
        key={tutorialKey}
        steps={tutorialSteps}
        run={runTutorial}
        continuous={true}
        options={{ buttons: ['back', 'close', 'primary', 'skip'] }}
        onEvent={handleTutorialCallback}
        tooltipComponent={TutorialTooltip}
      />
      {/* Header */}
      <div className="pt-4 px-4 mb-4 sm:mb-8 max-w-6xl mx-auto">
        <header className="relative bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-[3px] border-white flex flex-col md:flex-row justify-between items-start gap-4">
          
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="group w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.05),_inset_1px_2px_4px_rgba(255,255,255,0.7),_0_2px_6px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.05),_inset_1px_2px_4px_rgba(255,255,255,0.7),_0_4px_10px_rgba(0,0,0,0.1)] active:translate-y-0.5 active:shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.05),_inset_1px_1px_2px_rgba(255,255,255,0.7),_0_1px_2px_rgba(0,0,0,0.05)] transition-all border-none"
              title={isFullscreen ? "전체화면 종료" : "전체화면"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4 md:w-4.5 md:h-4.5 group-hover:scale-110 transition-transform" /> : <Maximize className="w-4 h-4 md:w-4.5 md:h-4.5 group-hover:scale-110 transition-transform" />}
            </button>
            <button
              onClick={startTutorial}
              className="group w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-200 to-indigo-400 text-indigo-800 shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.7),_0_2px_6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.7),_0_4px_10px_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.1),_inset_1px_1px_2px_rgba(255,255,255,0.7),_0_1px_2px_rgba(0,0,0,0.1)] transition-all border-none"
              title="튜토리얼 다시보기"
            >
              <span className="font-black text-base md:text-lg drop-shadow-sm pb-px group-hover:scale-110 transition-transform">?</span>
            </button>
            <LanguageSelector />
          </div>

          <div className="flex items-start gap-4 w-full">
            <button 
              id="tutorial-student-1"
              onClick={() => setIsStudentInfoOpen(true)}
              className="relative transition-transform hover:scale-105 active:scale-95 group shrink-0 pt-2"
              title="내 정보 보기 (로그아웃)"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center transition-transform group-hover:scale-105">
                <RankIcon level={student.level} className="w-full h-full" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-300 to-yellow-500 text-yellow-900 text-xs sm:text-sm font-black px-3 py-1 rounded-full border-2 border-white shadow-md whitespace-nowrap">
                Lv.{student.level}
              </div>
            </button>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="pr-16 sm:pr-24">
                <button 
                  onClick={() => setIsTitleSelectorOpen(true)}
                  className="text-base sm:text-lg text-gray-500 font-jayeon font-bold mb-0.5 truncate block hover:text-purple-600 transition-colors"
                  title="칭호 변경하기"
                >
                  {student.title || `${(student.school || '').replace(/등학교$/, '')} ${student.grade}학년 ${student.class}반`}
                </button>
                <div className="flex items-end gap-2 mt-1">
                  <h1 className="text-3xl sm:text-4xl font-jayeon font-bold text-gray-800 leading-tight tracking-tight truncate pb-1">{student.nickname || student.name}</h1>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-3 w-full">
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button 
                    onClick={() => setIsAttendanceOpen(true)}
                    className="flex bg-gradient-to-r from-orange-400 to-orange-500 px-3 py-1 rounded-full items-center gap-1.5 shadow-sm border-2 border-white hover:from-orange-500 hover:to-orange-600 hover:scale-105 active:scale-95 transition-all text-left"
                  >
                    <span className="text-sm animate-pulse">🔥</span>
                    <span className="font-black text-xs sm:text-sm text-white">{student.consecutiveDays || 0}일 연속</span>
                  </button>
                  <div className="flex bg-gradient-to-r from-indigo-400 to-indigo-500 px-3 py-1 rounded-full items-center gap-1.5 shadow-sm border-2 border-white">
                    <span className="text-sm text-yellow-300">★</span>
                    <span className="font-black text-xs sm:text-sm text-white">{student.starPieces || 0}개</span>
                  </div>
                </div>

                <div className="flex flex-row flex-wrap items-center justify-end gap-2 w-full lg:w-auto">
                  {(dailyTask ? dailyTask.enableMyMonster !== false : true) && (
                    <button 
                      onClick={() => alert("준비중입니다")}
                      className="group flex flex-col flex-1 md:flex-none items-center justify-center bg-pink-50/80 hover:bg-pink-100 px-2 py-2 md:px-3 md:py-2.5 rounded-xl lg:rounded-2xl border-none shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-pink-800 font-bold whitespace-nowrap min-w-[72px] gap-1"
                      title={t('my_monster' as any) || "나만의 몬스터"}
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-300 to-pink-500 text-white flex items-center justify-center shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110 group-hover:rotate-6">
                        <span className="text-lg drop-shadow-sm leading-none pt-0.5">👾</span>
                      </div>
                      <span className="text-[10px] md:text-xs">{t('my_monster' as any) || "나만의 몬스터"}</span>
                    </button>
                  )}
                  <button 
                    id="tutorial-student-2"
                    onClick={() => setIsMissionOpen(true)}
                    className="group flex flex-col flex-1 md:flex-none items-center justify-center bg-orange-50/80 hover:bg-orange-100 px-2 py-2 md:px-3 md:py-2.5 rounded-xl lg:rounded-2xl border-none shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-orange-800 font-bold whitespace-nowrap min-w-[72px] gap-1"
                    title={t('missions_title' as any) || "우리반 특별 과제함"}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-300 to-orange-500 text-white flex items-center justify-center shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110 group-hover:rotate-6">
                      <Target className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm" />
                    </div>
                    <span className="text-[10px] md:text-xs">{t('missions_menu' as any) || '과제'}</span>
                  </button>
                  <button 
                    id="tutorial-student-3"
                    onClick={() => setIsShopOpen(true)}
                    className="group flex flex-col flex-1 md:flex-none items-center justify-center bg-indigo-50/80 hover:bg-indigo-100 px-2 py-2 md:px-3 md:py-2.5 rounded-xl lg:rounded-2xl border-none shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-indigo-800 font-bold whitespace-nowrap min-w-[72px] gap-1"
                    title={t('shop_title' as any) || "상점"}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-300 to-indigo-500 text-white flex items-center justify-center shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110 group-hover:rotate-6">
                      <Star className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm fill-current" />
                    </div>
                    <span className="text-[10px] md:text-xs flex-none">{t('shop_title' as any) || '상점'}</span>
                  </button>
                  <button 
                    id="tutorial-student-4"
                    onClick={() => setIsInventoryOpen(true)}
                    className="group flex flex-col flex-1 md:flex-none items-center justify-center bg-emerald-50/80 hover:bg-emerald-100 px-2 py-2 md:px-3 md:py-2.5 rounded-xl lg:rounded-2xl border-none shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-emerald-800 font-bold whitespace-nowrap min-w-[72px] gap-1"
                    title={t('inventory_title' as any) || "창고"}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-white flex items-center justify-center shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110 group-hover:rotate-6">
                      <Package className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm" />
                    </div>
                    <span className="text-[10px] md:text-xs">{t('inventory_title' as any) || '창고'}</span>
                  </button>
                  <button 
                    onClick={() => setIsRankingOpen(true)}
                    className="group flex flex-col flex-1 md:flex-none items-center justify-center bg-yellow-50/80 hover:bg-yellow-100 px-2 py-2 md:px-3 md:py-2.5 rounded-xl lg:rounded-2xl border-none shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-amber-800 font-bold whitespace-nowrap min-w-[72px] gap-1"
                    title={t('ranking_title' as any) || "랭킹"}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500 text-white flex items-center justify-center shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.4),_0_2px_4px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110 group-hover:rotate-6">
                      <TrophyIcon className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm" />
                    </div>
                    <span className="text-[10px] md:text-xs">{t('ranking_title' as any) || '랭킹'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <main className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Learning Menu */}
        <div id="tutorial-student-5" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {(dailyTask ? dailyTask.enableMath !== false : true) && (
            <LearningCard
              icon={<Calculator className="w-8 h-8" />}
              title={t('solve_math' as any) || '수학 연습'}
              desc={t('math_desc' as any) || '오늘의 연산 문제를 풀고 실력을 키워요!'}
              color="blue"
              completed={isTaskCompleted('math', submission)}
              onClick={() => {
                if (effectiveTask) {
                  if (isTaskCompleted('math', submission)) {
                    setShowMathRetryModal(true);
                  } else if (submission) {
                    setMathMode('retry');
                    setIsSolvingMath(true);
                  } else {
                    setMathMode('new');
                    setIsSolvingMath(true);
                  }
                } else {
                  alert(t('no_tasks_today'));
                }
              }}
              badge={!isTaskCompleted('math', submission) ? getBadgeContent('math') : undefined}
            />
          )}
          {(dailyTask ? dailyTask.enableMindDiary !== false : true) && (
            <LearningCard
              icon={<Heart className="w-8 h-8" />}
              title={t('mind_diary' as any) || '마음 일기'}
              desc={t('mind_diary_desc' as any) || '오늘 하루 어땠나요? 선생님에게 비밀 이야기를 들려주세요.'}
              color="pink"
              completed={isTaskCompleted('mindDiary', mindDiary)}
              onClick={() => setIsWritingDiary(true)}
              badge={!isTaskCompleted('mindDiary', mindDiary) ? getBadgeContent('mindDiary') : undefined}
            />
          )}
          {(dailyTask ? dailyTask.enableTopicWriting !== false : true) && (
            <LearningCard
              icon={<PenTool className="w-8 h-8" />}
              title={t('topic_writing' as any) || '주제 글쓰기'}
              desc={t('topic_writing_desc' as any) || '매일매일 새로운 주제로 글을 써보아요!'}
              color="green"
              completed={isTaskCompleted('topicWriting', topicWriting)}
              onClick={() => setIsWritingTopic(true)}
              badge={!isTaskCompleted('topicWriting', topicWriting) ? getBadgeContent('topicWriting') : undefined}
            />
          )}
          {(dailyTask ? dailyTask.enableLiteracy !== false : true) && (
            <LearningCard
              icon={<BookOpen className="w-8 h-8" />}
              title={t('improve_literacy')}
              desc={t('literacy_desc' as any) || '재미있는 글을 읽고 퀴즈를 맞혀보세요!'}
              color="orange"
              completed={false}
              onClick={() => setIsLiteracyOpen(true)}
              badge={getBadgeContent('literacy')}
            />
          )}
          {(dailyTask ? dailyTask.enableTyping !== false : true) && (
            <LearningCard
              icon={<Keyboard className="w-8 h-8" />}
              title={t('typing_practice' as any) || '타자연습'}
              desc={t('typing_practice_desc' as any) || '타자 실력을 쑥쑥 키워보세요!'}
              color="purple"
              completed={isTaskCompleted('typing', typingSubmission)}
              onClick={() => setShowKeyboardPopup(true)}
              badge={!isTaskCompleted('typing', typingSubmission) ? getBadgeContent('typing') : undefined}
            />
          )}
        </div>

        {/* Ranking */}
        <div id="tutorial-student-6" className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-[3px] border-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-yellow-100 rounded-2xl">
                <TrophyIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-3xl font-black text-gray-800">{t('today_ranking')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ranking.length === 0 ? (
                <p className="text-gray-500 text-center py-10 font-medium bg-gray-50 rounded-2xl md:col-span-2">{t('no_ranking')}</p>
              ) : ranking.slice(0, 6).map((s, i) => (
                <div key={s.studentId} className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl transition-transform hover:-translate-y-1 ${s.studentId === student.studentId ? 'bg-yellow-50 border-[3px] border-yellow-200 shadow-md shadow-yellow-100/50' : 'bg-gray-50 border-[3px] border-transparent hover:bg-white hover:shadow-sm'}`}>
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-2xl font-black text-xl sm:text-2xl shadow-sm ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 border-2 border-yellow-200' : i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 border-2 border-gray-100' : i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 border-2 border-orange-200' : 'bg-white text-gray-400 border-2 border-gray-200 sm:text-xl'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div className="flex flex-col items-start gap-0.5 sm:gap-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 truncate w-full max-w-[120px] sm:max-w-[160px]">
                        {s.title || `${(s.school || '').replace(/등학교$/, '')} ${s.grade}학년 ${s.class}반`}
                      </p>
                      <p className="font-black text-sm sm:text-base text-gray-800 leading-none truncate w-full max-w-[120px] sm:max-w-[180px]">{s.nickname || s.name}</p>
                      <RankBadge level={s.level} className="py-0.5 px-2 text-[9px] sm:text-[10px] mt-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center shrink-0 pl-2">
                    <span className="font-black text-sm sm:text-base text-yellow-600 tracking-tight">{((s as any).dailyXp?.[getTodayDateString()] || 0).toLocaleString()} <span className="text-[10px] sm:text-xs text-yellow-500">XP</span></span>
                  </div>
                </div>
              ))}
            </div>
            {ranking.length > 5 && (
               <div className="mt-4 text-center">
                 <button onClick={() => setIsRankingOpen(true)} className="text-sm font-bold text-gray-500 hover:text-gray-800 bg-gray-100 px-6 py-2 rounded-full transition-colors">
                   전체 랭킹 보기
                 </button>
               </div>
            )}
          </div>
        </div>
      </main>

      {/* Literacy Modal */}
      <AnimatePresence>
        {isLiteracyOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-black mb-4">준비 중입니다!</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                일일 문해력 테스트는 선생님이 준비 중이에요.<br />
                조금만 기다려 주세요!
              </p>
              <button
                onClick={() => setIsLiteracyOpen(false)}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-100"
              >
                확인
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Connection Modal */}
      <AnimatePresence>
        {showKeyboardPopup && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-purple-100/50">
                  <Keyboard className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-slate-800">키보드 연결 확인</h3>
                <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                  타자연습을 시작하기 전에<br />
                  <span className="text-purple-600 font-bold">키보드가 연결되어 있는지</span> 확인해주세요!
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowKeyboardPopup(false);
                      setIsTypingOpen(true);
                    }}
                    className="w-full bg-gradient-to-b from-purple-500 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_4px_10px_rgba(168,85,247,0.3),_inset_0_2px_0_rgba(255,255,255,0.2)] hover:from-purple-400 hover:to-purple-500 hover:shadow-[0_6px_15px_rgba(168,85,247,0.4),_inset_0_2px_0_rgba(255,255,255,0.3)] active:scale-[0.98] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all"
                  >
                    확인했어요
                  </button>
                  <button
                    onClick={() => setShowKeyboardPopup(false)}
                    className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-200 active:scale-[0.98] transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Typing Modal */}
      <AnimatePresence>
        {isTypingOpen && (
          <TypingPracticeScreen 
            initialGrade={dailyTask?.typingConfig?.grade || student.grade || 1}
            student={student}
            onClose={() => setIsTypingOpen(false)}
            onComplete={handleTypingComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMathRetryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black mb-4">이미 학습지를 풀었어요!</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                오늘의 수학 학습지를 이미 제출했습니다.<br />
                다시 푸시겠습니까?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMathMode('retry');
                    setIsSolvingMath(true);
                    setShowMathRetryModal(false);
                  }}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                >
                  다시 풀기
                </button>
                <button
                  onClick={() => setShowMathRetryModal(false)}
                  className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RankingModal 
        isOpen={isRankingOpen} 
        onClose={() => setIsRankingOpen(false)} 
        currentStudent={student} 
      />

      {isShopOpen && (
        <ShopScreen student={student} onClose={() => setIsShopOpen(false)} />
      )}

      {isMissionOpen && (
        <StudentMissionScreen student={student} onClose={() => setIsMissionOpen(false)} />
      )}

      {isStudentInfoOpen && (
        <StudentInfoModal student={student} onClose={() => setIsStudentInfoOpen(false)} onLogout={logout} />
      )}

      {isAttendanceOpen && (
        <ConsecutiveAttendanceModal student={student} onClose={() => setIsAttendanceOpen(false)} />
      )}

      {isInventoryOpen && (
        <InventoryModal student={student} onClose={() => setIsInventoryOpen(false)} />
      )}

      {isTitleSelectorOpen && (
        <TitleSelectorModal student={student} onClose={() => setIsTitleSelectorOpen(false)} />
      )}

      {earnedXp !== null && earnedXp > 0 && (
        <XpEffect xp={earnedXp} onComplete={() => setEarnedXp(null)} />
      )}
    </div>
  );
}

function LearningCard({ icon, title, desc, color, completed, onClick, badge }: { icon: React.ReactNode; title: string; desc: string; color: 'blue' | 'orange' | 'pink' | 'green' | 'purple'; completed: boolean; onClick: () => void; badge?: React.ReactNode }) {
  const themes = {
    blue: { bg: 'bg-white', iconFrom: 'from-blue-300', iconTo: 'to-blue-500', iconBg: 'bg-blue-100', text: 'text-blue-600', shadow: 'shadow-blue-200/50', btnFrom: 'from-blue-400', btnTo: 'to-blue-500', badgeText: 'text-blue-700', badgeBg: 'bg-blue-50' },
    orange: { bg: 'bg-white', iconFrom: 'from-orange-300', iconTo: 'to-orange-500', iconBg: 'bg-orange-100', text: 'text-orange-600', shadow: 'shadow-orange-200/50', btnFrom: 'from-orange-400', btnTo: 'to-orange-500', badgeText: 'text-orange-700', badgeBg: 'bg-orange-50' },
    pink: { bg: 'bg-white', iconFrom: 'from-pink-300', iconTo: 'to-pink-500', iconBg: 'bg-pink-100', text: 'text-pink-600', shadow: 'shadow-pink-200/50', btnFrom: 'from-pink-400', btnTo: 'to-pink-500', badgeText: 'text-pink-700', badgeBg: 'bg-pink-50' },
    green: { bg: 'bg-white', iconFrom: 'from-emerald-300', iconTo: 'to-emerald-500', iconBg: 'bg-emerald-100', text: 'text-emerald-600', shadow: 'shadow-emerald-200/50', btnFrom: 'from-emerald-400', btnTo: 'to-emerald-500', badgeText: 'text-emerald-700', badgeBg: 'bg-emerald-50' },
    purple: { bg: 'bg-white', iconFrom: 'from-purple-300', iconTo: 'to-purple-500', iconBg: 'bg-purple-100', text: 'text-purple-600', shadow: 'shadow-purple-200/50', btnFrom: 'from-purple-400', btnTo: 'to-purple-500', badgeText: 'text-purple-700', badgeBg: 'bg-purple-50' }
  };
  const t = themes[color];

  return (
    <button
      onClick={onClick}
      className={`relative w-full ${t.bg} p-5 sm:p-6 rounded-[2.5rem] border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 active:translate-y-1 transition-all text-center group flex flex-col items-center justify-between h-full min-h-[16rem]`}
    >
      <div className="flex justify-between items-start w-full relative z-10 gap-2">
        {/* Matte 3D icon style container */}
        <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[1.25rem] bg-gradient-to-br ${t.iconFrom} ${t.iconTo} text-white flex items-center justify-center shadow-[inset_-2px_-4px_6px_rgba(0,0,0,0.1),_inset_2px_4px_6px_rgba(255,255,255,0.4),_0_8px_16px_-4px_rgba(0,0,0,0.2)] transition-transform group-hover:scale-105 group-hover:rotate-6`}>
          <div className="drop-shadow-md">
            {icon}
          </div>
        </div>
        {badge && (
          <div className={`${t.badgeBg} ${t.badgeText} px-2.5 py-1.5 rounded-full font-black shadow-sm text-[11px] sm:text-xs border-2 border-white flex items-center shrink-0 whitespace-nowrap`}>
            {badge}
          </div>
        )}
      </div>

      <div className="mt-6 mb-6 flex flex-col items-center flex-1 justify-center">
        <h3 className="text-[1.15rem] sm:text-[1.35rem] font-black text-gray-800 mb-2 leading-tight tracking-tight">{title}</h3>
        <p className="text-[13px] sm:text-sm text-gray-500 font-bold leading-snug break-keep">{desc}</p>
      </div>
      
      <div className="w-full mt-auto relative z-10">
        {completed ? (
          <div className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-lg shadow-inner">
            <CheckCircle2 className="w-6 h-6" /> 학습 완료!
          </div>
        ) : (
          <div className={`flex items-center justify-center gap-2 w-full py-4 text-white rounded-2xl bg-gradient-to-r ${t.btnFrom} ${t.btnTo} font-black text-lg transition-all shadow-md group-hover:shadow-lg opacity-90 group-hover:opacity-100`}>
            시작하기 <ArrowRight className="w-6 h-6" />
          </div>
        )}
      </div>
    </button>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
