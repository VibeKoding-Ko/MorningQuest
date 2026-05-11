import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Student, ShopItem } from '../types';
import { Star, X, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';

interface ShopScreenProps {
  student: Student;
  onClose: () => void;
}

export default function ShopScreen({ student, onClose }: ShopScreenProps) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'shopItems'), where('classId', '==', student.classId));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => doc.data() as ShopItem));
    }, (error) => console.error(error));
    return () => unsub();
  }, [student.classId]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePurchaseClick = (item: ShopItem) => {
    if ((item.quantity ?? 0) <= 0) {
      showMessage('error', '품절된 아이템입니다.');
      return;
    }
    
    if ((student.starPieces || 0) < item.price) {
      showMessage('error', '별조각이 부족합니다!');
      return;
    }
    
    setConfirmItem(item);
  };

  const executePurchase = async () => {
    if (!confirmItem) return;
    const item = confirmItem;
    setPurchasingId(item.id);
    setConfirmItem(null);
    try {
      const studentRef = doc(db, 'students', student.studentId);
      const purchaseId = `${student.studentId}_${Date.now()}`;
      
      await setDoc(doc(db, 'purchaseRecords', purchaseId), {
        id: purchaseId,
        classId: student.classId,
        studentId: student.studentId,
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        isTitle: item.isTitle || false,
        purchasedAt: Date.now(),
        used: false
      });

      const itemRef = doc(db, 'shopItems', item.id);
      await updateDoc(itemRef, {
        quantity: (item.quantity ?? 0) - 1
      });

      await updateDoc(studentRef, {
        starPieces: (student.starPieces || 0) - item.price
      });
      
      showMessage('success', `'${item.name}' 구매를 성공적으로 완료했습니다!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'purchaseRecords');
      showMessage('error', '구매 처리 중 오류가 발생했습니다.');
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>
        
        <div className="bg-indigo-600 p-8 text-center text-white relative">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="w-16 h-16 text-indigo-200" />
          </div>
          <h2 className="text-4xl font-black mb-2">별빛 상점</h2>
          <p className="text-indigo-200 font-medium">열심히 모은 별조각으로 멋진 아이템을 교환해 보세요!</p>
          
          <div className="inline-flex mt-6 items-center gap-2 bg-white/20 px-6 py-3 rounded-full border border-white/30 backdrop-blur-md">
            <span className="text-xl">⭐️</span>
            <span className="text-xl font-bold">내 별조각: {student.starPieces || 0}개</span>
          </div>

          {/* Toast Message Overlay */}
          {message && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 animate-bounce ${
              message.type === 'success' ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-red-100 text-red-700 border-2 border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}
        </div>

        <div className="p-8 overflow-y-auto bg-gray-50 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold">
              아직 상점에 물건이 없어요. 선생님이 준비 중입니다!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {items.map(item => {
                const stock = item.quantity ?? 0;
                const isSoldOut = stock <= 0;
                return (
                <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all text-center flex flex-col ${isSoldOut ? 'border-gray-200 opacity-70' : 'border-indigo-50 hover:border-indigo-200'}`}>
                  <h3 className="text-lg font-black text-gray-800 mb-1">{item.name}</h3>
                  {item.description && (
                    <p className="text-gray-500 text-xs mb-4 flex-1 break-keep-all">{item.description}</p>
                  )}
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold flex items-center gap-1 text-indigo-600">
                        <Star className="w-4 h-4 fill-indigo-600" /> {item.price}
                      </span>
                      <span className="font-bold text-gray-500">
                        남은 수량: {stock}개
                      </span>
                    </div>
                    <button
                      onClick={() => handlePurchaseClick(item)}
                      disabled={purchasingId === item.id || (student.starPieces || 0) < item.price || isSoldOut}
                      className="w-full flex justify-center items-center gap-2 py-3 mt-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSoldOut ? '품절' : '구매'}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirm Modal */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-black mb-2 text-gray-800">'{confirmItem.name}' 구매</h3>
            <p className="text-gray-500 font-medium mb-6">
              이 아이템을 <span className="font-bold text-indigo-600">{confirmItem.price} 별조각</span>으로 정말 구매할까요?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmItem(null)} 
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                취소
              </button>
              <button 
                onClick={executePurchase} 
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
              >
                구매하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
