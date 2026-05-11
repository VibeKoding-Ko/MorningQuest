import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, db, googleProvider, handleFirestoreError, OperationType, signInAnonymously } from './firebase';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateEmail, updatePassword, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { Teacher, Student, Class } from './types';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, GraduationCap, School, UserCircle, Volume2, VolumeX } from 'lucide-react';

interface AuthContextType {
  user: Teacher | Student | null;
  role: 'teacher' | 'student' | null;
  loading: boolean;
  loginAsTeacher: (id: string, pw: string) => Promise<void>;
  registerAsTeacher: (id: string, pw: string, school: string, realEmail: string, teacherCode: string) => Promise<void>;
  loginAsStudent: (id: string, pw: string) => Promise<void>;
  logout: () => Promise<void>;
}

import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<Teacher | Student | null>(null);
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentSyncId, setStudentSyncId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'student' && studentSyncId) {
      const studentRef = doc(db, 'students', studentSyncId);
      const unsubscribe = onSnapshot(studentRef, (snapshot) => {
        if (snapshot.exists()) {
          const updatedStudent = snapshot.data() as Student;
          setUser(updatedStudent);
          localStorage.setItem('student_session', JSON.stringify(updatedStudent));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `students/${studentSyncId}`);
      });
      return () => unsubscribe();
    }
  }, [role, studentSyncId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if teacher
        try {
          if (!firebaseUser.isAnonymous) {
            const teacherDoc = await getDoc(doc(db, 'teachers', firebaseUser.uid));
            if (teacherDoc.exists()) {
              setUser(teacherDoc.data() as Teacher);
              setRole('teacher');
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes('permission-denied')) {
            // Ignore permission denied during auth state transitions
          } else {
            console.error(e);
          }
        }

        // Check local storage for student session
        const studentSession = localStorage.getItem('student_session');
        if (studentSession) {
          const studentData = JSON.parse(studentSession) as Student;
          setUser(studentData);
          setRole('student');
          setStudentSyncId(studentData.studentId);
        } else {
          setUser(null);
          setRole(null);
          setStudentSyncId(null);
        }
      } else {
        // Check local storage for student session
        const studentSession = localStorage.getItem('student_session');
        if (studentSession) {
          try {
            await signInAnonymously(auth);
            // Do not set user here. Let the subsequent auth state change handle it.
            return;
          } catch (e) {
            console.error(e);
            setUser(null);
            setRole(null);
            setStudentSyncId(null);
            localStorage.removeItem('student_session');
          }
        } else {
          setUser(null);
          setRole(null);
          setStudentSyncId(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsTeacher = async (id: string, pw: string) => {
    try {
      let email = id;
      if (!id.includes('@')) {
        const mappingDoc = await getDoc(doc(db, 'teacherMappings', id));
        if (mappingDoc.exists()) {
          email = mappingDoc.data().realEmail; // Use mapped explicit email
        } else {
          email = `${id}@teacher.app.com`; // Fallback to classic ID auth
        }
      }

      const result = await signInWithEmailAndPassword(auth, email, pw);
      const teacherDoc = await getDoc(doc(db, 'teachers', result.user.uid));
      if (teacherDoc.exists()) {
        setUser(teacherDoc.data() as Teacher);
        setRole('teacher');
      } else {
        throw new Error('선생님 정보를 찾을 수 없습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('선생님 로그인 실패: 아이디나 비밀번호를 확인해주세요.');
    }
  };

  const registerAsTeacher = async (id: string, pw: string, school: string, realEmail: string, teacherCode: string) => {
    try {
      if (!id || !pw || !school || !realEmail || !teacherCode) {
        alert('모든 항목을 입력해주세요.');
        return;
      }
      if (pw.length < 6) {
        alert('비밀번호는 6자리 이상이어야 합니다.');
        return;
      }
      if (school.endsWith('초') || school.endsWith('초등')) {
        alert('학교 이름은 줄여 쓰지 말고 "초등학교"까지 모두 입력해주세요. (예: 원곡초등학교)');
        return;
      }
      if (teacherCode !== 'MQKDH') {
        alert('올바른 교사 코드를 입력해주세요.');
        return;
      }

      const email = realEmail; // Ensure we use real UI standard emails
      const result = await createUserWithEmailAndPassword(auth, email, pw);
      const newTeacher: Teacher = {
        uid: result.user.uid,
        email: email,
        name: '선생님',
        school: school,
        classId: ""
      };
      await setDoc(doc(db, 'teachers', result.user.uid), newTeacher);
      
      // Save school to schools collection for autocomplete
      await setDoc(doc(db, 'schools', school), { name: school });
      
      // Save mapping to support login by ID
      await setDoc(doc(db, 'teacherMappings', id), { realEmail: email });
      
      setUser(newTeacher);
      setRole('teacher');
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message.includes('email-already-in-use')) {
        alert('이미 사용 중인 이메일/아이디입니다.');
      } else {
        alert('회원가입 실패: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
      }
    }
  };

  const loginAsStudent = async (id: string, pw: string) => {
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }

      const exactId = id.trim();
      const lowerId = exactId.toLowerCase();
      const upperId = exactId.toUpperCase();
      
      let studentDoc = await getDoc(doc(db, 'students', exactId));
      if (!studentDoc.exists() && exactId !== lowerId) {
        studentDoc = await getDoc(doc(db, 'students', lowerId));
      }
      if (!studentDoc.exists() && exactId !== upperId) {
        studentDoc = await getDoc(doc(db, 'students', upperId));
      }

      if (studentDoc.exists()) {
        const studentData = studentDoc.data() as Student;
        if (studentData.password === pw) {
          setUser(studentData);
          setRole('student');
          setStudentSyncId(studentData.studentId);
          localStorage.setItem('student_session', JSON.stringify(studentData));
        } else {
          throw new Error('비밀번호가 틀렸습니다.');
        }
      } else {
        throw new Error('아이디를 찾을 수 없습니다.');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '로그인 실패');
    }
  };

  const logout = async () => {
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      await signOut(auth);
    }
    localStorage.removeItem('student_session');
    setUser(null);
    setRole(null);
    setStudentSyncId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, loginAsTeacher, registerAsTeacher, loginAsStudent, logout }}>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <AnimatePresence mode="wait">
          {!user ? (
            <LoginScreen key="login" />
          ) : role === 'teacher' ? (
            <TeacherDashboard key="teacher" />
          ) : (
            <StudentDashboard key="student" />
          )}
        </AnimatePresence>
      </div>
    </AuthContext.Provider>
  );
}

function LoginScreen() {
  const { loginAsTeacher, registerAsTeacher, loginAsStudent } = useAuth();
  const { t } = useLanguage();
  const [studentId, setStudentId] = useState('');
  const [studentPw, setStudentPw] = useState('');
  const [rememberStudentId, setRememberStudentId] = useState(false);
  
  const [teacherId, setTeacherId] = useState('');
  const [teacherPw, setTeacherPw] = useState('');
  const [teacherSchool, setTeacherSchool] = useState('');
  const [teacherRealEmail, setTeacherRealEmail] = useState('');
  const [teacherJoinCode, setTeacherJoinCode] = useState('');
  
  const [isTeacherTab, setIsTeacherTab] = useState(false);
  const [isTeacherRegister, setIsTeacherRegister] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetId, setResetId] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const [schoolList, setSchoolList] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const showLoginRef = useRef(showLogin);
  useEffect(() => {
    showLoginRef.current = showLogin;
  }, [showLogin]);

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/intro sound.mp3');
    audio.loop = false;
    setAudioObj(audio);

    const tryPlay = async () => {
      if (showLoginRef.current) return;
      try {
        await audio.play();
        setIsAudioPlaying(true);
      } catch (err) {
        console.log("Autoplay blocked, waiting for interaction");
        const playOnInteract = async () => {
          document.removeEventListener('click', playOnInteract);
          document.removeEventListener('touchstart', playOnInteract);
          setTimeout(async () => {
            if (!showLoginRef.current) {
              try {
                await audio.play();
                setIsAudioPlaying(true);
              } catch(e) {}
            }
          }, 50);
        };
        document.addEventListener('click', playOnInteract);
        document.addEventListener('touchstart', playOnInteract);
      }
    };
    
    // Attempt play on mount
    tryPlay();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (audioObj) {
      if (showLogin) {
        audioObj.pause();
        setIsAudioPlaying(false);
      } else {
        audioObj.currentTime = 0;
        audioObj.play().then(() => setIsAudioPlaying(true)).catch(e => console.log("Autoplay blocked returning to intro: ", e));
      }
    }
  }, [showLogin, audioObj]);

  const toggleAudio = () => {
    if (audioObj) {
      if (isAudioPlaying) {
        audioObj.pause();
        setIsAudioPlaying(false);
      } else {
        audioObj.play().then(() => setIsAudioPlaying(true)).catch(e => console.error(e));
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!resetId || !resetEmail) {
      alert('아이디와 이메일을 모두 입력해주세요.');
      return;
    }
    try {
      const mappingDoc = await getDoc(doc(db, 'teacherMappings', resetId));
      if (mappingDoc.exists() && mappingDoc.data().realEmail === resetEmail) {
        await sendPasswordResetEmail(auth, resetEmail);
        alert('비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.');
        setShowPasswordReset(false);
        setResetId('');
        setResetEmail('');
      } else {
        alert('가입된 아이디와 이메일 정보가 일치하지 않습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('이메일 전송에 실패했습니다. 올바른 정보인지 확인해주세요.');
    }
  };

  useEffect(() => {
    if (isTeacherRegister) {
      const fetchSchools = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'schools'));
          const schools = snapshot.docs.map(doc => doc.data().name as string);
          setSchoolList(schools);
        } catch (e) {
          console.error("Failed to fetch schools", e);
        }
      };
      fetchSchools();
    }
  }, [isTeacherRegister]);

  useEffect(() => {
    const savedId = localStorage.getItem('remembered_student_id');
    if (savedId) {
      setStudentId(savedId);
      setRememberStudentId(true);
    }
  }, []);

  const handleStudentLogin = () => {
    if (rememberStudentId) {
      localStorage.setItem('remembered_student_id', studentId);
    } else {
      localStorage.removeItem('remembered_student_id');
    }
    loginAsStudent(studentId, studentPw);
  };

  if (!showLogin) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-[#1a73e8] to-[#81d4fa]">
        
        {/* Audio Toggle Button */}
        <div className="absolute top-4 right-4 z-50">
          <button onClick={toggleAudio} className="p-3 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all" title={isAudioPlaying ? "음소거" : "음악 재생"}>
            {isAudioPlaying ? <Volume2 className="text-white w-6 h-6" /> : <VolumeX className="text-opacity-70 text-white w-6 h-6" />}
          </button>
        </div>

        {/* Animated Clouds Background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Cloud 1 */}
          <motion.div animate={{ x: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-[10%] opacity-80">
            <div className="w-32 h-12 bg-white rounded-full absolute" />
            <div className="w-16 h-16 bg-white rounded-full absolute -top-6 left-4" />
            <div className="w-20 h-20 bg-white rounded-full absolute -top-10 left-10" />
          </motion.div>
          {/* Cloud 2 */}
          <motion.div animate={{ x: [0, -20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute top-40 right-[15%] opacity-60 scale-75">
            <div className="w-32 h-12 bg-white rounded-full absolute" />
            <div className="w-16 h-16 bg-white rounded-full absolute -top-6 left-4" />
            <div className="w-20 h-20 bg-white rounded-full absolute -top-10 left-10" />
          </motion.div>
          {/* Cloud 3 */}
          <motion.div animate={{ x: [0, 40, 0] }} transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }} className="absolute top-72 -left-[5%] opacity-50 scale-125">
            <div className="w-32 h-12 bg-white rounded-full absolute" />
            <div className="w-16 h-16 bg-white rounded-full absolute -top-6 left-4" />
            <div className="w-20 h-20 bg-white rounded-full absolute -top-10 left-10" />
          </motion.div>
          {/* Cloud 4 */}
          <motion.div animate={{ x: [0, -30, 0] }} transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-40 right-[5%] opacity-70 scale-110">
            <div className="w-32 h-12 bg-white rounded-full absolute" />
            <div className="w-16 h-16 bg-white rounded-full absolute -top-6 left-4" />
            <div className="w-20 h-20 bg-white rounded-full absolute -top-10 left-10" />
          </motion.div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <motion.img
            src="/intro_star.png"
            alt="Star"
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.6, duration: 1, delay: 0.2 }}
            className="w-24 md:w-32 h-auto relative z-20 mb-2 drop-shadow-2xl"
          />
          <motion.img
            src="/intro_morningquest.png"
            alt="Morning Quest"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8, delay: 0.4 }}
            className="w-80 md:w-[28rem] h-auto relative z-10 drop-shadow-2xl"
          />
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLogin(true)}
          className="absolute bottom-24 md:bottom-32 landscape:md:bottom-16 lg:bottom-24 z-10 group"
        >
          <div className="relative w-64 md:w-72">
            <img 
              src="/intro_button.png" 
              alt="시작하기" 
              className="w-full h-auto drop-shadow-xl transition-opacity duration-300 group-hover:opacity-0" 
            />
            <img 
              src="/intro_button2.png" 
              alt="시작하기 호버" 
              className="absolute inset-0 w-full h-auto drop-shadow-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" 
            />
          </div>
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#1a73e8] to-[#64b5f6] relative overflow-hidden"
    >
      {/* Background elements for login screen */}
      <div className="absolute bottom-0 w-full h-48 bg-white opacity-20" style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0', transform: 'scaleX(1.5)' }} />

      {/* Top right controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSelector />
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border-4 border-white/50 backdrop-blur-sm">
        <button 
          onClick={() => setShowLogin(false)}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
        >
          ← 뒤로
        </button>

        <div className="text-center mb-8 mt-4">
          <h1 
            className="text-5xl font-jayeon font-black text-[#ffca28] tracking-tight"
            style={{
              WebkitTextStroke: '2px #ffca28',
            }}
          >
            MORNING QUEST
          </h1>
        </div>

        <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setIsTeacherTab(false)}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${!isTeacherTab ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            {t('login_student')}
          </button>
          <button
            onClick={() => setIsTeacherTab(true)}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${isTeacherTab ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            {t('teacher_login')}
          </button>
        </div>

        {isTeacherTab ? (
          isTeacherRegister ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2 pb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <input
                  type="text"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="사용할 아이디 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일 (비밀번호 찾기용)</label>
                <input
                  type="email"
                  value={teacherRealEmail}
                  onChange={(e) => setTeacherRealEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="실제 이메일 주소 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  value={teacherPw}
                  onChange={(e) => setTeacherPw(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="비밀번호 입력 (6자리 이상)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
                <input
                  type="text"
                  list="school-options"
                  value={teacherSchool}
                  onChange={(e) => setTeacherSchool(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="학교 이름 입력 (예: 서울초등학교)"
                />
                <datalist id="school-options">
                  {schoolList.map((school, idx) => (
                    <option key={idx} value={school} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">교사 가입 코드</label>
                <input
                  type="text"
                  value={teacherJoinCode}
                  onChange={(e) => setTeacherJoinCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="발급받은 교사 코드를 입력하세요"
                />
              </div>
              <button
                onClick={() => registerAsTeacher(teacherId, teacherPw, teacherSchool, teacherRealEmail, teacherJoinCode)}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                회원가입
              </button>
              <p className="text-sm text-center text-gray-500 mt-4">
                이미 계정이 있으신가요?{' '}
                <button onClick={() => setIsTeacherRegister(false)} className="text-indigo-600 font-bold hover:underline">
                  로그인하기
                </button>
              </p>
            </div>
          ) : showPasswordReset ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-center mb-2">비밀번호 찾기</h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                가입 시 등록하신 아이디와 이메일을 입력하시면, 비밀번호 재설정 링크를 보내드립니다.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <input
                  type="text"
                  value={resetId}
                  onChange={(e) => setResetId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="가입된 아이디 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="가입된 이메일 입력"
                />
              </div>
              <button
                onClick={handlePasswordReset}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                비밀번호 재설정 링크 받기
              </button>
              <p className="text-sm text-center mt-4">
                <button onClick={() => setShowPasswordReset(false)} className="text-gray-500 font-bold hover:text-gray-700 hover:underline">
                  로그인으로 돌아가기
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <input
                  type="text"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="선생님 아이디"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  value={teacherPw}
                  onChange={(e) => setTeacherPw(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="비밀번호 입력"
                />
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm font-bold text-indigo-500 hover:text-indigo-700 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <button
                onClick={() => loginAsTeacher(teacherId, teacherPw)}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                선생님 로그인
              </button>
              <p className="text-sm text-center text-gray-500 mt-4">
                계정이 없으신가요?{' '}
                <button onClick={() => setIsTeacherRegister(true)} className="text-indigo-600 font-bold hover:underline">
                  회원가입하기
                </button>
              </p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('id')}</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all"
                placeholder="선생님이 알려준 아이디"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
              <input
                type="password"
                value={studentPw}
                onChange={(e) => setStudentPw(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all"
                placeholder="비밀번호 입력"
              />
            </div>
            <div className="flex justify-start items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberStudentId}
                  onChange={(e) => setRememberStudentId(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer border-gray-300"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">아이디 기억하기</span>
              </label>
            </div>
            <button
              onClick={handleStudentLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              {t('login')}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
