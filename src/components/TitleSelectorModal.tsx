import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Student } from '../types';
import { X, Trophy } from 'lucide-react';

interface Props {
  student: Student;
  onClose: () => void;
}

export default function TitleSelectorModal({ student, onClose }: Props) {
  const [titles, setTitles] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'purchaseRecords'), 
      where('studentId', '==', student.studentId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const allPurchases = snapshot.docs.map(d => d.data());
      // Filter isTitle and used
      const unlockedTitles = allPurchases
        .filter(it => it.isTitle && it.used)
        .map(it => it.itemName as string);
      
      // Remove duplicates
      setTitles([...new Set(unlockedTitles)]);
    });
    return () => unsub();
  }, [student.studentId]);

  const defaultTitle = `${(student.school || '').replace(/등학교$/, '')} ${student.grade}학년 ${student.class}반`;

  const handleSelectTitle = async (newTitle: string) => {
    try {
      await updateDoc(doc(db, 'students', student.studentId), {
        title: newTitle === defaultTitle ? '' : newTitle
      });
      onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'students');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-purple-500 p-6 text-center text-white">
          <div className="flex justify-center mb-2">
            <Trophy className="w-12 h-12 text-purple-200" />
          </div>
          <h2 className="text-2xl font-black mb-1">칭호 변경</h2>
          <p className="text-purple-100 text-sm">자신을 특별하게 표현할 칭호를 선택하세요!</p>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
          <button
            onClick={() => handleSelectTitle(defaultTitle)}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              !student.title ? 'border-purple-500 bg-purple-50 font-black text-purple-700' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 font-bold text-gray-700'
            }`}
          >
            기본 칭호
            <p className="text-xs font-normal text-gray-500 mt-1">{defaultTitle}</p>
          </button>

          {titles.map(t => (
            <button
              key={t}
              onClick={() => handleSelectTitle(t)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                student.title === t ? 'border-purple-500 bg-purple-50 font-black text-purple-700' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50 font-bold text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-400" /> 
                {t}
              </div>
            </button>
          ))}
          
          {titles.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
              아직 획득한 칭호가 없습니다.<br/>
              <span className="font-normal text-xs">상점에서 칭호를 구매하고 창고에서 사용해보세요.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
