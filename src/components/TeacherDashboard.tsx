import React, { useState, useEffect } from 'react';
import { Joyride, Step } from 'react-joyride';
import { TutorialTooltip } from './TutorialTooltip';
import { MathProblemList } from './MathProblemRenderer';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { deleteUser, updateEmail, updatePassword } from 'firebase/auth';
import { Teacher, Student, DailyTask, Submission, MindDiary } from '../types';
import { useAuth } from '../App';
import { CURRICULUM } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Calendar, BarChart3, Plus, Settings, LogOut, CheckCircle2, XCircle, UserPlus, Trash2, Key, Heart, Sparkles, Bell, Send, PenTool, ArrowRight, ShoppingCart, Target, Star, PlusCircle, UserCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RankBadge } from '../lib/rank';
import { GoogleGenAI } from '@google/genai';
import { getTopicForToday } from '../lib/writingTopics';
import { calculateLevel, LEVEL_THRESHOLDS } from '../lib/levelUtils';
import { getTodayDateString, formatDateToKSTString } from '../lib/dateUtils';
import { renderMathText } from './MathProblemScreen';
import AdminShopScreen from './AdminShopScreen';
import { useLanguage, useDynamicTranslation } from '../contexts/LanguageContext';
import AdminMissionScreen from './AdminMissionScreen';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const teacher = user as Teacher;
  const [activeTab, setActiveTab] = useState<'students' | 'tasks' | 'results' | 'diaries' | 'topics' | 'completion' | 'shop' | 'missions' | 'settings'>('students');

  const [runTutorial, setRunTutorial] = useState(false);
  const [tutorialKey, setTutorialKey] = useState(0);
  const tutorialSteps: Step[] = [
    { target: '#tutorial-step-1', content: '학급 학생들을 추가하거나 삭제할 수 있고 비밀번호를 초기화 할 수 있습니다.', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-2', content: '학생들에게 배포되는 오늘의 과제를 설정하고 핵심 과제 최대 2개까지 설정할 수 있습니다.', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-3', content: '학생들이 구매할 수 있는 아이템을 만들고 학생들의 화폐를 조절 할 수 있습니다', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-4', content: '과제를 설정하면 빨리 내는 학생에게 보상을 할 수 있습니다', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-5', content: '오늘 학생들의 과제 제출 현황을 한눈에 확인할 수 있습니다.', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-6', content: '학습별, 날짜별 성적과 통계를 그래프로 한눈에 파악할 수 있습니다.', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-7', content: '학생들이 작성한 마음 일기를 확인하고 코멘트를 남길 수 있습니다.', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-8', content: '학생들이 작성한 주제 글쓰기를 확인하고 지도할 수 있습니다.', placement: 'right', skipBeacon: true },
    { target: '#tutorial-step-9', content: '선생님 계정 정보 및 학급 설정을 관리합니다.', placement: 'right', skipBeacon: true }
  ];

  useEffect(() => {
    // 자동 튜토리얼 실행 제거
  }, [teacher.uid]);

  const handleTutorialCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
      localStorage.setItem(`tutorial_seen_teacher_${teacher.uid}`, 'true');
    }
  };

  const startTutorial = () => {
    setTutorialKey(prev => prev + 1);
    setRunTutorial(true);
  };

  const [classes, setClasses] = useState<any[]>([]);
  const [isClassesLoading, setIsClassesLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(teacher.classId || null);
  const [hideNoClassPrompt, setHideNoClassPrompt] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dailyTask, setDailyTask] = useState<DailyTask | null>(null);
  const [mindDiaries, setMindDiaries] = useState<MindDiary[]>([]);
  const [topicWritings, setTopicWritings] = useState<any[]>([]);

  useEffect(() => {
    const qClasses = query(collection(db, 'classes'), where('teacherUid', '==', teacher.uid));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      const cls = snapshot.docs.map(d => d.data());
      // Sort classes by year descending, grade, classNumber
      cls.sort((a, b) => {
        if (a.year !== b.year) return (b.year || 0) - (a.year || 0);
        if (a.grade !== b.grade) return (a.grade || 0) - (b.grade || 0);
        return (a.classNumber || 0) - (b.classNumber || 0);
      });
      setClasses(cls);
      setIsClassesLoading(false);
      
      // Auto-select the first class in the list
      if (cls.length > 0) {
        // If we don't have a selection OR the current selection isn't in the new list, pick the first
        if (!selectedClassId || !cls.find(c => c.id === selectedClassId)) {
          setSelectedClassId(cls[0].id);
        }
      } else {
        setSelectedClassId(null);
      }
    }, (error) => {
      try { handleFirestoreError(error, OperationType.LIST, 'classes'); } catch (e) {}
    });
    return () => unsubClasses();
  }, [teacher.uid]);

  useEffect(() => {
    if (!selectedClassId) return;

    const q = query(collection(db, 'students'), where('classId', '==', selectedClassId));
    const unsubStudents = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(d => d.data() as Student));
    }, (error) => {
      try { handleFirestoreError(error, OperationType.LIST, 'students'); } catch (e) {}
    });

    const today = getTodayDateString();
    const taskRef = doc(db, 'dailyTasks', `${selectedClassId}_${today}`);
    const unsubTask = onSnapshot(taskRef, async (snapshot) => {
      if (snapshot.exists()) {
        setDailyTask(snapshot.data() as DailyTask);
      } else {
        const prevQ = query(
          collection(db, 'dailyTasks'), 
          where('classId', '==', selectedClassId),
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
      handleFirestoreError(error, OperationType.GET, `dailyTasks/${selectedClassId}_${today}`);
    });

    const subQ = query(collection(db, 'submissions'), where('classId', '==', selectedClassId));
    const unsubSubs = onSnapshot(subQ, (snapshot) => {
      setSubmissions(snapshot.docs.map(d => d.data() as Submission));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    });

    const diaryQ = query(collection(db, 'mindDiaries'), where('classId', '==', selectedClassId));
    const unsubDiaries = onSnapshot(diaryQ, (snapshot) => {
      setMindDiaries(snapshot.docs.map(d => d.data() as MindDiary));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'mindDiaries');
    });

    const topicQ = query(collection(db, 'topicWritings'), where('classId', '==', selectedClassId));
    const unsubTopics = onSnapshot(topicQ, (snapshot) => {
      setTopicWritings(snapshot.docs.map(d => d.data()));
    }, (error) => {
      try { handleFirestoreError(error, OperationType.LIST, 'topicWritings'); } catch (e) {}
    });

    return () => {
      unsubStudents();
      unsubTask();
      unsubSubs();
      unsubDiaries();
      unsubTopics();
    };
  }, [selectedClassId]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* No Class Overlay Prompt */}
      {!isClassesLoading && classes.length === 0 && !hideNoClassPrompt && (
        <div className="fixed inset-0 bg-white/90 z-[60] flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
          <div className="max-w-md w-full bg-blue-50 p-8 rounded-3xl border-2 border-blue-200 shadow-2xl">
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlusCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-4">학급을 먼저 생성해주세요!</h2>
            <p className="text-gray-600 font-medium mb-8 leading-relaxed">
              안녕하세요, 선생님! 서비스를 이용하시려면<br />
              먼저 담당하시는 학급을 만들어야 합니다.<br />
              [관리자 모드] - [학급 관리]에서 학급을 생성해보세요.
            </p>
            <button
              onClick={() => {
                setActiveTab('students');
                setHideNoClassPrompt(true);
                const tutorialKey = `tutorial_seen_teacher_${teacher.uid}`;
                if (!localStorage.getItem(tutorialKey)) {
                  setRunTutorial(true);
                  localStorage.setItem(tutorialKey, 'true');
                }
              }}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg"
            >
              학급 만들러 가기
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="font-bold text-xl">관리자 모드</h2>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <TabButton id="tutorial-step-1" active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users />} label="학급 관리" />
          <TabButton id="tutorial-step-2" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<Calendar />} label="학습 설정" />
          <TabButton id="tutorial-step-3" active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingCart />} label="상점 관리" />
          <TabButton id="tutorial-step-4" active={activeTab === 'missions'} onClick={() => setActiveTab('missions')} icon={<Target />} label="우리반 과제/제출물함" />
          <TabButton id="tutorial-step-5" active={activeTab === 'completion'} onClick={() => setActiveTab('completion')} icon={<CheckCircle2 />} label="오늘의 할일 확인" />
          <TabButton id="tutorial-step-6" active={activeTab === 'results'} onClick={() => setActiveTab('results')} icon={<BarChart3 />} label="학습 결과 리포트" />
          <TabButton id="tutorial-step-7" active={activeTab === 'diaries'} onClick={() => setActiveTab('diaries')} icon={<Heart />} label="마음 일기" />
          <TabButton id="tutorial-step-8" active={activeTab === 'topics'} onClick={() => setActiveTab('topics')} icon={<Sparkles />} label="주제 글쓰기" />
          <TabButton id="tutorial-step-9" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<UserCircle />} label="회원정보" />
        </nav>

        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <button
            onClick={startTutorial}
            className="group w-full flex items-center justify-between px-4 py-3 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl transition-all font-bold border-none"
          >
            튜토리얼 다시보기
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-200 to-indigo-400 text-indigo-800 shadow-[inset_-1px_-2px_4px_rgba(0,0,0,0.1),_inset_1px_2px_4px_rgba(255,255,255,0.7),_0_2px_6px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">
              <span className="font-black text-sm drop-shadow-sm pb-px">?</span>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto relative">
        <Joyride
          key={tutorialKey}
          steps={tutorialSteps}
          run={runTutorial}
          continuous={true}
          options={{ buttons: ['back', 'close', 'primary', 'skip'] }}
          onEvent={handleTutorialCallback}
          tooltipComponent={TutorialTooltip}
        />
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-5xl mx-auto"
        >
          {activeTab === 'students' && <ClassManagement classes={classes} selectedClassId={selectedClassId} onSelectClass={setSelectedClassId} students={students} teacher={teacher} />}
          {activeTab === 'tasks' && selectedClassId && <TaskSetting dailyTask={dailyTask} classId={selectedClassId} students={students} />}
          {activeTab === 'completion' && <DailyCompletionStatus students={students} submissions={submissions} diaries={mindDiaries} topicWritings={topicWritings} />}
          {activeTab === 'results' && <ResultsReport students={students} submissions={submissions} dailyTask={dailyTask} />}
          {activeTab === 'diaries' && <MindDiaryManagement students={students} diaries={mindDiaries} />}
          {activeTab === 'topics' && <TopicWritingManagement students={students} topicWritings={topicWritings} />}
          {activeTab === 'shop' && selectedClassId && <AdminShopScreen students={students} classId={selectedClassId} />}
          {activeTab === 'missions' && selectedClassId && <AdminMissionScreen students={students} classId={selectedClassId} />}
          {activeTab === 'settings' && <TeacherSettings teacher={teacher} classes={classes} logout={logout} />}
        </motion.div>
      </main>
    </div>
  );
}

function MindDiaryManagement({ students, diaries }: { students: Student[], diaries: MindDiary[] }) {
  const [viewMode, setViewMode] = useState<'date' | 'student'>('date');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.studentId || '');
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const todayDiaries = diaries.filter(d => d.date === selectedDate);
  const studentMap = new Map(students.map(s => [s.studentId, s]));

  const last5Days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return formatDateToKSTString(d);
  });

  const handleCommentSubmit = async (diaryId: string) => {
    if (!commentText.trim()) return;

    try {
      await updateDoc(doc(db, 'mindDiaries', diaryId), {
        teacherComment: commentText.trim()
      });
      setCommentingId(null);
      setCommentText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'mindDiaries');
    }
  };

  const handleGenerateAIReply = async (diary: MindDiary, studentName: string) => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `당신은 20년 차 베테랑 초등학교 선생님입니다. 학생이 마음 일기를 작성했습니다.
학생 이름: ${studentName}
오늘의 기분: ${diary.mood}
일기 내용: ${diary.content}

이 학생에게 따뜻하고 격려가 되는, 공감하는 답장을 1~2문장으로 작성해주세요. 초등학생에게 말하듯 다정하고 친절한 말투(해요체)를 사용하세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      if (response.text) {
        setCommentText(response.text.trim());
      }
    } catch (error) {
      console.error("AI Reply Generation Error:", error);
      alert("AI 답장 생성에 실패했습니다.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const [isGeneratingAllAI, setIsGeneratingAllAI] = useState(false);

  const handleGenerateAllAIReply = async () => {
    const diariesToReply = todayDiaries.filter(d => !d.teacherComment);
    if (diariesToReply.length === 0) return;

    setIsGeneratingAllAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      for (const diary of diariesToReply) {
        const student = studentMap.get(diary.studentId);
        if (!student) continue;

        const prompt = `당신은 20년 차 베테랑 초등학교 선생님입니다. 학생이 마음 일기를 작성했습니다.
학생 이름: ${student.nickname || student.name}
오늘의 기분: ${diary.mood}
일기 내용: ${diary.content}

이 학생에게 따뜻하고 격려가 되는, 공감하는 답장을 1~2문장으로 작성해주세요. 초등학생에게 말하듯 다정하고 친절한 말투(해요체)를 사용하세요.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        
        if (response.text) {
          await updateDoc(doc(db, 'mindDiaries', diary.id), {
            teacherComment: response.text.trim()
          });
        }
      }
    } catch (error) {
      console.error("All AI Reply Generation Error:", error);
      alert("전체 AI 답장 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingAllAI(false);
    }
  };

  const renderDiaryCard = (diary: MindDiary, student: Student) => (
    <div key={diary.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col w-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{diary.mood}</span>
          <div>
            <p className="font-bold text-gray-800">{student.nickname || student.name}</p>
            <p className="text-sm text-gray-500">{student.number}번</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(diary.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <p className="text-gray-700 mb-6 flex-1 bg-pink-50 p-4 rounded-xl whitespace-pre-wrap break-words">{diary.content}</p>

      {diary.teacherComment ? (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-blue-800 text-sm">선생님의 답장</span>
            <button 
              onClick={() => {
                setCommentingId(diary.id);
                setCommentText(diary.teacherComment || '');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              수정
            </button>
          </div>
          {commentingId === diary.id ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-blue-200 text-base outline-none focus:border-blue-500 resize-none min-h-[150px]"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleGenerateAIReply(diary, student.name)}
                  disabled={isGeneratingAI}
                  className="px-4 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-200 flex items-center gap-2 disabled:opacity-50 transition-all"
                  title="AI로 답장 초안 작성하기"
                >
                  <Sparkles className="w-5 h-5" />
                  {isGeneratingAI ? 'AI가 생각하는 중...' : 'AI 베테랑 선생님의 조언 받기'}
                </button>
                <button
                  onClick={() => handleCommentSubmit(diary.id)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 text-base">{diary.teacherComment}</p>
          )}
        </div>
      ) : (
        <div>
          {commentingId === diary.id ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="따뜻한 답장을 남겨주세요..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base outline-none focus:border-pink-500 resize-none min-h-[150px]"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleGenerateAIReply(diary, student.name)}
                  disabled={isGeneratingAI}
                  className="px-4 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-200 flex items-center gap-2 disabled:opacity-50 transition-all"
                  title="AI로 답장 초안 작성하기"
                >
                  <Sparkles className="w-5 h-5" />
                  {isGeneratingAI ? 'AI가 생각하는 중...' : 'AI 베테랑 선생님의 조언 받기'}
                </button>
                <button
                  onClick={() => handleCommentSubmit(diary.id)}
                  className="px-6 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-bold hover:bg-pink-600 transition-all"
                >
                  보내기
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setCommentingId(diary.id);
                setCommentText('');
              }}
              className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 transition-all text-sm font-bold"
            >
              답장 쓰기
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">마음 일기</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('date')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'date' ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            날짜별 보기
          </button>
          <button
            onClick={() => setViewMode('student')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'student' ? 'bg-pink-50 text-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            학생별 보기
          </button>
        </div>
      </div>

      {viewMode === 'date' ? (
        <>
          <div className="flex justify-between items-center">
            <button
              onClick={handleGenerateAllAIReply}
              disabled={isGeneratingAllAI || todayDiaries.filter(d => !d.teacherComment).length === 0}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-200 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              {isGeneratingAllAI ? '전체 AI 답장 생성 중...' : '전체 AI 답장 작성'}
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.sort((a, b) => a.number - b.number).map(student => {
              const diary = todayDiaries.find(d => d.studentId === student.studentId);
              if (diary) {
                return renderDiaryCard(diary, student);
              } else {
                return (
                  <div key={student.studentId} className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                        {student.number}
                      </div>
                      <span className="font-bold text-gray-600">{student.nickname || student.name}</span>
                    </div>
                    <span className="text-red-400 font-bold text-sm">미제출</span>
                  </div>
                );
              }
            })}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none font-bold text-gray-700"
            >
              {students.map(s => (
                <option key={s.studentId} value={s.studentId}>{s.number}번 {s.nickname || s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            {last5Days.map(date => {
              const diary = diaries.find(d => d.studentId === selectedStudentId && d.date === date);
              const student = studentMap.get(selectedStudentId);
              if (!student) return null;

              return (
                <div key={date} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-32 shrink-0 pt-2">
                    <div className="font-bold text-gray-800">{date}</div>
                    <div className="text-sm font-bold mt-1">
                      {diary ? <span className="text-green-500">제출 완료</span> : <span className="text-red-400">미제출</span>}
                    </div>
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    {diary ? (
                      renderDiaryCard(diary, student)
                    ) : (
                      <div className="h-full min-h-[120px] flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6">
                        <p className="text-gray-400 font-medium">작성된 일기가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherSettings({ teacher, classes, logout }: { teacher: Teacher, classes: any[], logout: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newEmail) return;
    try {
      await updateEmail(auth.currentUser, newEmail);
      await updateDoc(doc(db, 'teachers', teacher.uid), { email: newEmail });
      alert("이메일이 변경되었습니다.");
      setNewEmail('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert("이 액션을 수행하려면 최근에 로그인한 기록이 필요합니다. 로그아웃 후 다시 로그인하여 시도해주세요.");
      } else {
        alert("이메일 변경 실패: " + error.message);
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newPassword) return;
    try {
      await updatePassword(auth.currentUser, newPassword);
      alert("비밀번호가 변경되었습니다.");
      setNewPassword('');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert("이 액션을 수행하려면 최근에 로그인한 기록이 필요합니다. 로그아웃 후 다시 로그인하여 시도해주세요.");
      } else {
        alert("비밀번호 변경 실패: " + error.message);
      }
    }
  };

  const handleWithdrawal = async () => {
    setIsDeleting(true);
    try {
      const deleteInCollection = async (col: string, field: string, val: string) => {
        const q = query(collection(db, col), where(field, '==', val));
        const snap = await getDocs(q);
        const batch = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(batch);
      };

      // 1. Delete data for each class
      for (const cls of classes) {
        const classId = cls.id;
        await Promise.all([
          deleteInCollection('students', 'classId', classId),
          deleteInCollection('dailyTasks', 'classId', classId),
          deleteInCollection('submissions', 'classId', classId),
          deleteInCollection('mindDiaries', 'classId', classId),
          deleteInCollection('topicWritings', 'classId', classId),
          deleteInCollection('shopItems', 'classId', classId),
          deleteInCollection('missionQuests', 'classId', classId),
          deleteInCollection('missionSubmissions', 'classId', classId),
          deleteInCollection('purchaseRecords', 'classId', classId),
          deleteDoc(doc(db, 'classes', classId))
        ]);
      }

      // 2. Delete teacher mappings
      const mappingSnap = await getDocs(query(collection(db, 'teacherMappings'), where('realEmail', '==', teacher.email)));
      await Promise.all(mappingSnap.docs.map(d => deleteDoc(d.ref)));

      // 3. Delete teacher info
      await deleteDoc(doc(db, 'teachers', teacher.uid));

      // 4. Delete Auth User
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }

      setShowWithdrawModal(false);
      logout(); // This will redirect to the start screen since it sets user to null
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/requires-recent-login') {
        alert("보안을 위해 로그아웃 후 다시 로그인하여 탈퇴를 진행해주세요.");
      } else {
        alert("탈퇴 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">회원정보</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">회원 정보 수정</h3>
          
          <form onSubmit={handleUpdateEmail} className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">새 이메일 주소</label>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="현재 이메일: (숨김)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none font-medium"
              />
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">변경</button>
            </div>
          </form>

          <form onSubmit={handleUpdatePassword}>
            <label className="block text-sm font-bold text-gray-700 mb-2">새 비밀번호</label>
            <div className="flex gap-2">
              <input 
                type="password" 
                placeholder="6자리 이상 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none font-medium"
              />
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">변경</button>
            </div>
          </form>
        </div>

        <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            서비스 탈퇴
          </h3>
          <p className="text-sm text-red-600 mb-6 font-medium leading-relaxed">
            탈퇴 시 본인이 생성한 모든 정보가 <strong>영구적으로 삭제</strong>됩니다.<br />
            - 선생님 계정 및 연결된 학급<br />
            - 소속된 모든 학생들의 계정 및 학습 기록<br />
            - 상점, 일기 시스템 등 모든 데이터<br />
            이 작업은 절대 복구할 수 없습니다.
          </p>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="w-full py-4 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            모든 정보 삭제 및 회원 탈퇴
          </button>
        </div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center border-t-8 border-red-500">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-4">정말 탈퇴하시겠습니까?</h3>
            <p className="text-gray-600 mb-8 font-medium leading-relaxed">
              모든 데이터는 서버에서 <strong className="text-red-600">즉시 영구 삭제</strong>되며, 복구가 불가능합니다.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                disabled={isDeleting}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold text-lg"
              >
                취소
              </button>
              <button 
                onClick={handleWithdrawal} 
                disabled={isDeleting}
                className="flex-1 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold text-lg disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    삭제 중...
                  </>
                ) : '영구 탈퇴하기'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, id }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; id?: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}

  function ClassManagement({ classes, selectedClassId, onSelectClass, students, teacher }: { classes: any[]; selectedClassId: string | null; onSelectClass: (id: string | null) => void; students: Student[]; teacher: Teacher }) {
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [classYear, setClassYear] = useState(new Date().getFullYear());
  const [classGrade, setClassGrade] = useState("");
  const [classNumber, setClassNumber] = useState("");

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null);
  const [editingStudent, setEditingStudent] = useState<{id: string, name: string} | null>(null);
  const [editingNicknameStudent, setEditingNicknameStudent] = useState<{id: string, name: string, nickname: string} | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newNickname, setNewNickname] = useState("");

  // Individual Student
  const [newId, setNewId] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newStudentNumber, setNewStudentNumber] = useState("");

  // Bulk Students
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkCount, setBulkCount] = useState("");
  const [bulkPw, setBulkPw] = useState("1234");
  const [overlapMessage, setOverlapMessage] = useState<{text: string; isError: boolean} | null>(null);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const checkBulkOverlap = async () => {
    setOverlapMessage(null);
    const count = parseInt(bulkCount);
    if (!bulkPrefix || !count || count < 1) {
       setOverlapMessage({ text: "접두사와 올바른 생성 인원을 입력해주세요.", isError: true });
       return;
    }
    setOverlapMessage({ text: "확인 중...", isError: false });
    
    let hasOverlap = false;
    for (let i = 1; i <= count; i++) {
        const genId = `${bulkPrefix}${i}`;
        if (await checkStudentExists(genId)) {
           hasOverlap = true;
           break;
        }
    }
    if (hasOverlap) {
       setOverlapMessage({ text: "⚠️ 이미 존재하는 아이디가 포함되어 있습니다. 다른 반복 아이디를 사용하세요.", isError: true });
    } else {
       setOverlapMessage({ text: "✅ 중복된 아이디가 없습니다. 생성이 가능합니다.", isError: false });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classYear || !classGrade || !classNumber) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    const newClassId = `class_${teacher.uid}_${Date.now()}`;
    const newClass = {
      id: newClassId,
      teacherUid: teacher.uid,
      year: classYear,
      grade: parseInt(classGrade),
      classNumber: parseInt(classNumber),
      name: `${classYear}학년도 ${classGrade}학년 ${classNumber}반`
    };
    try {
      await setDoc(doc(db, "classes", newClassId), newClass);
      setShowAddClassModal(false);
      setClassGrade("");
      setClassNumber("");
      onSelectClass(newClassId);
    } catch (e) {
      alert("학급 생성 오류");
    }
  };

  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);

  const handleDeleteClass = async () => {
    if (!selectedClassId) return;
    
    try {
      // 1. Delete all students in the class
      const studentsSnap = await getDocs(query(collection(db, "students"), where("classId", "==", selectedClassId)));
      for (const sDoc of studentsSnap.docs) {
        await deleteDoc(doc(db, "students", sDoc.id));
      }
      
      // 2. Delete the class itself
      await deleteDoc(doc(db, "classes", selectedClassId));
      
      onSelectClass(null);
      setShowDeleteClassModal(false);
    } catch (e) {
      console.error(e);
      alert("학급 삭제 중 오류가 발생했습니다.");
    }
  };

  const checkStudentExists = async (id: string) => {
    const snap = await getDoc(doc(db, "students", id));
    return snap.exists();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    
    if (await checkStudentExists(newId)) {
      alert("이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.");
      return;
    }

    const n = parseInt(newStudentNumber);
    const student: Student = {
      studentId: newId,
      password: newPw,
      name: `${selectedClass.grade}학년 ${selectedClass.classNumber}반 ${n}번`, // Generated name
      number: n,
      grade: selectedClass.grade || 1,
      class: selectedClass.classNumber || 1,
      classId: selectedClassId as string,
      school: teacher.school || "",
      xp: 0,
      level: 1
    };

    try {
      await setDoc(doc(db, "students", newId), student);
      setShowAddStudentModal(false);
      setNewStudentNumber(""); setNewId(""); setNewPw("");
    } catch (e) {
      alert("학생 등록 실패: " + (e instanceof Error ? e.message : ""));
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedClass.year || !selectedClass.grade || !selectedClass.classNumber) {
      alert("학급 정보(학년도, 학년, 반)가 불완전합니다.");
      return;
    }
    const count = parseInt(bulkCount);
    if (!count || count < 1) return;
    
    if (bulkPw.length > 0 && bulkPw.length < 4) {
      alert("비밀번호는 4자리 이상이어야 합니다.");
      return;
    }

    const yearStr = selectedClass.year.toString().slice(-2); // 뒤의 두 자리
    const gradeStr = selectedClass.grade.toString(); // 학년
    const classStr = selectedClass.classNumber.toString().padStart(2, "0"); // 반 (두 자리)

    const newStudents: Student[] = [];
    const generatedIds: string[] = [];

    for (let i = 1; i <= count; i++) {
        const numStr = i.toString(); // Just numbers without padding, or whatever is simple
        const genId = `${bulkPrefix}${numStr}`;
        generatedIds.push(genId);
        
        const pwd = bulkPw || genId;
        const studentName = `${i}번`;

        newStudents.push({
        studentId: genId,
        password: pwd,
        name: studentName,
        number: i,
        grade: selectedClass.grade,
        class: selectedClass.classNumber,
        classId: selectedClassId as string,
        school: teacher.school || "",
        xp: 0,
        level: 1
        });
    }

    let hasOverlap = false;
    for (const id of generatedIds) {
        if (await checkStudentExists(id)) {
        hasOverlap = true;
        break;
        }
    }

    if (hasOverlap) {
        alert("생성하려는 반복 아이디 중복이 발생했습니다.\n이미 데이터베이스에 존재하는 아이디가 있습니다.\n다른 반복 아이디를 사용해주세요.");
        return;
    }

    try {
      for (const st of newStudents) {
        await setDoc(doc(db, "students", st.studentId), st);
      }
      setShowBulkAddModal(false);
      setBulkPrefix("");
      setBulkCount("");
      setBulkPw("1234");
      alert(`${count}명의 학생이 일괄 등록되었습니다.`);
    } catch (e) {
      alert("일괄 등록 실패");
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const deleteInCollectionByStudentId = async (col: string) => {
        const q = query(collection(db, col), where('studentId', '==', studentToDelete.id));
        const snap = await getDocs(q);
        const batch = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(batch);
      };

      await Promise.all([
        deleteInCollectionByStudentId('submissions'),
        deleteInCollectionByStudentId('mindDiaries'),
        deleteInCollectionByStudentId('topicWritings'),
        deleteInCollectionByStudentId('missionSubmissions'),
        deleteInCollectionByStudentId('purchaseRecords'),
      ]);
      await deleteDoc(doc(db, "students", studentToDelete.id));
      
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `students/${studentToDelete?.id}`);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await updateDoc(doc(db, "students", editingStudent.id), { password: newPassword });
      setShowPasswordModal(false);
      setEditingStudent(null);
      setNewPassword("");
      alert("비밀번호가 변경되었습니다.");
    } catch (e) {
      alert("비밀번호 변경 실패: " + (e instanceof Error ? e.message : ""));
    }
  };

  const handleNicknameChange = async (studentId: string, newNickname: string) => {
    try {
      await updateDoc(doc(db, 'students', studentId), { nickname: newNickname });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "students");
      alert("닉네임 변경 실패");
    }
  };

  const handleLevelChange = async (studentId: string, currentLevel: number, newLevelStr: string) => {
    const newLevel = parseInt(newLevelStr);
    if (isNaN(newLevel) || newLevel === currentLevel) return;
    
    // Set XP to the minimum required for the new level
    const targetXp = LEVEL_THRESHOLDS[newLevel - 1];

    try {
      await updateDoc(doc(db, "students", studentId), {
        level: newLevel,
        xp: targetXp
      });
      alert(`레벨이 ${newLevel}로 변경되었습니다.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "students");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-bold text-gray-500 mr-2">학급 목록:</span>
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectClass(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedClassId === c.id ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c.name}
            </button>
          ))}
          {classes.length === 0 && <span className="text-gray-400 italic text-sm">등록된 학급이 없습니다.</span>}
        </div>
        <button
          onClick={() => setShowAddClassModal(true)}
          className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-2 rounded-xl text-sm font-bold hover:bg-green-200 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> 학급 생성
        </button>
      </div>

      {selectedClassId && selectedClass ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h2 className="text-2xl font-bold">{selectedClass.name} 학생 관리 ({students.length}명)</h2>
              <button 
                onClick={() => setShowDeleteClassModal(true)} 
                className="text-sm font-bold bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                title="학급 삭제"
              >
                학급 삭제
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkAddModal(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 font-bold text-sm"
              >
                <Users className="w-4 h-4" /> 학생 일괄 등록
              </button>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold text-sm"
              >
                <UserPlus className="w-4 h-4" /> 개별 학생 추가
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">번호</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">닉네임</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">아이디</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">레벨</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">경험치</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.sort((a, b) => a.number - b.number).map(s => (
                  <tr key={s.studentId} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4 font-bold">{s.number}번</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{s.nickname || '-'}</span>
                        <button
                          onClick={() => {
                            setEditingNicknameStudent({ id: s.studentId, name: s.name, nickname: s.nickname || '' });
                            setNewNickname(s.nickname || '');
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
                        >
                          수정
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono">{s.studentId}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <RankBadge level={s.level} />
                    </td>
                    <td className="px-6 py-4 text-gray-500">{s.xp} XP</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingStudent({ id: s.studentId, name: s.name });
                          setNewPassword("");
                          setShowPasswordModal(true);
                        }}
                        className="px-3 py-1.5 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        비밀번호
                      </button>
                      <button
                        onClick={() => {
                          setStudentToDelete({ id: s.studentId, name: s.name });
                          setShowDeleteModal(true);
                        }}
                        className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
                        title="학생 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                현재 등록된 학생이 없습니다. 학생 등록 버튼을 눌러 추가해주세요.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          위에서 학급을 선택하거나 새 학급을 생성해주세요.
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-6">새 학급 생성</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학년도</label>
                <input type="number" value={classYear} onChange={e => setClassYear(parseInt(e.target.value))} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                  <input type="number" value={classGrade} onChange={e => setClassGrade(e.target.value)} required min="1" max="6" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" placeholder="예: 4" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">반</label>
                  <input type="number" value={classNumber} onChange={e => setClassNumber(e.target.value)} required min="1" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none" placeholder="예: 3" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddClassModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">취소</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">생성하기</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-2">개별 학생 등록</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">이름은 입력한 번호로 대체됩니다.</p>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학생 번호</label>
                <input type="number" value={newStudentNumber} onChange={e => setNewStudentNumber(e.target.value)} required min="1" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" placeholder="번호 입력 (예: 1)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">로그인 아이디</label>
                <input type="text" value={newId} onChange={e => setNewId(e.target.value)} required minLength={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" placeholder="사용할 아이디" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">초기 비밀번호</label>
                <input type="text" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all" placeholder="초기 비밀번호" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddStudentModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-600">취소</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold">등록하기</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAddModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-2">학생 일괄 등록</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-700">등록 규칙:</span><br/>반복아이디 + 번호<br/>
              예) wg1, wg2, wg3 ...
            </p>
            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">반복아이디 (접두사)</label>
                <div className="flex gap-2">
                  <input type="text" value={bulkPrefix} onChange={e => {setBulkPrefix(e.target.value); setOverlapMessage(null);}} required className="flex-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="예: wg" />
                  <button type="button" onClick={checkBulkOverlap} className="bg-gray-100 text-gray-700 font-bold px-3 rounded-xl text-sm shrink-0 hover:bg-gray-200 transition-colors">중복 확인</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">몇 번까지 등록하시겠습니까?</label>
                <input type="number" value={bulkCount} onChange={e => {setBulkCount(e.target.value); setOverlapMessage(null);}} required min="1" max="100" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="예: 25" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공통 비밀번호</label>
                <input type="text" value={bulkPw} onChange={e => setBulkPw(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="기본 비밀번호 (1234)" />
              </div>
              
              {overlapMessage && (
                <div className={`text-sm font-bold p-3 rounded-xl ${overlapMessage.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                   {overlapMessage.text}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => {setShowBulkAddModal(false); setOverlapMessage(null);}} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">취소</button>
                <button type="submit" disabled={overlapMessage?.isError} className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors ${overlapMessage?.isError ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>일괄 등록</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Student Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">학생 삭제</h3>
            <p className="text-gray-500 mb-6 font-medium text-sm">정말 선택한 학생을 삭제하시겠습니까? 관련된 데이터가 모두 영구 삭제됩니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold">취소</button>
              <button onClick={handleDeleteStudent} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold">삭제하기</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Class Modal */}
      {showDeleteClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">학급 삭제</h3>
            <p className="text-gray-500 mb-6 font-medium text-sm">정말 이 학급을 삭제하시겠습니까?<br/>학급 삭제 시 소속된 <span className="font-bold text-red-600">모든 학생 정보와 학습 기록이 영구적으로 삭제</span>됩니다.<br/><br/>이 작업은 취소할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteClassModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold">취소</button>
              <button onClick={handleDeleteClass} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold">삭제하기</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">비밀번호 변경</h3>
            <p className="text-sm text-gray-500 mb-4 font-medium">선택한 학생의 새 비밀번호를 입력하세요.</p>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-bold text-lg"
                required
              />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowPasswordModal(false); setEditingStudent(null); }} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-600">취소</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">변경하기</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Nickname Edit Modal */}
      {editingNicknameStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-2">닉네임 수정</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">선택한 학생의 새 닉네임을 입력하세요.</p>
            <input 
              type="text" 
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-lg mb-6 transition-all"
              placeholder="2자 이상 10자 이하"
              maxLength={10}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setEditingNicknameStudent(null)} 
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  if (newNickname.trim().length < 2) {
                    alert('닉네임을 2자 이상 입력해주세요.');
                    return;
                  }
                  handleNicknameChange(editingNicknameStudent.id, newNickname.trim());
                  setEditingNicknameStudent(null);
                }}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-sm"
              >
                저장하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


function TaskSetting({ dailyTask, classId, students }: { dailyTask: DailyTask | null; classId: string; students: Student[] }) {
  const [enableMindDiary, setEnableMindDiary] = useState(dailyTask?.enableMindDiary ?? true);
  const [enableLiteracy, setEnableLiteracy] = useState(dailyTask?.enableLiteracy ?? true);
  const [enableMath, setEnableMath] = useState(dailyTask?.enableMath ?? true);
  const [enableTopicWriting, setEnableTopicWriting] = useState(dailyTask?.enableTopicWriting ?? true);
  const [enableTyping, setEnableTyping] = useState(dailyTask?.enableTyping ?? true);
  const [enableMyMonster, setEnableMyMonster] = useState(dailyTask?.enableMyMonster ?? true);
  const [typingGrade, setTypingGrade] = useState(dailyTask?.typingConfig?.grade ?? 1);
  const [showTypingSettings, setShowTypingSettings] = useState(false);
  const [topicWritingMode, setTopicWritingMode] = useState<'ai' | 'manual'>(dailyTask?.topicWritingConfig?.mode ?? 'ai');
  const [customTopic, setCustomTopic] = useState(dailyTask?.topicWritingConfig?.customTopic ?? '');
  const [showTopicWritingSettings, setShowTopicWritingSettings] = useState(false);
  const [showGeneralMathSettings, setShowGeneralMathSettings] = useState(false);
  const [showIndividualMathSettings, setShowIndividualMathSettings] = useState(false);
  const [showMathPreview, setShowMathPreview] = useState(false);
  const [showMindDiaryPreview, setShowMindDiaryPreview] = useState(false);
  const [showTopicWritingPreview, setShowTopicWritingPreview] = useState(false);

  const [coreTasks, setCoreTasks] = useState<string[]>(dailyTask?.coreTasks || []);

  const handleCoreTaskToggle = (taskId: string) => {
    setCoreTasks(prev => {
      if (prev.includes(taskId)) return prev.filter(id => id !== taskId);
      if (prev.length >= 2) {
        alert('핵심 과제는 최대 2개까지만 설정할 수 있습니다.');
        return prev;
      }
      return [...prev, taskId];
    });
  };

  const [selectedGrade, setSelectedGrade] = useState(dailyTask?.mathConfig?.grade || 1);
  const [selectedSemester, setSelectedSemester] = useState(dailyTask?.mathConfig?.semester || 1);
  const [selectedUnit, setSelectedUnit] = useState(dailyTask?.mathConfig?.unit || '');
  const [selectedArea, setSelectedArea] = useState(dailyTask?.mathConfig?.area || '');
  const [mathCount, setMathCount] = useState<number>(dailyTask?.mathConfig?.problemCount || 20);
  const [mathMode, setMathMode] = useState<'manual' | 'sequential'>(dailyTask?.mathConfig?.mode || 'manual');
  const [studentMathConfigs, setStudentMathConfigs] = useState<Record<string, any>>(dailyTask?.studentMathConfigs || {});

  const units = CURRICULUM[selectedGrade as keyof typeof CURRICULUM]?.[selectedSemester as 1|2] || [];
  const areas = units.find(u => u.id === selectedUnit)?.areas || [];

  useEffect(() => {
    if (units.length > 0 && !units.find(u => u.id === selectedUnit)) {
      setSelectedUnit(units[0].id);
    }
  }, [selectedGrade, selectedSemester, units, selectedUnit]);

  useEffect(() => {
    if (areas.length > 0 && !areas.find(a => a.id === selectedArea)) {
      setSelectedArea(areas[0].id);
    }
  }, [selectedUnit, areas, selectedArea]);

  const handleSaveTask = async () => {
    const today = getTodayDateString();
    const task: DailyTask = {
      classId,
      date: today,
      enableMindDiary,
      enableLiteracy,
      enableMath,
      enableTopicWriting,
      enableTyping,
      enableMyMonster,
      topicWritingConfig: {
        mode: topicWritingMode,
        ...(topicWritingMode === 'manual' ? { customTopic } : {})
      },
      mathConfig: {
        mode: mathMode,
        grade: selectedGrade,
        semester: selectedSemester,
        unit: selectedUnit,
        area: selectedArea,
        problemCount: mathCount
      },
      studentMathConfigs,
      typingConfig: {
        grade: typingGrade
      },
      coreTasks
    };

    try {
      await setDoc(doc(db, 'dailyTasks', `${classId}_${today}`), task);
      alert('학습 설정이 저장되었습니다!');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `dailyTasks/${classId}_${today}`);
      alert('설정 실패: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="space-y-6 relative">
      <h2 className="text-2xl font-bold">학습 설정</h2>
      
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8 p-4 bg-blue-50 rounded-2xl">
          <div className="p-3 bg-blue-600 rounded-xl text-white">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-bold">오늘의 날짜</p>
            <p className="text-xl font-bold text-gray-800">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
        </div>

        <div className="mb-8 p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-500 rounded-xl text-white shadow-sm">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">핵심 과제 설정 (최대 2개)</p>
              <p className="text-sm text-gray-500 font-medium">핵심 과제로 지정된 과제는 20 XP (수학은 정답률에 따라 0~25 XP 차등 지급)를 제공하며, 기본 과제는 5 XP를 제공합니다.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'math', label: '수학 문제', enabled: enableMath },
              { id: 'mindDiary', label: '마음 일기', enabled: enableMindDiary },
              { id: 'topicWriting', label: '주제 글쓰기', enabled: enableTopicWriting },
              { id: 'literacy', label: '문해력 기르기', enabled: enableLiteracy },
              { id: 'typing', label: '타자연습', enabled: enableTyping }
            ].filter(task => task.enabled).map(task => (
              <button
                key={task.id}
                onClick={() => handleCoreTaskToggle(task.id)}
                className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${
                  coreTasks.includes(task.id) 
                    ? 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-400 hover:border-yellow-200 hover:text-yellow-600'
                }`}
              >
                {coreTasks.includes(task.id) && <Star className="inline w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />}
                {task.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <ToggleRow label="나만의 몬스터" enabled={enableMyMonster} onChange={setEnableMyMonster} />
          <ToggleRow label="마음일기" enabled={enableMindDiary} onChange={setEnableMindDiary} onPreview={() => setShowMindDiaryPreview(true)} />
          <ToggleRow label="문해력 기르기" enabled={enableLiteracy} onChange={setEnableLiteracy} />
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg text-gray-800">주제 글쓰기</div>
              {enableTopicWriting && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowTopicWritingSettings(!showTopicWritingSettings)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-200 transition-all"
                  >
                    설정
                  </button>
                  <button 
                    onClick={() => setShowTopicWritingPreview(true)}
                    className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all"
                  >
                    미리보기
                  </button>
                </div>
              )}
            </div>
            <div 
              onClick={() => setEnableTopicWriting(!enableTopicWriting)}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${enableTopicWriting ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <motion.div 
                layout 
                className="w-6 h-6 bg-white rounded-full shadow-md" 
                animate={{ x: enableTopicWriting ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg text-gray-800">오늘의 수학 문제 풀기</div>
              {enableMath && (
                <button 
                  onClick={() => setShowGeneralMathSettings(!showGeneralMathSettings)}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-200 transition-all"
                >
                  전체 설정
                </button>
              )}
            </div>
            <div 
              onClick={() => setEnableMath(!enableMath)}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${enableMath ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <motion.div 
                layout 
                className="w-6 h-6 bg-white rounded-full shadow-md" 
                animate={{ x: enableMath ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="font-bold text-lg text-gray-800">타자연습</div>
            </div>
            <div 
              onClick={() => setEnableTyping(!enableTyping)}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${enableTyping ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <motion.div 
                layout 
                className="w-6 h-6 bg-white rounded-full shadow-md" 
                animate={{ x: enableTyping ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        </div>



        <AnimatePresence>
          {showTopicWritingSettings && enableTopicWriting && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-800 mb-4">주제 글쓰기 설정</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="topicMode" 
                        value="ai" 
                        checked={topicWritingMode === 'ai'} 
                        onChange={() => setTopicWritingMode('ai')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-bold text-gray-700">AI 자동 생성 (매일 새로운 주제)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="topicMode" 
                        value="manual" 
                        checked={topicWritingMode === 'manual'} 
                        onChange={() => setTopicWritingMode('manual')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-bold text-gray-700">선생님 직접 입력</span>
                    </label>
                  </div>
                  
                  {topicWritingMode === 'manual' && (
                    <div className="mt-4">
                      <label className="block text-sm font-bold text-blue-600 mb-2">오늘의 주제 입력</label>
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="예: 주말에 가족과 함께 한 일 중 가장 기억에 남는 것은?"
                        className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showGeneralMathSettings && enableMath && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-blue-800">수학 문제 풀기 설정</h3>
                  <button 
                    onClick={() => setShowMathPreview(true)}
                    className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-sm"
                  >
                    학습지 확인하기
                  </button>
                </div>
                <div className="mb-6 flex gap-4 bg-white p-4 rounded-xl border border-blue-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="mathMode" 
                      value="manual" 
                      checked={mathMode === 'manual'} 
                      onChange={() => setMathMode('manual')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-bold text-gray-700">직접 설정 (영역 수동 선택)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="mathMode" 
                      value="sequential" 
                      checked={mathMode === 'sequential'} 
                      onChange={() => setMathMode('sequential')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-bold text-gray-700">자동 설정 (80점 이상 시 다음 영역으로)</span>
                  </label>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <label className="text-sm font-bold text-blue-600">문제 수</label>
                  <select 
                    value={mathCount}
                    onChange={(e) => setMathCount(Number(e.target.value))}
                    className="px-4 py-2 rounded-xl border-2 border-blue-100 outline-none focus:border-blue-500 font-bold text-gray-700 bg-white"
                  >
                    <option value={6}>6개</option>
                    <option value={12}>12개</option>
                    <option value={16}>16개</option>
                    <option value={20}>20개</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-blue-600">학년 선택</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1,2,3,4,5,6].map(g => (
                        <button
                          key={g}
                          onClick={() => setSelectedGrade(g)}
                          className={`py-3 rounded-xl border-2 transition-all font-bold ${selectedGrade === g ? 'border-blue-500 bg-white text-blue-600 shadow-sm' : 'border-blue-100 text-blue-400 hover:border-blue-200 bg-blue-50/50'}`}
                        >
                          {g}학년
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-blue-600">학기 선택</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2].map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedSemester(s)}
                          className={`py-3 rounded-xl border-2 transition-all font-bold ${selectedSemester === s ? 'border-blue-500 bg-white text-blue-600 shadow-sm' : 'border-blue-100 text-blue-400 hover:border-blue-200 bg-blue-50/50'}`}
                        >
                          {s}학기
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-blue-600">단원 선택</label>
                    <select
                      value={selectedUnit}
                      onChange={e => setSelectedUnit(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none font-bold bg-white text-gray-800"
                    >
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-blue-600">영역 선택</label>
                    <select
                      value={selectedArea}
                      onChange={e => setSelectedArea(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none font-bold ${mathMode === 'sequential' ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-blue-100 focus:border-blue-500 text-gray-800'}`}
                      disabled={mathMode === 'sequential'}
                    >
                      {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {mathMode === 'sequential' && (
                      <p className="text-xs text-gray-500 mt-1">자동 설정 모드에서는 학생의 진도에 따라 영역이 자동 배정됩니다.</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-t border-blue-100 pt-6">
                  <button onClick={() => setShowIndividualMathSettings(!showIndividualMathSettings)} className="text-md font-bold text-blue-800 mb-4 flex items-center gap-2 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                    학생별 개별 설정 {showIndividualMathSettings ? '접기' : '열기'} 
                  </button>
                  {showIndividualMathSettings && (
                    <div className="space-y-3">
                      {students.map(student => {
                        const config = studentMathConfigs[student.studentId] || null;
                        const isCustom = config !== null;
                        
                        const sUnits = isCustom ? (CURRICULUM[config.grade as keyof typeof CURRICULUM]?.[config.semester as 1|2] || []) : [];
                        const sAreas = isCustom ? (sUnits.find(u => u.id === config.unit)?.areas || []) : [];

                        return (
                          <div key={student.studentId} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-xl border border-blue-50">
                            <div className="w-24 font-bold text-gray-700">{student.name}</div>
                            <div className="flex-1 flex flex-wrap gap-2">
                              {isCustom ? (
                                <>
                                  <select value={config.mode || 'manual'} onChange={e => setStudentMathConfigs({...studentMathConfigs, [student.studentId]: {...config, mode: e.target.value as 'manual'|'sequential'}})} className="px-2 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500">
                                    <option value="manual">수동</option>
                                    <option value="sequential">자동</option>
                                  </select>
                                  <select value={config.problemCount || 20} onChange={e => setStudentMathConfigs({...studentMathConfigs, [student.studentId]: {...config, problemCount: Number(e.target.value)}})} className="px-2 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500">
                                    <option value={6}>6개</option>
                                    <option value={12}>12개</option>
                                    <option value={16}>16개</option>
                                    <option value={20}>20개</option>
                                  </select>
                                  <select value={config.grade} onChange={e => setStudentMathConfigs({...studentMathConfigs, [student.studentId]: {...config, grade: Number(e.target.value), unit: CURRICULUM[Number(e.target.value) as keyof typeof CURRICULUM]?.[config.semester as 1|2]?.[0]?.id || ''}})} className="px-2 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500">
                                    {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}학년</option>)}
                                  </select>
                                  <select value={config.semester} onChange={e => setStudentMathConfigs({...studentMathConfigs, [student.studentId]: {...config, semester: Number(e.target.value), unit: CURRICULUM[config.grade as keyof typeof CURRICULUM]?.[Number(e.target.value) as 1|2]?.[0]?.id || ''}})} className="px-2 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500">
                                    {[1,2].map(s => <option key={s} value={s}>{s}학기</option>)}
                                  </select>
                                  <select value={config.unit} onChange={e => setStudentMathConfigs({...studentMathConfigs, [student.studentId]: {...config, unit: e.target.value, area: sUnits.find(u => u.id === e.target.value)?.areas[0]?.id || ''}})} className="px-2 py-1 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500 flex-1 min-w-[120px]">
                                    {sUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                  </select>
                                  <select value={config.area} onChange={e => setStudentMathConfigs({...studentMathConfigs, [student.studentId]: {...config, area: e.target.value}})} disabled={config.mode === 'sequential'} className={`px-2 py-1 border rounded-lg text-sm font-bold outline-none flex-1 min-w-[120px] ${config.mode === 'sequential' ? 'bg-gray-100 border-gray-200 text-gray-400' : 'border-gray-200 text-gray-700 focus:border-blue-500'}`}>
                                    {sAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500 font-medium">기본 설정 따름</span>
                              )}
                            </div>
                            <button onClick={() => {
                              if (isCustom) {
                                const newConfigs = {...studentMathConfigs};
                                delete newConfigs[student.studentId];
                                setStudentMathConfigs(newConfigs);
                              } else {
                                setStudentMathConfigs({
                                  ...studentMathConfigs,
                                  [student.studentId]: {
                                    mode: mathMode,
                                    grade: selectedGrade,
                                    semester: selectedSemester,
                                    unit: selectedUnit,
                                    area: selectedArea
                                  }
                                });
                              }
                            }} className={`text-sm font-bold px-3 py-1 rounded-lg transition-all ${isCustom ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                              {isCustom ? '기본 설정으로' : '개별 설정'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSaveTask}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
        >
          {dailyTask ? '학습 설정 변경하기' : '오늘의 학습 배포하기'}
        </button>

        {dailyTask && (
          <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500 w-6 h-6" />
              <p className="text-green-700 font-bold">현재 학습 설정이 적용 중입니다.</p>
            </div>
            <div className="pl-9 text-sm text-green-600 font-medium leading-relaxed">
              나만의 몬스터: {dailyTask.enableMyMonster !== false ? '켜짐' : '꺼짐'} | 
              마음일기: {dailyTask.enableMindDiary !== false ? '켜짐' : '꺼짐'} | 
              문해력: {dailyTask.enableLiteracy !== false ? '켜짐' : '꺼짐'} | 
              주제 글쓰기: {dailyTask.enableTopicWriting !== false ? '켜짐' : '꺼짐'} | 
              타자연습: {dailyTask.enableTyping !== false ? '켜짐' : '꺼짐'} | 
              수학: {dailyTask.enableMath !== false ? `켜짐 (${dailyTask.mathConfig.grade}학년 ${dailyTask.mathConfig.semester}학기 ${
                (() => {
                  if (dailyTask.mathConfig.mode === 'sequential') {
                    const unit = CURRICULUM[dailyTask.mathConfig.grade as keyof typeof CURRICULUM]?.[dailyTask.mathConfig.semester as 1|2]?.find(u => u.id === dailyTask.mathConfig.unit);
                    return `${unit?.name || ''} (자동)`;
                  } else {
                    const units = CURRICULUM[dailyTask.mathConfig.grade as keyof typeof CURRICULUM]?.[dailyTask.mathConfig.semester as 1|2] || [];
                    for (const u of units) {
                      const area = u.areas.find(a => a.id === dailyTask.mathConfig.area);
                      if (area) return area.name;
                    }
                    return dailyTask.mathConfig.area;
                  }
                })()
              })` : '꺼짐'}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMathPreview && (
          <MathPreviewModal 
            grade={selectedGrade} 
            semester={selectedSemester}
            area={selectedArea} 
            onClose={() => setShowMathPreview(false)} 
          />
        )}
        {showMindDiaryPreview && (
          <MindDiaryPreviewModal onClose={() => setShowMindDiaryPreview(false)} />
        )}
        {showTopicWritingPreview && (
          <TopicWritingPreviewModal onClose={() => setShowTopicWritingPreview(false)} mode={topicWritingMode} customTopic={customTopic} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MathPreviewModal({ grade, semester, area, onClose }: { grade: number, semester: number, area: string, onClose: () => void }) {
  const [problems, setProblems] = useState<{ question: string; correctAnswer: string }[]>([]);
  const [prompt, setPrompt] = useState<string>('');

  useEffect(() => {
    // Dynamically import generateProblems to avoid circular dependencies if any, or just use it if already imported
    import('../lib/mathGenerator').then(module => {
      setProblems(module.generateProblems(grade, semester, area));
      setPrompt(module.getMathPrompt(area));
    });
  }, [grade, semester, area]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-blue-50 rounded-3xl p-4 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
      >
        <header className="flex justify-between items-center mb-6 px-4">
          <h2 className="text-2xl font-black text-gray-800">학습지 미리보기</h2>
          <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
            <XCircle className="w-8 h-8 text-blue-600" />
          </button>
        </header>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-blue-100 border-2 border-white space-y-8">
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-blue-800">{prompt}</h3>
          </div>
          
          <div className="w-full">
            <MathProblemList problems={problems} mode="preview" area={area} />
          </div>
        </div>

        <div className="mt-8 flex justify-end px-4">
          <button onClick={onClose} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToggleRow({ label, enabled, onChange, onPreview }: { label: string, enabled: boolean, onChange: (v: boolean) => void, onPreview?: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="font-bold text-lg text-gray-800">{label}</div>
        {onPreview && enabled && (
          <button 
            onClick={onPreview}
            className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-200 transition-all"
          >
            미리보기
          </button>
        )}
      </div>
      <div 
        onClick={() => onChange(!enabled)}
        className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <motion.div 
          layout 
          className="w-6 h-6 bg-white rounded-full shadow-md" 
          animate={{ x: enabled ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );
}

function ResultsReport({ students, submissions, dailyTask }: { students: Student[]; submissions: Submission[]; dailyTask: DailyTask | null }) {
  const [reportTab, setReportTab] = useState<'today' | 'cumulative'>('today');
  const [subject, setSubject] = useState<'math' | 'literacy'>('math');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');

  const mathConfig = dailyTask?.mathConfig;
  const unitInfo = mathConfig ? CURRICULUM[mathConfig.grade as keyof typeof CURRICULUM]?.[mathConfig.semester as 1|2]?.find(u => u.id === mathConfig.unit) : null;
  const areaInfo = unitInfo?.areas.find(a => a.id === mathConfig?.area);

  const today = getTodayDateString();
  const subjectSubmissions = submissions.filter(s => s.type === subject);
  const todaySubmissions = subjectSubmissions.filter(s => s.date === today);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return formatDateToKSTString(d);
  });

  // Chart data: Average score per day for the last 7 days (class or individual)
  const chartData = last7Days.map(date => {
    let daySubs = subjectSubmissions.filter(s => s.date === date);
    
    if (selectedStudentId !== 'all') {
      daySubs = daySubs.filter(s => s.studentId === selectedStudentId);
    }

    const avgScore = daySubs.length > 0 
      ? Math.round(daySubs.reduce((acc, s) => acc + s.score, 0) / daySubs.length) 
      : 0;
    return {
      date: date.substring(5), // MM-DD
      점수: avgScore
    };
  });

  const selectedStudentName = selectedStudentId === 'all' 
    ? '학급 평균' 
    : (() => {
        const s = students.find(s => s.studentId === selectedStudentId);
        return s ? (s.nickname || s.name) : '';
      })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <div className="flex gap-4">
          <button onClick={() => setReportTab('today')} className={`text-lg font-bold px-4 py-2 rounded-xl transition-all ${reportTab === 'today' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>오늘의 학습 현황</button>
          <button onClick={() => setReportTab('cumulative')} className={`text-lg font-bold px-4 py-2 rounded-xl transition-all ${reportTab === 'cumulative' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>누적 학습 현황</button>
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as 'math' | 'literacy')}
          className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-700 bg-white"
        >
          <option value="math">수학</option>
          <option value="literacy">문해력</option>
        </select>
      </div>

      {subject === 'math' && mathConfig && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-wrap gap-x-8 gap-y-2 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">현재 설정된 학습 범위</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-500">학년/학기:</span>
            <span className="text-base font-black text-blue-700">{mathConfig.grade}학년 {mathConfig.semester}학기</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-500">단원:</span>
            <span className="text-base font-black text-blue-700">{unitInfo?.name || '설정 안됨'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-500">영역:</span>
            <span className="text-base font-black text-blue-700">{areaInfo?.name || '설정 안됨'}</span>
          </div>
        </div>
      )}

      {reportTab === 'today' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="총 인원" value={`${students.length}명`} color="blue" />
            <StatCard label="참여 인원" value={`${todaySubmissions.length}명`} color="green" />
            <StatCard label="미참여 인원" value={`${students.length - todaySubmissions.length}명`} color="red" />
            <StatCard label="평균 점수" value={`${todaySubmissions.length > 0 ? Math.round(todaySubmissions.reduce((acc, s) => acc + s.score, 0) / todaySubmissions.length) : 0}점`} color="purple" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">번호</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">닉네임</th>
                  {subject === 'math' && <th className="px-6 py-4 font-semibold text-gray-600">학습 범위</th>}
                  <th className="px-6 py-4 font-semibold text-gray-600">참여 여부</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">점수</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">정답/오답</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.sort((a, b) => a.number - b.number).map(s => {
                  const sub = todaySubmissions.find(sub => sub.studentId === s.studentId);
                  return (
                    <tr key={s.studentId} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">{s.number}번</td>
                      <td className="px-6 py-4 font-bold">{s.nickname || s.name}</td>
                      {subject === 'math' && (
                        <td className="px-6 py-4 text-xs">
                          {sub ? (
                            <div className="flex flex-col">
                              {sub.grade ? (
                                <>
                                  <span className="font-bold text-blue-600">{sub.grade}학년 {sub.semester}학기</span>
                                  <span className="text-gray-500">{sub.unitName || '-'}</span>
                                  <span className="text-gray-400">{sub.areaName || '-'}</span>
                                </>
                              ) : (
                                <span className="text-gray-400 italic">기록 없음</span>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {sub ? (
                          <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 완료</span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" /> 미참여</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-lg">{sub ? `${sub.score}점` : '-'}</td>
                      <td className="px-6 py-4">
                        {sub ? (
                          <div className="flex gap-2 text-sm">
                            <span className="text-blue-600">정답: {sub.answers.filter(a => a.isCorrect).length}</span>
                            <span className="text-red-500">오답: {sub.answers.filter(a => !a.isCorrect).length}</span>
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportTab === 'cumulative' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">최근 7일 {selectedStudentName} 점수 추이</h3>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 outline-none text-sm font-bold text-gray-700 bg-white"
              >
                <option value="all">학급 전체 평균</option>
                {students.sort((a, b) => a.number - b.number).map(s => (
                  <option key={s.studentId} value={s.studentId}>{s.number}번 {s.nickname || s.name}</option>
                ))}
              </select>
            </div>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#2563EB', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="점수" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">누적 학습 현황 ({subject === 'math' ? '수학' : '문해력'})</h3>
              <p className="text-sm text-gray-500 mt-1">학생들의 최근 7일 점수와 주간 평균, 도달 단계를 확인합니다. 학생을 클릭하면 위 그래프에 반영됩니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap">번호</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap">닉네임</th>
                    {subject === 'math' && <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap">수학 영역</th>}
                    {last7Days.map(date => (
                      <th key={date} className="px-4 py-4 font-semibold text-gray-600 text-center whitespace-nowrap">{date.substring(5)}</th>
                    ))}
                    <th className="px-6 py-4 font-semibold text-blue-600 whitespace-nowrap">주간 평균</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.sort((a, b) => a.number - b.number).map(s => {
                    const studentSubs = subjectSubmissions.filter(sub => sub.studentId === s.studentId);
                    
                    // Calculate weekly average
                    const last7DaysSubs = studentSubs.filter(sub => last7Days.includes(sub.date));
                    const weeklyAvg = last7DaysSubs.length > 0 
                      ? Math.round(last7DaysSubs.reduce((acc, sub) => acc + sub.score, 0) / last7DaysSubs.length)
                      : 0;

                    return (
                      <tr 
                        key={s.studentId} 
                        onClick={() => setSelectedStudentId(s.studentId)}
                        className={`transition-all cursor-pointer ${selectedStudentId === s.studentId ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">{s.number}번</td>
                        <td className="px-6 py-4 font-bold whitespace-nowrap">{s.nickname || s.name}</td>
                        {subject === 'math' && (
                          <td className="px-6 py-4 text-xs whitespace-nowrap">
                            {(() => {
                              const config = dailyTask?.studentMathConfigs?.[s.studentId] || dailyTask?.mathConfig;
                              if (!config) return '-';
                              const unit = CURRICULUM[config.grade as keyof typeof CURRICULUM]?.[config.semester as 1|2]?.find(u => u.id === config.unit);
                              const area = unit?.areas.find(a => a.id === config.area);
                              return area ? `${unit?.name} > ${area.name}` : '-';
                            })()}
                          </td>
                        )}
                        {last7Days.map(date => {
                          const daySub = studentSubs.find(sub => sub.date === date);
                          return (
                            <td key={date} className="px-4 py-4 text-center whitespace-nowrap">
                              {daySub ? (
                                <span className={`font-bold ${daySub.score >= 80 ? 'text-green-600' : daySub.score >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                                  {daySub.score}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 font-black text-blue-600 whitespace-nowrap">{weeklyAvg > 0 ? `${weeklyAvg}점` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'blue' | 'green' | 'red' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };
  return (
    <div className={`p-6 rounded-2xl ${colors[color]} border border-white shadow-sm`}>
      <p className="text-sm font-bold opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function TopicWritingManagement({ students, topicWritings }: { students: Student[], topicWritings: any[] }) {
  const [viewMode, setViewMode] = useState<'date' | 'student'>('date');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.studentId || '');
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const todayWritings = topicWritings.filter(w => w.date === selectedDate);
  const studentMap = new Map(students.map(s => [s.studentId, s]));

  const last5Days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return formatDateToKSTString(d);
  });

  const handleCommentSubmit = async (writingId: string) => {
    if (!commentText.trim()) return;

    try {
      await updateDoc(doc(db, 'topicWritings', writingId), {
        teacherComment: commentText.trim()
      });
      setCommentingId(null);
      setCommentText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'topicWritings');
    }
  };

  const [isGeneratingAllAI, setIsGeneratingAllAI] = useState(false);

  const handleGenerateAllAIReply = async () => {
    const writingsToReply = todayWritings.filter(w => !w.teacherComment);
    if (writingsToReply.length === 0) return;

    setIsGeneratingAllAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      for (const writing of writingsToReply) {
        const student = studentMap.get(writing.studentId);
        if (!student) continue;

        const prompt = `당신은 20년 차 베테랑 초등학교 선생님입니다. 학생이 주제 글쓰기를 작성했습니다.
학생 이름: ${student.nickname || student.name}
주제: ${writing.topic}
글 내용: ${writing.content}

이 학생에게 따뜻하고 격려가 되는, 칭찬과 공감이 담긴 답장을 1~2문장으로 작성해주세요. 초등학생에게 말하듯 다정하고 친절한 말투(해요체)를 사용하세요.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        
        if (response.text) {
          // The writing ID is `${writing.studentId}_${writing.date}`
          await updateDoc(doc(db, 'topicWritings', `${writing.studentId}_${writing.date}`), {
            teacherComment: response.text.trim()
          });
        }
      }
    } catch (error) {
      console.error("All AI Reply Generation Error:", error);
      alert("전체 AI 답장 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingAllAI(false);
    }
  };

  const renderWritingCard = (writing: any, student: Student) => (
    <div key={`${writing.studentId}_${writing.date}`} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col w-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 text-green-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-gray-800">{student.nickname || student.name}</p>
            <p className="text-sm text-gray-500">{student.number}번</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(writing.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <div className="mb-4">
        <h4 className="text-sm font-bold text-green-600 mb-1">주제</h4>
        <p className="font-bold text-gray-800">{writing.topic}</p>
      </div>

      <p className="text-gray-700 mb-6 flex-1 bg-green-50 p-4 rounded-xl whitespace-pre-wrap break-words">{writing.content}</p>

      {writing.teacherComment ? (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-blue-800 text-sm">선생님의 답장</span>
            <button 
              onClick={() => {
                setCommentingId(`${writing.studentId}_${writing.date}`);
                setCommentText(writing.teacherComment || '');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              수정
            </button>
          </div>
          {commentingId === `${writing.studentId}_${writing.date}` ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-blue-200 text-base outline-none focus:border-blue-500 resize-none min-h-[100px]"
                autoFocus
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleCommentSubmit(`${writing.studentId}_${writing.date}`)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <p className="text-blue-900">{writing.teacherComment}</p>
          )}
        </div>
      ) : (
        <div className="mt-auto">
          {commentingId === `${writing.studentId}_${writing.date}` ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="학생에게 따뜻한 답장을 남겨주세요..."
                className="w-full px-4 py-3 rounded-xl border border-blue-200 text-base outline-none focus:border-blue-500 resize-none min-h-[100px]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCommentingId(null)}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-bold transition-all"
                >
                  취소
                </button>
                <button
                  onClick={() => handleCommentSubmit(`${writing.studentId}_${writing.date}`)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCommentingId(`${writing.studentId}_${writing.date}`)}
              className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-500 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              답장 남기기
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">주제 글쓰기</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setViewMode('date')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'date' ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            날짜별 보기
          </button>
          <button
            onClick={() => setViewMode('student')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'student' ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            학생별 보기
          </button>
        </div>
      </div>

      {viewMode === 'date' ? (
        <>
          <div className="flex justify-between items-center">
            <button
              onClick={handleGenerateAllAIReply}
              disabled={isGeneratingAllAI || todayWritings.filter(w => !w.teacherComment).length === 0}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-bold hover:bg-green-200 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              {isGeneratingAllAI ? '전체 AI 답장 생성 중...' : '전체 AI 답장 작성'}
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.sort((a, b) => a.number - b.number).map(student => {
              const writing = todayWritings.find(w => w.studentId === student.studentId);
              if (writing) {
                return renderWritingCard(writing, student);
              } else {
                return (
                  <div key={student.studentId} className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                        {student.number}
                      </div>
                      <span className="font-bold text-gray-600">{student.nickname || student.name}</span>
                    </div>
                    <span className="text-red-400 font-bold text-sm">미제출</span>
                  </div>
                );
              }
            })}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-bold text-gray-700"
            >
              {students.map(s => (
                <option key={s.studentId} value={s.studentId}>{s.number}번 {s.nickname || s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            {last5Days.map(date => {
              const writing = topicWritings.find(w => w.studentId === selectedStudentId && w.date === date);
              const student = studentMap.get(selectedStudentId);
              if (!student) return null;

              return (
                <div key={date} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-32 shrink-0 pt-2">
                    <div className="font-bold text-gray-800">{date}</div>
                    <div className="text-sm font-bold mt-1">
                      {writing ? <span className="text-green-500">제출 완료</span> : <span className="text-red-400">미제출</span>}
                    </div>
                  </div>
                  <div className="flex-1 w-full min-w-0">
                    {writing ? (
                      renderWritingCard(writing, student)
                    ) : (
                      <div className="h-full min-h-[120px] flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6">
                        <p className="text-gray-400 font-medium">제출된 글쓰기가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DailyCompletionStatus({ students, submissions, diaries, topicWritings }: { students: Student[], submissions: Submission[], diaries: MindDiary[], topicWritings: any[] }) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">오늘의 할일 확인</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap">번호</th>
                <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap">닉네임</th>
                <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap text-center">수학</th>
                <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap text-center">문해력</th>
                <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap text-center">마음 일기</th>
                <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap text-center">주제 글쓰기</th>
                <th className="px-6 py-4 font-semibold text-gray-600 whitespace-nowrap text-center">전체 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.sort((a, b) => a.number - b.number).map(student => {
                const hasMath = submissions.some(s => s.studentId === student.studentId && s.date === selectedDate && s.type === 'math');
                const hasLiteracy = submissions.some(s => s.studentId === student.studentId && s.date === selectedDate && s.type === 'literacy');
                const hasDiary = diaries.some(d => d.studentId === student.studentId && d.date === selectedDate);
                const hasTopic = topicWritings.some(w => w.studentId === student.studentId && w.date === selectedDate);

                const allDone = hasMath && hasLiteracy && hasDiary && hasTopic;

                const StatusIcon = ({ done }: { done: boolean }) => (
                  done ? <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto" /> : <XCircle className="w-6 h-6 text-red-300 mx-auto" />
                );

                return (
                  <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{student.number}번</td>
                    <td className="px-6 py-4 font-bold whitespace-nowrap">{student.nickname || student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center"><StatusIcon done={hasMath} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center"><StatusIcon done={hasLiteracy} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center"><StatusIcon done={hasDiary} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center"><StatusIcon done={hasTopic} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {allDone ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">완료</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-sm font-bold">미완료</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MindDiaryPreviewModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">마음 일기 미리보기</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-pink-100 border-2 border-pink-50">
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-8 h-8 text-pink-500" />
            <h2 className="text-2xl font-black text-gray-800">오늘의 마음을 들려주세요</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-4">오늘의 기분은 어떤가요?</label>
              <div className="flex gap-4 justify-center sm:justify-start">
                {['😊', '🥰', '😐', '😔', '😠'].map(mood => (
                  <button
                    key={mood}
                    type="button"
                    className="text-4xl sm:text-5xl p-3 rounded-2xl transition-all hover:bg-gray-50 grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-4">선생님에게 하고 싶은 이야기를 적어주세요 (1~2줄)</label>
              <textarea
                placeholder="오늘 하루 어땠나요? 선생님에게 비밀 이야기를 들려주세요."
                className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 outline-none resize-none h-32 text-lg"
                disabled
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="flex items-center gap-2 bg-pink-500 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-pink-200 opacity-50 cursor-not-allowed"
              >
                <Send className="w-6 h-6" />
                일기 보내고 20 XP 받기
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TopicWritingPreviewModal({ onClose, mode, customTopic }: { onClose: () => void, mode: 'ai' | 'manual', customTopic: string }) {
  const aiTopicObj = getTopicForToday();
  const rawTopicText = mode === 'manual' && customTopic ? customTopic : aiTopicObj.topic;
  
  const topicText = useDynamicTranslation(rawTopicText);
  const guide1Text = useDynamicTranslation(aiTopicObj.guide1);
  const guide2Text = useDynamicTranslation(aiTopicObj.guide2);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">주제 글쓰기 미리보기</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-green-100 border-2 border-green-50">
          <div className="text-center mb-8">
            <h3 className="text-sm font-bold text-green-600 mb-2">오늘의 주제</h3>
            <p className="text-2xl font-black text-gray-800 break-keep-all">{topicText}</p>
          </div>

          {mode === 'ai' && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-6 bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                글쓰기를 도와줄께!
              </div>
              <ul className="list-disc list-inside space-y-2 text-yellow-800 font-medium ml-2">
                <li>{guide1Text}</li>
                <li>{guide2Text}</li>
              </ul>
            </div>
          )}

          <div className="space-y-6">
            <textarea
              placeholder="오늘의 주제에 대해 자유롭게 적어보세요..."
              className="w-full h-64 p-6 rounded-2xl border-2 border-gray-100 outline-none resize-none text-lg leading-relaxed bg-gray-50"
              disabled
            />

            <button
              disabled
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-100 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
              제출하기
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={onClose} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}