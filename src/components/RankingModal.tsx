import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Medal, Crown, Star, Users, School, GraduationCap } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Student } from '../types';
import { RankBadge } from '../lib/rank';
import { getTodayDateString } from '../lib/dateUtils';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: Student;
  rankingType?: 'xp' | 'typing';
}

export default function RankingModal({ isOpen, onClose, currentStudent, rankingType = 'xp' }: RankingModalProps) {
  const [activeTab, setActiveTab] = useState<string>('typing_class');
  const [rankingPeriod, setRankingPeriod] = useState<'today' | 'total'>('today');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(rankingType === 'typing' ? 'typing_class' : 'individual');
  }, [rankingType]);

  useEffect(() => {
    if (isOpen) {
      const fetchStudents = async () => {
        setLoading(true);
        try {
          const snapshot = await getDocs(collection(db, 'students'));
          setAllStudents(snapshot.docs.map(doc => doc.data() as Student));
        } catch (e) {
          console.error("Failed to fetch students for ranking", e);
        } finally {
          setLoading(false);
        }
      };
      fetchStudents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter students based on current student's school (if available)
  // If school is not set, we might just show overall or fallback
  const schoolStudents = currentStudent.school 
    ? allStudents.filter(s => s.school === currentStudent.school)
    : allStudents;

  // Helper to get score based on ranking type
  const getScore = (s: Student, period: 'today' | 'total') => {
    if (rankingType === 'typing') {
      return s.typingParagraphScore || 0;
    }
    if (period === 'today') {
      const today = getTodayDateString();
      return s.dailyXp?.[today] || 0;
    }
    return s.xp || 0;
  };

  // 1. 개인 랭킹 (Individual Ranking within School)
  const today = getTodayDateString();
  const sortedStudents = [...schoolStudents].sort((a, b) => {
    return getScore(b, rankingPeriod) - getScore(a, rankingPeriod);
  });
  const individualRanking = sortedStudents.slice(0, 50);

  // 2. 학급 랭킹 (Class Ranking within School)
  const classGroups = schoolStudents.reduce((acc, s) => {
    const key = `${s.grade}학년 ${s.class}반`;
    if (!acc[key]) acc[key] = { name: key, totalScore: 0, studentCount: 0 };
    acc[key].totalScore += getScore(s, rankingPeriod);
    acc[key].studentCount += 1;
    return acc;
  }, {} as Record<string, { name: string, totalScore: number, studentCount: number }>);
  
  const classRanking = Object.values(classGroups)
    .map((c: any) => ({ ...c, avgScore: Math.round(c.totalScore / Math.max(1, rankingType === 'typing' ? c.studentCount : 1)) })) // for XP, we use total, but for typing maybe average? Let's use average for grouping either way. Wait, XP was total or average? Ah, previous code used avg: total / count.
    .sort((a, b) => b.avgScore - a.avgScore);

  // 3. 학년 랭킹 (Grade Ranking within School)
  const gradeGroups = schoolStudents.reduce((acc, s) => {
    const key = `${s.grade}학년`;
    if (!acc[key]) acc[key] = { name: key, totalScore: 0, studentCount: 0 };
    acc[key].totalScore += getScore(s, rankingPeriod);
    acc[key].studentCount += 1;
    return acc;
  }, {} as Record<string, { name: string, totalScore: number, studentCount: number }>);

  const gradeRanking = Object.values(gradeGroups)
    .map((g: any) => ({ ...g, avgScore: Math.round(g.totalScore / g.studentCount) }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // 4. 학교 랭킹 (School Ranking Overall)
  const schoolGroups = allStudents.reduce((acc, s) => {
    const key = s.school || '소속 없음';
    if (!acc[key]) acc[key] = { name: key, totalScore: 0, studentCount: 0 };
    acc[key].totalScore += getScore(s, rankingPeriod);
    acc[key].studentCount += 1;
    return acc;
  }, {} as Record<string, { name: string, totalScore: number, studentCount: number }>);

  const schoolRanking = Object.values(schoolGroups)
    .map((s: any) => ({ ...s, avgScore: Math.round(s.totalScore / s.studentCount) }))
    .sort((a, b) => b.avgScore - a.avgScore);

  // Typing Specific Rankings
  const typingClassRanking = allStudents
    .filter(s => s.school === currentStudent.school && s.grade === currentStudent.grade && s.class === currentStudent.class && (s.typingParagraphScore || 0) > 0)
    .sort((a,b) => (b.typingParagraphScore || 0) - (a.typingParagraphScore || 0));

  const typingGradeRanking = allStudents
    .filter(s => s.school === currentStudent.school && s.grade === currentStudent.grade && (s.typingParagraphScore || 0) > 0)
    .sort((a,b) => (b.typingParagraphScore || 0) - (a.typingParagraphScore || 0))
    .slice(0, 50);

  const typingSchoolRanking = allStudents
    .filter(s => s.school === currentStudent.school && (s.typingParagraphScore || 0) > 0)
    .sort((a,b) => (b.typingParagraphScore || 0) - (a.typingParagraphScore || 0))
    .slice(0, 50);

  const typingGameRanking = allStudents
    .filter(s => s.school === currentStudent.school)
    .sort((a,b) => (b.typingGameScore || 0) - (a.typingGameScore || 0))
    .slice(0, 50);

  const renderRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 text-center font-bold text-gray-500">{index + 1}</span>;
  };

  const isTyping = rankingType === 'typing';
  const unit = isTyping ? '점' : 'XP';
  const scoreLabel = isTyping ? '최고 점수' : '경험치';
  const averageLabel = isTyping ? '평균 점수' : '평균 경험치';

  const renderStudentList = (rankList: Student[], isGameScore: boolean = false) => {
    const listUnit = isGameScore ? '점' : unit;
    return (
      <>
        <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between shadow-sm border border-indigo-100 gap-4">
          <div className="flex gap-2">
            {!isTyping && (
              <>
                <button 
                  onClick={() => setRankingPeriod('today')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${rankingPeriod === 'today' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}
                >오늘</button>
                <button 
                  onClick={() => setRankingPeriod('total')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${rankingPeriod === 'total' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}
                >누적</button>
              </>
            )}
            {isTyping && <div className="text-sm font-bold text-indigo-700">{isGameScore ? '타자게임 점수 랭킹' : '점수 랭킹'}</div>}
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-8">
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-black opacity-60 uppercase">내 랭킹</p>
              <p className="text-xl font-black">
                {rankList.findIndex(s => s.studentId === currentStudent.studentId) !== -1 
                  ? `${rankList.findIndex(s => s.studentId === currentStudent.studentId) + 1}위` 
                  : '순위 밖'}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-black opacity-60 uppercase">내 {isGameScore ? '최고 점수' : (isTyping ? scoreLabel : (rankingPeriod === 'today' ? '오늘' : '누적'))} {isTyping ? '' : 'XP'}</p>
              <p className="text-xl font-black">
                {isGameScore ? (currentStudent.typingGameScore || 0).toLocaleString() : (isTyping ? (currentStudent.typingParagraphScore ? currentStudent.typingParagraphScore.toLocaleString() : '-') : (rankingPeriod === 'today' 
                  ? ((currentStudent as any).dailyXp?.[today] || 0).toLocaleString()
                  : currentStudent.xp.toLocaleString()))} {isTyping && !currentStudent.typingParagraphScore ? '점' : listUnit}
              </p>
            </div>
          </div>
        </div>
        {rankList.map((student, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={student.studentId}
            className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border ${student.studentId === currentStudent.studentId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 flex justify-center">{renderRankIcon(idx)}</div>
              <div className="flex flex-col">
                <p className="text-[10px] text-gray-400 font-bold mb-0.5">
                  {student.title || `${(student.school || '').replace(/등학교$/, '')} ${student.grade}학년 ${student.class}반`}
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800 leading-none">{student.nickname || student.name}</p>
                  <RankBadge level={student.level} className="py-0.5 px-2 text-xs" />
                  {student.studentId === currentStudent.studentId && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">나</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 min-w-[70px]">
              <div className="text-right">
                <p className="font-black text-indigo-600 leading-none">
                  {isGameScore ? (student.typingGameScore || 0).toLocaleString() : (isTyping ? (student.typingParagraphScore || 0).toLocaleString() : (rankingPeriod === 'today' 
                    ? ((student as any).dailyXp?.[today] || 0).toLocaleString()
                    : student.xp.toLocaleString()))}
                </p>
                <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{listUnit}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{isTyping ? '모닝퀘스트 타자연습 랭킹' : '명예의 전당'}</h2>
              <p className="text-blue-100 text-sm">우리 학교와 전국 {isTyping ? '타자' : ''} 랭킹을 확인해보세요!</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 shrink-0 bg-gray-50 flex-wrap">
          {(!isTyping) ? (
            <>
              <button
                onClick={() => setActiveTab('individual')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === 'individual' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Star className="w-4 h-4" /> 개인 랭킹
              </button>
              <button
                onClick={() => setActiveTab('class')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === 'class' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="w-4 h-4" /> 학급 랭킹
              </button>
              <button
                onClick={() => setActiveTab('grade')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === 'grade' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <GraduationCap className="w-4 h-4" /> 학년 랭킹
              </button>
              <button
                onClick={() => setActiveTab('school')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${activeTab === 'school' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <School className="w-4 h-4" /> 학교 랭킹
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('typing_class')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors min-w-[100px] ${activeTab === 'typing_class' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="w-4 h-4" /> 학급 랭킹
              </button>
              <button
                onClick={() => setActiveTab('typing_grade')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors min-w-[100px] ${activeTab === 'typing_grade' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <GraduationCap className="w-4 h-4" /> 학년 랭킹
              </button>
              <button
                onClick={() => setActiveTab('typing_school')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors min-w-[100px] ${activeTab === 'typing_school' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <School className="w-4 h-4" /> 학교 랭킹
              </button>
              <button
                onClick={() => setActiveTab('typing_game')}
                className={`flex-1 py-4 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors min-w-[100px] ${activeTab === 'typing_game' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Crown className="w-4 h-4" /> 타자게임 랭킹
              </button>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4" />
              <p className="text-gray-500 font-medium">랭킹 데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTab === 'individual' && renderStudentList(individualRanking)}

              {activeTab === 'typing_class' && renderStudentList(typingClassRanking)}
              {activeTab === 'typing_grade' && renderStudentList(typingGradeRanking)}
              {activeTab === 'typing_school' && renderStudentList(typingSchoolRanking)}
              {activeTab === 'typing_game' && renderStudentList(typingGameRanking, true)}

              {activeTab === 'class' && (
                <>
                  <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl mb-6 shadow-sm border border-indigo-100">
                    <p className="text-sm font-medium opacity-80 text-center">우리 학교 학급별 {averageLabel} 랭킹</p>
                  </div>
                  {classRanking.map((cls, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={cls.name}
                      className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border ${cls.name === `${currentStudent.grade}학년 ${currentStudent.class}반` ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 flex justify-center">{renderRankIcon(idx)}</div>
                        <div>
                          <p className="font-bold text-gray-800 flex items-center gap-2">
                            {cls.name}
                            {cls.name === `${currentStudent.grade}학년 ${currentStudent.class}반` && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">우리 반</span>}
                          </p>
                          <p className="text-xs text-gray-500">{cls.studentCount}명 참여</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">{cls.avgScore.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{averageLabel.replace('평균 ', '')}</p>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}

              {activeTab === 'grade' && (
                <>
                  <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl mb-6 shadow-sm border border-indigo-100">
                    <p className="text-sm font-medium opacity-80 text-center">우리 학교 학년별 {averageLabel} 랭킹</p>
                  </div>
                  {gradeRanking.map((grade, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={grade.name}
                      className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border ${grade.name === `${currentStudent.grade}학년` ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 flex justify-center">{renderRankIcon(idx)}</div>
                        <div>
                          <p className="font-bold text-gray-800 flex items-center gap-2">
                            {grade.name}
                            {grade.name === `${currentStudent.grade}학년` && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">우리 학년</span>}
                          </p>
                          <p className="text-xs text-gray-500">{grade.studentCount}명 참여</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">{grade.avgScore.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{averageLabel.replace('평균 ', '')}</p>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}

              {activeTab === 'school' && (
                <>
                  <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl mb-6 shadow-sm border border-indigo-100">
                    <p className="text-sm font-medium opacity-80 text-center">전국 학교별 {averageLabel} 랭킹</p>
                  </div>
                  {schoolRanking.map((school, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={school.name}
                      className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border ${school.name === currentStudent.school ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 flex justify-center">{renderRankIcon(idx)}</div>
                        <div>
                          <p className="font-bold text-gray-800 flex items-center gap-2">
                            {school.name}
                            {school.name === currentStudent.school && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">우리 학교</span>}
                          </p>
                          <p className="text-xs text-gray-500">{school.studentCount}명 참여</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">{school.avgScore.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{averageLabel.replace('평균 ', '')}</p>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
