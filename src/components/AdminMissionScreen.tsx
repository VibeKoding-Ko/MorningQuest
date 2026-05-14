import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Student, MissionQuest, MissionSubmission } from '../types';
import { Plus, Trash2, Calendar as CalIcon, Star, CheckCircle2, UserCheck, Edit2 } from 'lucide-react';

export default function AdminMissionScreen({ classId, students }: { classId: string, students: Student[] }) {
  const [missions, setMissions] = useState<MissionQuest[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMission, setEditingMission] = useState<MissionQuest | null>(null);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly'>('daily');
  const [recurringDays, setRecurringDays] = useState<number[]>([1,2,3,4,5]); // Default Mon-Fri
  const [recursUntil, setRecursUntil] = useState('');

  // Custom confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Accordion state
  const [expandedMissions, setExpandedMissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'missionQuests'), where('classId', '==', classId));
    const unsub = onSnapshot(q, (snapshot) => setMissions(snapshot.docs.map(d => d.data() as MissionQuest)), (error) => { if (error.code !== 'permission-denied') console.error(error); });
    return () => unsub();
  }, [classId]);

  useEffect(() => {
    const q = query(collection(db, 'missionSubmissions'), where('classId', '==', classId));
    const unsub = onSnapshot(q, (snapshot) => setSubmissions(snapshot.docs.map(d => d.data() as MissionSubmission)), (error) => { if (error.code !== 'permission-denied') console.error(error); });
    return () => unsub();
  }, [classId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    
    const id = editingMission ? editingMission.id : `${classId}_${Date.now()}`;
    try {
      const docData: any = {
        id,
        classId,
        title,
        dueDate,
        isRecurring,
        createdAt: editingMission ? editingMission.createdAt : Date.now()
      };
      
      if (isRecurring) {
        docData.recurringType = recurringType;
        docData.recursUntil = dueDate;
        if (recurringType === 'weekly') {
          docData.recurringDays = recurringDays;
        }
      }
      
      await setDoc(doc(db, 'missionQuests', id), docData);
      setShowAdd(false);
      setEditingMission(null);
      setTitle('');
      setDueDate('');
      setIsRecurring(false);
      setRecursUntil('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'missionQuests');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, 'missionQuests', deletingId));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'missionQuests');
    }
  };

  const toggleMissionExpansion = (id: string) => {
    setExpandedMissions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">우리반 과제/제출물 관리</h2>
        <button 
          onClick={() => { setShowAdd(true); setTitle(''); setDueDate(''); }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition shadow-sm"
        >
          <Plus className="w-5 h-5" /> 새 과제 등록
        </button>
      </div>

      <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 flex items-start gap-4">
        <div className="bg-orange-100 p-3 rounded-full text-orange-600 shrink-0"><Star className="w-6 h-6" /></div>
        <div>
          <h3 className="font-bold text-orange-800 text-lg mb-2">⭐ 과제 별조각 보상 시스템 안내</h3>
          <p className="text-orange-700 text-sm leading-relaxed mb-2">학생들이 과제 및 제출물을 빨리 등록할수록 더 큰 보상을 받습니다! 미리미리 과제를 챙기는 습관을 길러주세요.</p>
          <ul className="list-disc list-inside text-sm text-orange-700 font-medium space-y-1">
            <li>등록 +2일까지 제출 완료: <strong>4개</strong> (날짜 기준)</li>
            <li>등록 +3일 후 제출 완료: <strong>3개</strong></li>
            <li>등록 +4일 후 제출 완료: <strong>2개</strong></li>
            <li>등록 +5일 이후 제출 완료: <strong>1개</strong></li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missions.length === 0 && (
           <div className="col-span-full text-center p-12 text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-3xl">
             현재 진행 중인 과제나 제출물이 없습니다.
           </div>
        )}
        {missions.sort((a,b) => b.createdAt - a.createdAt).map(mission => {
          const mSubmissions = submissions.filter(s => s.missionId === mission.id);
          const isExpanded = expandedMissions.has(mission.id);
          const progressPercent = students.length > 0 ? (mSubmissions.length / students.length) * 100 : 0;
          return (
            <div key={mission.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-orange-400"></div>
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <div className="flex-1 w-full">
                  <h3 className="text-xl font-bold text-gray-800">{mission.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-1 items-center">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <CalIcon className="w-4 h-4" /> 
                      {mission.isRecurring ? '반복 기한:' : '마감일:'} {mission.dueDate}
                    </p>
                    {mission.isRecurring && (
                      <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {mission.recurringType === 'daily' ? '매일 반복' : `주간 반복 (${mission.recurringDays?.map(d => ['일','월','화','수','목','금','토'][d]).join(',')})`}
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Bar & Submitted Count */}
                  <div 
                    className="mt-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleMissionExpansion(mission.id)}
                  >
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-600">제출 현황 클릭하여 {isExpanded ? '접기' : '보기'}</span>
                      <span className="font-black text-blue-600">
                        제출 {mSubmissions.length}명 / 총 {students.length}명
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 items-center shrink-0">
                  <button onClick={() => {
                    setEditingMission(mission);
                    setTitle(mission.title);
                    setDueDate(mission.dueDate);
                    setShowAdd(true);
                  }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => setDeletingId(mission.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-h-64 overflow-y-auto mt-4">
                  <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 sticky top-0 bg-gray-50 z-10">
                      <tr>
                        <th className="py-2">닉네임</th>
                        <th className="py-2">제출 상태</th>
                        <th className="py-2">제출일</th>
                        <th className="py-2 text-right">획득 별조각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => {
                        const sub = mSubmissions.find(ms => ms.studentId === s.studentId);
                        return (
                          <tr key={s.studentId} className="border-t border-gray-100">
                            <td className="py-2 font-bold">{s.nickname || s.name}</td>
                            <td className="py-2">
                              {sub ? <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />제출완료</span> : <span className="text-gray-400">미제출</span>}
                            </td>
                            <td className="py-2 text-gray-600">{sub ? sub.submittedAtDate : '-'}</td>
                            <td className="py-2 text-right font-bold text-indigo-600">
                              {sub ? `+${sub.rewardStars}` : '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
             <h3 className="text-xl font-bold mb-6">새 미션 생성</h3>
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">제출물(미션) 이름</label>
                 <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-2 border rounded-xl" placeholder="예: 가정통신문 제출, 그림일기 제출" />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">기한 (마감일)</label>
                 <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full px-4 py-2 border rounded-xl" />
               </div>

               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
                 <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="recurringCheckbox" 
                      checked={isRecurring} 
                      onChange={e => setIsRecurring(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-500"
                    />
                    <label htmlFor="recurringCheckbox" className="font-bold text-gray-700 cursor-pointer">반복 과제로 설정</label>
                 </div>

                 {isRecurring && (
                   <div className="space-y-3 pt-2">
                     <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => setRecurringType('daily')}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${recurringType === 'daily' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'}`}
                       >
                         매일 반복
                       </button>
                       <button
                         type="button"
                         onClick={() => setRecurringType('weekly')}
                         className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${recurringType === 'weekly' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200'}`}
                       >
                         요일 반복
                       </button>
                     </div>

                     {recurringType === 'weekly' && (
                        <div className="flex justify-between">
                          {dayNames.map((day, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setRecurringDays(prev => 
                                  prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                                );
                              }}
                              className={`w-8 h-8 rounded-full text-xs font-bold transition ${recurringDays.includes(i) ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                     )}
                     <div className="text-xs text-orange-600 font-bold bg-orange-50 p-2 rounded-lg mt-2">
                       * 반복 과제의 제출 완료 시 별조각 보상은 2개로 고정됩니다.
                     </div>
                   </div>
                 )}
               </div>

               <div className="flex gap-2 pt-4">
                 <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold">취소</button>
                 <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 font-bold">{editingMission ? '수정하기' : '생성하기'}</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">과제 삭제</h3>
            <p className="text-gray-500 mb-6">정말로 삭제하시겠습니까?<br/>관련 제출 기록도 남지만 목록에서 사라집니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold">취소</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold">삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
