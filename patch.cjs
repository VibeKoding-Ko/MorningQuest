const fs = require('fs');
const targetContent = fs.readFileSync('TargetContent.txt', 'utf8');

const classManagementCode = `  function ClassManagement({ classes, selectedClassId, onSelectClass, students, teacher }: { classes: any[]; selectedClassId: string | null; onSelectClass: (id: string | null) => void; students: Student[]; teacher: Teacher }) {
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
  const [newPassword, setNewPassword] = useState("");

  // Individual Student
  const [newId, setNewId] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newStudentNumber, setNewStudentNumber] = useState("");

  // Bulk Students
  const [bulkPrefix, setBulkPrefix] = useState("");
  const [bulkCount, setBulkCount] = useState("");
  const [bulkPw, setBulkPw] = useState("1234");

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classYear || !classGrade || !classNumber) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    const newClassId = \`class_\${teacher.uid}_\${Date.now()}\`;
    const newClass = {
      id: newClassId,
      teacherUid: teacher.uid,
      year: classYear,
      grade: parseInt(classGrade),
      classNumber: parseInt(classNumber),
      name: \`\${classYear}학년도 \${classGrade}학년 \${classNumber}반\`
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

  const handleDeleteClass = async () => {
    if (!selectedClassId) return;
    if (!window.confirm("정말 이 학급을 삭제하시겠습니까? 관련 데이터가 보호됩니다.")) return;
    try {
      await deleteDoc(doc(db, "classes", selectedClassId));
      onSelectClass(null);
    } catch (e) {
      alert("학급 삭제 오류");
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
      name: \`\${selectedClass.grade}학년 \${selectedClass.classNumber}반 \${n}번\`, // Generated name
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
      const numStr = i.toString().padStart(2, "0");
      const genId = \`\${bulkPrefix}\${yearStr}\${gradeStr}\${classStr}\${numStr}\`;
      generatedIds.push(genId);
      
      const pwd = bulkPw || genId; // Use ID as password if no common password provided
      const studentName = \`\${i}번\`; // Just using number based on user preference

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

    // Check overlaps
    let hasOverlap = false;
    for (const id of generatedIds) {
      if (await checkStudentExists(id)) {
        hasOverlap = true;
        break;
      }
    }

    if (hasOverlap) {
      alert("생성하려는 아이디 중 이미 데이터베이스에 존재하는 아이디가 있습니다. 생성을 중단합니다.");
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
      alert(\`\${count}명의 학생이 일괄 생성되었습니다.\`);
    } catch (e) {
      alert("일괄 생성 실패");
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteDoc(doc(db, "students", studentToDelete.id));
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, \`students/\${studentToDelete.id}\`);
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
      alert(\`레벨이 \${newLevel}로 변경되었습니다.\`);
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
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all \${selectedClassId === c.id ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}\`}
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
                onClick={handleDeleteClass} 
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
                  <th className="px-6 py-4 font-semibold text-gray-600">이름</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">아이디</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">레벨</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">경험치</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.sort((a, b) => a.number - b.number).map(s => (
                  <tr key={s.studentId} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4 font-bold">{s.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono">{s.studentId}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <RankBadge level={s.level} />
                      <select
                        value={s.level}
                        onChange={(e) => handleLevelChange(s.studentId, s.level, e.target.value)}
                        className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:border-blue-500 font-bold"
                      >
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(l => (
                          <option key={l} value={l}>Lv.{l}</option>
                        ))}
                      </select>
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
            <h3 className="text-xl font-bold mb-2">학생 일괄 생성</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-700">생성 규칙:</span><br/>접두사 + 학년도 끝2자리 + 학년 + 반(2) + 번호(2)<br/>
              예) wg2540301 (wg+25+4+03+01)
            </p>
            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">반복아이디 (접두사)</label>
                <input type="text" value={bulkPrefix} onChange={e => setBulkPrefix(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="예: wg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">몇 번까지 생성하시겠습니까?</label>
                <input type="number" value={bulkCount} onChange={e => setBulkCount(e.target.value)} required min="1" max="100" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="예: 25" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공통 비밀번호</label>
                <input type="text" value={bulkPw} onChange={e => setBulkPw(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="기본 비밀번호 (1234)" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBulkAddModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">취소</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">일괄 생성</button>
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
            <p className="text-gray-500 mb-6 font-medium text-sm">정말 <span className="font-bold text-gray-800">{studentToDelete.name}</span> 학생을 삭제하시겠습니까? 관련된 데이터가 모두 영구 삭제됩니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold">취소</button>
              <button onClick={handleDeleteStudent} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-bold">삭제하기</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-6">비밀번호 변경</h3>
            <p className="text-sm text-gray-500 mb-4 font-medium"><span className="text-gray-800 font-bold">{editingStudent.name}</span> 학생의 새 비밀번호를 입력하세요.</p>
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
    </div>
  );
}
`;

let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');
code = code.replace(targetContent, classManagementCode);
fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
