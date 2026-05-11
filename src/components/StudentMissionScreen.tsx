import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Student, MissionQuest, MissionSubmission } from '../types';
import { X, Target, Calendar, CheckCircle2, Star, Clock } from 'lucide-react';

interface MissionCardProps {
  key?: React.Key;
  mission: MissionQuest;
  submissions: MissionSubmission[];
  handleSubmit: () => void;
  handleCancelSubmit: (sub: MissionSubmission) => void;
  getRewardStars: (mission: MissionQuest) => number;
}

// Sub-component for Mission Card to simplify main render
function MissionCard({ mission, submissions, handleSubmit, handleCancelSubmit, getRewardStars }: MissionCardProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // For recurring missions, find today's submission
  const sub = mission.isRecurring
    ? submissions.find(s => s.missionId === mission.id && s.submittedAtDate === todayStr)
    : submissions.find(s => s.missionId === mission.id);
    
  const currentReward = getRewardStars(mission);

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border-2 flex flex-col justify-between gap-4 transition-all hover:border-orange-200 ${mission.isRecurring ? 'border-purple-50' : 'border-orange-50'}`}>
      <div className="w-full">
        <div className="flex items-start gap-3 mb-2">
          {sub ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-1" /> : (
            mission.isRecurring ? <Clock className="w-6 h-6 text-purple-400 shrink-0 mt-1" /> : <Clock className="w-6 h-6 text-orange-400 shrink-0 mt-1" />
          )}
          <div>
            <h3 className="text-lg font-black text-gray-800 leading-snug line-clamp-2">{mission.title}</h3>
            {mission.isRecurring && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded italic">반복 과제</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-gray-500 font-medium flex items-center gap-1 text-sm">
            <Calendar className="w-4 h-4" />
            {mission.isRecurring ? '반복 종료:' : '기한:'} {mission.isRecurring ? mission.recursUntil : mission.dueDate}
          </p>
          {!sub && (
            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold w-fit flex items-center gap-1">
              보상: <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> {currentReward}개
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full shrink-0">
        {sub ? (
          <div className="flex flex-col gap-2 w-full">
            <div className="bg-green-50 border border-green-100 px-4 py-3 rounded-xl text-center w-full">
              <p className="text-green-600 font-bold text-sm">오늘 제출 완료 ({sub.submittedAtDate})</p>
              <p className="text-xs font-bold text-indigo-600 flex items-center justify-center gap-1 mt-1">
                보상: <Star className="w-3.5 h-3.5 fill-indigo-600" /> {sub.rewardStars}개
              </p>
            </div>
            <button 
              onClick={() => handleCancelSubmit(sub)}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors py-1 w-full"
            >
              제출 취소하기
            </button>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            className={`w-full text-white py-3.5 rounded-xl font-bold text-base transition shadow-lg active:scale-95 ${
              mission.isRecurring 
                ? 'bg-purple-500 hover:bg-purple-600 shadow-purple-200' 
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
            }`}
          >
            제출 확인하기
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentMissionScreen({ student, onClose }: { student: Student, onClose: () => void }) {
  const [missions, setMissions] = useState<MissionQuest[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'missionQuests'), where('classId', '==', student.classId));
    const unsub = onSnapshot(q, (snapshot) => setMissions(snapshot.docs.map(d => d.data() as MissionQuest)), (error) => handleFirestoreError(error, OperationType.LIST, 'missionQuests'));
    return () => unsub();
  }, [student.classId]);

  useEffect(() => {
    const q = query(collection(db, 'missionSubmissions'), where('studentId', '==', student.studentId));
    const unsub = onSnapshot(q, (snapshot) => setSubmissions(snapshot.docs.map(d => d.data() as MissionSubmission)), (error) => handleFirestoreError(error, OperationType.LIST, 'missionSubmissions'));
    return () => unsub();
  }, [student.studentId]);

  const getRewardStars = (mission: MissionQuest) => {
    if (mission.isRecurring) return 2;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const created = new Date(mission.createdAt);
    created.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - created.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 2) return 4;
    if (diffDays === 3) return 3;
    if (diffDays === 4) return 2;
    return 1;
  };

  const handleSubmit = async (mission: MissionQuest) => {
    const todayDate = new Date();
    const todayStr = todayDate.toISOString().split('T')[0];

    const rewardStars = getRewardStars(mission);
    
    // For recurring missions, unique ID per day. Otherwise, unique ID per mission.
    const subId = mission.isRecurring 
      ? `${student.studentId}_${mission.id}_${todayStr}`
      : `${student.studentId}_${mission.id}`;
    
    try {
      await setDoc(doc(db, 'missionSubmissions', subId), {
        id: subId,
        missionId: mission.id,
        studentId: student.studentId,
        classId: student.classId,
        submittedAt: Date.now(),
        submittedAtDate: todayStr,
        rewardStars
      });

      await updateDoc(doc(db, 'students', student.studentId), {
        starPieces: (student.starPieces || 0) + rewardStars
      });
    } catch(e) {
      handleFirestoreError(e, OperationType.WRITE, 'missionSubmissions');
    }
  };

  const handleCancelSubmit = async (sub: MissionSubmission) => {
    // Show a native confirmation if possible, but for iframe safety we could use state. 
    // Since user specifically requested "경고가 팝업으로 떴으면 좋겠어", we will use a custom state popup perfectly.
    setConfirmPopup({ isOpen: true, type: 'cancel', sub });
  };
  
  const executeCancelSubmit = async (sub: MissionSubmission) => {
    try {
      await deleteDoc(doc(db, 'missionSubmissions', sub.id));
      await updateDoc(doc(db, 'students', student.studentId), {
        starPieces: Math.max(0, (student.starPieces || 0) - sub.rewardStars)
      });
    } catch(e) {
      handleFirestoreError(e, OperationType.DELETE, 'missionSubmissions');
    }
    setConfirmPopup({ isOpen: false, type: null, sub: null });
  };

  const [confirmPopup, setConfirmPopup] = useState<{isOpen: boolean, type: 'cancel' | null, sub: MissionSubmission | null}>({isOpen: false, type: null, sub: null});

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-4 -m-2 sm:p-2 sm:m-0 bg-white/50 backdrop-blur-md rounded-full hover:bg-gray-100 transition-colors z-20"
        >
          <X className="w-8 h-8 sm:w-6 sm:h-6 text-gray-700" />
        </button>
        
        <div className="bg-orange-500 p-6 sm:p-8 text-center text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 opacity-20 transform translate-x-1/3 -translate-y-1/3">
            <Target className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <Target className="w-12 h-12 sm:w-16 sm:h-16 text-orange-200" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-2">우리반 과제함</h2>
            <p className="text-orange-100 font-medium text-sm sm:text-base">선생님이 부여한 과제를 제출하고 보상을 받으세요!</p>
          </div>
        </div>

        <div className="p-4 sm:p-8 overflow-y-auto bg-gray-50 flex-1">
          {missions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold">
              현재 진행 중인 과제나 제출물이 없습니다.
            </div>
          ) : (
            <div className="space-y-8">
              {/* General Missions Section */}
              {missions.filter(m => !m.isRecurring).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" /> 일반 과제
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missions.filter(m => !m.isRecurring).sort((a,b) => b.createdAt - a.createdAt).map(mission => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        submissions={submissions} 
                        handleSubmit={() => handleSubmit(mission)} 
                        handleCancelSubmit={handleCancelSubmit} 
                        getRewardStars={getRewardStars} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring Missions Section */}
              {missions.filter(m => m.isRecurring).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-500" /> 반복 과제
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missions.filter(m => m.isRecurring).sort((a,b) => b.createdAt - a.createdAt).map(mission => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        submissions={submissions} 
                        handleSubmit={() => handleSubmit(mission)} 
                        handleCancelSubmit={handleCancelSubmit} 
                        getRewardStars={getRewardStars} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmPopup.isOpen && confirmPopup.sub && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">제출을 취소할까요?</h3>
            <p className="text-gray-500 font-medium mb-6">
              제출을 취소하면 획득했던 별조각({confirmPopup.sub.rewardStars}개)이 회수됩니다.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmPopup({isOpen: false, type: null, sub: null})}
                className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                아니오
              </button>
              <button 
                onClick={() => executeCancelSubmit(confirmPopup.sub!)}
                className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
              >
                취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
