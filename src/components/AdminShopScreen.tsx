import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { Student, ShopItem } from '../types';
import { Plus, Trash2, Edit2, CheckCircle2, Star, Check, Minus } from 'lucide-react';

export default function AdminShopScreen({ classId, students }: { classId: string, students: Student[] }) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('10');
  const [quantity, setQuantity] = useState('10');
  const [itemType, setItemType] = useState<'general' | 'title'>('general');

  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [adjustingStudent, setAdjustingStudent] = useState<{id: string, name: string, type: 'add' | 'remove'} | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('10');

  const confirmAdjustStars = async () => {
    if (!adjustingStudent) return;
    const amount = Number(adjustAmount);
    if (!amount || amount <= 0) return;

    try {
      const diff = adjustingStudent.type === 'add' ? amount : -amount;
      if (adjustingStudent.id === 'all') {
        const batch = students.map(s => 
          updateDoc(doc(db, 'students', s.studentId), {
            starPieces: increment(diff)
          })
        );
        await Promise.all(batch);
      } else {
        await updateDoc(doc(db, 'students', adjustingStudent.id), {
          starPieces: increment(diff)
        });
      }
      setAdjustingStudent(null);
      setAdjustAmount('10');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'students');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'shopItems'), where('classId', '==', classId));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => doc.data() as ShopItem));
    }, (error) => { if (error.code !== 'permission-denied') console.error(error); });
    return () => unsub();
  }, [classId]);

  useEffect(() => {
    const q = query(collection(db, 'purchaseRecords'), where('classId', '==', classId));
    const unsub = onSnapshot(q, (snapshot) => {
      setPurchases(snapshot.docs.map(doc => doc.data()));
    }, (error) => { if (error.code !== 'permission-denied') console.error(error); });
    return () => unsub();
  }, [classId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    
    const id = editingItem ? editingItem.id : `${classId}_${Date.now()}`;
    try {
      await setDoc(doc(db, 'shopItems', id), {
        id,
        classId,
        name,
        description: itemType === 'general' ? desc : '',
        price: Number(price),
        quantity: Number(quantity),
        isTitle: itemType === 'title',
        createdAt: editingItem ? editingItem.createdAt : Date.now()
      });
      setShowAdd(false);
      setEditingItem(null);
      setName('');
      setDesc('');
      setPrice('10');
      setQuantity('10');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'shopItems');
    }
  };

  const handleDelete = async () => {
    if (!deletingItemId) return;
    try {
      await deleteDoc(doc(db, 'shopItems', deletingItemId));
      setDeletingItemId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'shopItems');
    }
  };

  const handleToggleUsed = async (p: any) => {
    try {
      await updateDoc(doc(db, 'purchaseRecords', p.id), {
        used: !p.used
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'purchaseRecords');
    }
  };

  const openEdit = (item: ShopItem) => {
    setEditingItem(item);
    setName(item.name);
    setDesc(item.description || '');
    setPrice(item.price.toString());
    setQuantity((item.quantity ?? 10).toString());
    setItemType(item.isTitle ? 'title' : 'general');
    setShowAdd(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">상점 관리</h2>
        <button 
          onClick={() => { setShowAdd(true); setEditingItem(null); setName(''); setDesc(''); setPrice('10'); setQuantity('10'); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" /> 새 아이템
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-4">현재 상점 아이템 ({items.length})</h3>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg text-gray-800">{item.name}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeletingItemId(item.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {item.description && <p className="text-sm text-gray-500 mb-2">{item.description}</p>}
                <div className="flex justify-between items-center mt-auto">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                      <Star className="w-4 h-4 fill-indigo-600" /> {item.price} 
                    </div>
                    {item.isTitle && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 italic">칭호 아이템</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    수량: {item.quantity ?? 0}개
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center p-8 text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
                아직 등록된 아이템이 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4">학생 창고 현황 (구매 내역)</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">학생</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">구매 아이템</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">상태</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-400">구매 내역이 없습니다.</td></tr>
                  ) : purchases.sort((a,b) => b.purchasedAt - a.purchasedAt).map(p => {
                    const s = students.find(st => st.studentId === p.studentId);
                    return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.used ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-bold">{s ? (s.nickname || s.name) : '알수없음'}</td>
                        <td className="px-4 py-3 font-bold text-gray-800">{p.itemName}</td>
                        <td className="px-4 py-3">
                          {p.used ? (
                            <span className="text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded text-xs">사용완료</span>
                          ) : (
                            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs">대기중</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleUsed(p)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${p.used ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                          >
                            {p.used ? '사용 취소' : '사용 완료 처리'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold">학생별 별조각 현황</h3>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setAdjustingStudent({ id: 'all', name: '전체 학생', type: 'add' })}
                   className="p-1 px-3 border border-green-200 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition shadow-sm text-sm font-bold flex items-center gap-1"
                 >
                   전체 <Plus className="w-4 h-4 inline" />
                 </button>
                 <button 
                   onClick={() => setAdjustingStudent({ id: 'all', name: '전체 학생', type: 'remove' })}
                   className="p-1 px-3 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition shadow-sm text-sm font-bold flex items-center gap-1"
                 >
                   전체 <Minus className="w-4 h-4 inline" />
                 </button>
               </div>
             </div>
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-100">
                   <tr>
                     <th className="px-4 py-3 font-semibold text-gray-600">닉네임</th>
                     <th className="px-4 py-3 font-semibold text-gray-600 text-right">별조각</th>
                     <th className="px-4 py-3 font-semibold text-gray-600 text-center w-32">관리</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {students.sort((a,b) => (b.starPieces || 0) - (a.starPieces || 0)).map(s => (
                     <tr key={s.studentId} className="hover:bg-gray-50">
                       <td className="px-4 py-3 font-bold">{s.nickname || s.name}</td>
                       <td className="px-4 py-3 text-right font-bold text-indigo-600 flex items-center justify-end gap-1">
                         <Star className="w-4 h-4 fill-indigo-600" /> {s.starPieces || 0}
                       </td>
                       <td className="px-4 py-3 text-center">
                         <div className="flex justify-center gap-2">
                           <button 
                             onClick={() => setAdjustingStudent({ id: s.studentId, name: s.nickname || s.name, type: 'add' })}
                             className="p-1.5 border border-green-200 bg-green-50 text-green-700 rounded hover:bg-green-100 transition shadow-sm text-xs font-bold w-8 flex justify-center items-center"
                           >
                             <Plus className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => setAdjustingStudent({ id: s.studentId, name: s.nickname || s.name, type: 'remove' })}
                             className="p-1.5 border border-red-200 bg-red-50 text-red-700 rounded hover:bg-red-100 transition shadow-sm text-xs font-bold w-8 flex justify-center items-center"
                           >
                             <Minus className="w-4 h-4" />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>

      {adjustingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">
              {adjustingStudent.type === 'add' ? '별조각 추가' : '별조각 뺏기'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              <span className="font-bold text-gray-800">{adjustingStudent.name}</span> 학생에게 {adjustingStudent.type === 'add' ? '추가할' : '뺏을'} 별조각 개수를 입력하세요.
            </p>
            <input 
              type="number" 
              value={adjustAmount} 
              onChange={(e) => setAdjustAmount(e.target.value)} 
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none mb-6"
              min="1"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => { setAdjustingStudent(null); setAdjustAmount('10'); }} 
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold"
              >
                취소
              </button>
              <button 
                onClick={confirmAdjustStars} 
                className={`flex-1 py-3 text-white rounded-xl transition-all font-bold ${adjustingStudent.type === 'add' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {adjustingStudent.type === 'add' ? '추가하기' : '뺏기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
             <h3 className="text-xl font-bold mb-6">{editingItem ? '아이템 수정' : '새 아이템 추가'}</h3>
             
             <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
               <button 
                 type="button"
                 onClick={() => setItemType('general')}
                 className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${itemType === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
               >
                 일반 아이템
               </button>
               <button 
                 type="button"
                 onClick={() => setItemType('title')}
                 className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${itemType === 'title' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
               >
                 칭호 아이템
               </button>
             </div>

             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">
                   {itemType === 'title' ? '칭호 이름' : '아이템 이름'}
                 </label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none" />
               </div>
               
               {itemType === 'general' && (
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">설명 (선택)</label>
                   <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none" />
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">가격 (별조각)</label>
                   <input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">수량</label>
                   <input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none" />
                 </div>
               </div>

               <div className="flex gap-2 pt-4">
                 <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold">취소</button>
                 <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold">저장하기</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {deletingItemId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">아이템 삭제</h3>
            <p className="text-gray-500 mb-6">정말로 이 아이템을 삭제하시겠습니까?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingItemId(null)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold">취소</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold">삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
