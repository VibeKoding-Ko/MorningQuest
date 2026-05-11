import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc, increment } from 'firebase/firestore';
import { Student, DailyTask } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Send, PenTool } from 'lucide-react';
import { getTopicForToday } from '../lib/writingTopics';
import { calculateLevel } from '../lib/levelUtils';
import { useLanguage } from '../contexts/LanguageContext';
import XpEffect from './XpEffect';

interface TopicWritingScreenProps {
  student: Student;
  onBack: () => void;
  dailyTask?: DailyTask | null;
}

export default function TopicWritingScreen({ student, onBack, dailyTask }: TopicWritingScreenProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [earnedXp, setEarnedXp] = useState<number | null>(null);
  
  const aiTopicObj = getTopicForToday();
  const isManual = dailyTask?.topicWritingConfig?.mode === 'manual';
  const topicText = isManual && dailyTask?.topicWritingConfig?.customTopic 
    ? dailyTask.topicWritingConfig.customTopic 
    : aiTopicObj.topic;

  useEffect(() => {
    const fetchSubmission = async () => {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'topicWritings', `${student.studentId}_${today}`);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExistingSubmission(docSnap.data());
          setContent(docSnap.data().content);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'topicWritings');
      }
    };
    fetchSubmission();
  }, [student.studentId]);

  const handleSubmit = async () => {
    if (content.trim().length < 100) {
      alert('내용을 100자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await setDoc(doc(db, 'topicWritings', `${student.studentId}_${today}`), {
        studentId: student.studentId,
        classId: student.classId,
        date: today,
        topic: topicText,
        content,
        createdAt: existingSubmission?.createdAt || Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
      
      // Update XP if it's the first submission
      if (!existingSubmission) {
        const studentRef = doc(db, 'students', student.studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          const currentXp = studentSnap.data().xp || 0;
          const currentStars = studentSnap.data().starPieces || 0;
          
          const isCoreTask = dailyTask?.coreTasks?.includes('topicWriting');
          const rewardXp = isCoreTask ? 20 : 5;
          const topicStars = 2;

          const newXp = currentXp + rewardXp;
          const newLevel = calculateLevel(newXp);

          await setDoc(studentRef, { 
            xp: newXp,
            level: newLevel,
            starPieces: currentStars + topicStars,
            [`dailyXp.${today}`]: increment(rewardXp)
          }, { merge: true });
          setEarnedXp(rewardXp);
        }
      } else {
        alert('주제 글쓰기가 성공적으로 수정되었습니다!');
        onBack();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'topicWritings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 pb-12">
      <header className="bg-white p-6 shadow-sm border-b border-green-100">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 font-bold hover:text-green-600 transition-all">
            <ChevronLeft className="w-6 h-6" /> {t('go_back')}
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-xl text-green-600">
              <PenTool className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-gray-800">{t('topic_writing')}</h2>
          </div>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl shadow-green-100 border-2 border-white"
        >
          <div className="text-center mb-8">
            <h3 className="text-sm font-bold text-green-600 mb-2">{t('todays_topic')}</h3>
            <p className="text-2xl font-black text-gray-800 break-keep-all">
              {topicText === '내가 느낀 감정 글쓰기: 뿌듯하다' ? t('proud_moment') : topicText}
            </p>
          </div>

          {!isManual && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-6 bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {t('writing_helper')}
              </div>
              <ul className="list-disc list-inside space-y-2 text-yellow-800 font-medium ml-2">
                <li>{aiTopicObj.guide1 === '내가 기쁜 마음으로 가득한 상황은 언제였나요?' ? t('proud_guide1') : aiTopicObj.guide1}</li>
                <li>{aiTopicObj.guide2 === '나를 흐뭇하게 한 사람이나 상황이 있었나요?' ? t('proud_guide2') : aiTopicObj.guide2}</li>
              </ul>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('write_your_thoughts')}
                className="w-full h-64 p-6 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none resize-none text-lg leading-relaxed bg-gray-50 focus:bg-white transition-all"
              />
              <p className={`text-right text-sm mt-2 font-bold ${content.length < 100 ? 'text-red-500' : 'text-green-500'}`}>
                {content.length} / 100
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || content.length < 100 || (existingSubmission && content === existingSubmission.content)}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
              {isSubmitting ? t('submitting') : existingSubmission ? t('edit') : t('submit')}
            </button>
          </div>
        </motion.div>
      </main>

      {earnedXp !== null && (
        <XpEffect xp={earnedXp} onComplete={onBack} />
      )}
    </div>
  );
}
