export interface Teacher {
  uid: string;
  email: string;
  name: string;
  classId: string;
  school?: string;
}

export interface Student {
  studentId: string;
  password?: string;
  name: string;
  nickname?: string;
  number: number;
  grade: number;
  class: number;
  classId: string;
  school?: string;
  title?: string;
  xp: number;
  level: number;
  starPieces?: number;
  consecutiveDays?: number;
  lastActiveDate?: string;
  lastMathCompletedDate?: string;
  lastLiteracyCompletedDate?: string;
  currentAreaId?: string;
  dailyXp?: Record<string, number>;
  typingMaxCpm?: number;
  typingMaxScore?: number;
  typingParagraphScore?: number;
  typingStars?: {
    BASIC?: number;
    WORD?: number;
    SENTENCE?: number;
    PARAGRAPH?: number;
  };
  typingBasicScores?: Record<number, number>;
  typingGameScore?: number;
}

export interface Class {
  id: string;
  teacherUid: string;
  name: string;
  year?: number;
  grade?: number;
  classNumber?: number;
}

export interface DailyTask {
  classId: string;
  date: string;
  enableMindDiary?: boolean;
  enableLiteracy?: boolean;
  enableMath?: boolean;
  enableTopicWriting?: boolean;
  enableTyping?: boolean;
  enableMyMonster?: boolean;
  topicWritingConfig?: {
    mode: 'ai' | 'manual';
    customTopic?: string;
  };
  mathConfig: {
    mode?: 'manual' | 'sequential';
    grade: number;
    semester: number;
    unit?: string;
    area?: string;
    problemCount?: number;
  };
  studentMathConfigs?: Record<string, {
    mode?: 'manual' | 'sequential';
    grade: number;
    semester: number;
    unit?: string;
    area?: string;
    problemCount?: number;
  }>;
  typingConfig?: {
    grade: number;
  };
  literacyConfig?: any;
  coreTasks?: string[]; // Array of task keys like ['math', 'mindDiary']
}

export interface Submission {
  studentId: string;
  classId: string;
  date: string;
  type: 'math' | 'literacy';
  score: number;
  isFirstAttempt: boolean;
  answers: { question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[];
  grade?: number;
  semester?: number;
  unitId?: string;
  unitName?: string;
  areaId?: string;
  areaName?: string;
}

export interface MindDiary {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  mood: string;
  content: string;
  teacherComment?: string;
  createdAt: number;
}

export interface TopicWriting {
  studentId: string;
  classId: string;
  date: string;
  topic: string;
  content: string;
  teacherComment?: string;
  createdAt: number;
}

export interface ShopItem {
  id: string;
  classId: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  isTitle?: boolean;
  createdAt: number;
}

export interface PurchaseRecord {
  id: string;
  classId: string;
  studentId: string;
  itemId: string;
  itemName: string;
  price: number;
  purchasedAt: number;
  used: boolean;
}

export interface MissionQuest {
  id: string;
  classId: string;
  title: string;
  dueDate: string;
  createdAt: number;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly';
  recurringDays?: number[]; // 0 for Sunday, 1 for Monday, etc.
  recursUntil?: string;
}

export interface MissionSubmission {
  id: string;
  missionId: string;
  studentId: string;
  classId: string;
  submittedAt: number;
  submittedAtDate: string;
  rewardStars: number;
}
