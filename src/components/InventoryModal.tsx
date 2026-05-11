import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Student } from '../types';
import { X, Package, Check, Clock, Trophy } from 'lucide-react';

interface Props {
  student: Student;
  onClose: () => void;
}

export default function InventoryModal({ student, onClose }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'purchaseRecords'), where('studentId', '==', student.studentId));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [student.studentId]);

  const handleUseItem = async (it: any) => {
    if (it.used) return;
    
    try {
      if (it.isTitle) {
        // Update student's title
        await updateDoc(doc(db, 'students', student.studentId), {
          title: it.itemName
        });
      }
      
      // Mark item as used
      await updateDoc(doc(db, 'purchaseRecords', it.id), {
        used: true
      });
      
      alert(it.isTitle ? `'${it.itemName}' 칭호가 적용되었습니다!` : `'${it.itemName}' 사용 처리를 완료했습니다.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'purchaseRecords');
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, 'purchaseRecords', itemToDelete));
      setItemToDelete(null);
    } catch (e) {
      alert('삭제 권한이 없거나 실패했습니다.');
      console.error(e);
      setItemToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-emerald-500 p-6 text-center text-white">
          <div className="flex justify-center mb-2">
            <Package className="w-12 h-12 text-emerald-200" />
          </div>
          <h2 className="text-2xl font-black mb-1">내 창고</h2>
          <p className="text-emerald-100 text-sm">상점에서 구매한 아이템들이 보관되어 있어요!</p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {items.filter(it => !(it.isTitle && it.used)).length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold">
              아직 구매한 아이템이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {items.filter(it => !(it.isTitle && it.used)).sort((a,b) => b.purchasedAt - a.purchasedAt).map(it => (
                <div key={it.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${it.used ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-emerald-100 shadow-sm'}`}>
                  <div className="text-4xl">{it.itemImage || '🎁'}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800 text-lg">{it.itemName}</h4>
                      {it.isTitle && (
                        <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                          <Trophy className="w-3 h-3" /> 칭호
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(it.purchasedAt).toLocaleDateString()} 구매
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {it.used ? (
                      <div className="group relative">
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1.5 rounded-full group-hover:hidden cursor-default">
                          <Check className="w-3 h-3" /> 사용 완료
                        </span>
                        <button
                          onClick={() => setItemToDelete(it.id)}
                          className="hidden group-hover:flex items-center gap-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3" /> 기록 삭제
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUseItem(it)}
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                          it.isTitle 
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                            : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        }`}
                      >
                         {it.isTitle ? (
                           <>적용하기</>
                         ) : (
                           <><Clock className="w-3 h-3" /> 사용하기</>
                         )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-bold mb-2">기록 삭제</h3>
            <p className="text-gray-500 mb-6">사용 완료된 아이템 기록을 삭제하시겠습니까?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
              >
                취소
              </button>
              <button 
                onClick={handleDeleteItem}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
