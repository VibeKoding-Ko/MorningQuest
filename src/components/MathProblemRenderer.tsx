import React from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import { renderMathText } from './MathProblemScreen';

export function MathProblemList({ problems, userAnswers, onChangeAnswer, mode = 'solve', area }: {
  problems: { question: string; correctAnswer: string }[];
  userAnswers?: string[];
  onChangeAnswer?: (i: number, val: string) => void;
  mode?: 'solve' | 'preview' | 'new';
  area?: string;
}) {
  const problemData = problems.map((p, i) => {
    let parsedQ = null;
    try { parsedQ = JSON.parse(p.question); } catch (e) {}
    const verticalMatch = p.question.match(/^([\d.]+)\n([+\-×÷])\s*([\d.]+)\n---$/);
    const isVertical = !!verticalMatch || p.question.includes('LONGDIV');
    return { p, i, parsedQ, verticalMatch, isVertical };
  });

  const horizontalProblems = problemData.filter(d => !d.isVertical);
  const verticalProblems = problemData.filter(d => d.isVertical);

  const hasFractions = problemData.some(d => d.p.question.includes('FRAC') || d.p.question.includes('MIXED'));
  const hasMultipleAnswers = horizontalProblems.some(d => String(d.p.correctAnswer || '').includes(','));
  const hasParenthesesOrBrackets = horizontalProblems.some(d => /[(){}\[\]]/.test(d.p.question) && !/(FRAC|MIXED|LONGDIV|Q_R)\(/.test(d.p.question));

  const maxHorizontalDigitLen = horizontalProblems.reduce((max, d) => {
    const qLen = d.p.question.replace(/[^0-9]/g, '').length;
    const aLen = String(d.p.correctAnswer || '').replace(/[^0-9]/g, '').length;
    return Math.max(max, qLen + aLen);
  }, 0);
  
  let horizontalGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  
  // Custom Area Overrides
  if (area?.startsWith('5_1_1_')) {
    if (hasParenthesesOrBrackets) {
       horizontalGridClass = "grid-cols-1";
    } else {
       horizontalGridClass = "grid-cols-1 md:grid-cols-2";
    }
  } else if (area === '6_2_2_10' || area === '6_2_2_11') {
    horizontalGridClass = "grid-cols-1";
  } else if (area?.startsWith('6_1_2') || area?.startsWith('6_2_2') || area?.startsWith('5_2_2')) {
    horizontalGridClass = "grid-cols-1 md:grid-cols-2";
  } else if (maxHorizontalDigitLen > 8 || hasMultipleAnswers) {
    horizontalGridClass = "grid-cols-1 md:grid-cols-2";
  } else if (maxHorizontalDigitLen > 6 || hasFractions) {
    horizontalGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
  }

  let verticalGridClass = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  const maxVerticalLen = verticalProblems.reduce((max, d) => d.verticalMatch ? Math.max(max, d.verticalMatch[1].length, d.verticalMatch[3].length) : max, 0);
  
  // Custom Area Overrides for Vertical
  if (area?.startsWith('5_1_1_')) {
    if (hasParenthesesOrBrackets) {
       verticalGridClass = "grid-cols-1";
    } else {
       verticalGridClass = "grid-cols-1 md:grid-cols-2";
    }
  } else if (area === '6_2_2_10' || area === '6_2_2_11') {
    verticalGridClass = "grid-cols-1";
  } else if (area?.startsWith('6_1_2') || area?.startsWith('6_2_2') || area?.startsWith('5_2_2')) {
    verticalGridClass = "grid-cols-1 md:grid-cols-2";
  } else if (maxVerticalLen >= 6) {
    verticalGridClass = "grid-cols-1 md:grid-cols-2";
  } else if (maxVerticalLen >= 4 || hasFractions) {
    verticalGridClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }

  const getAns = (i: number) => {
    if (mode === 'preview') return problems[i].correctAnswer;
    return userAnswers ? (userAnswers[i] || '') : '';
  };

  const handleAnsChange = (i: number, val: string) => {
    if (mode !== 'preview' && onChangeAnswer) {
      onChangeAnswer(i, val);
    }
  };

  const renderProblem = ({ p, i, parsedQ, verticalMatch, isVertical }: any, displayIndex: number) => {
    const expectedParts = p.correctAnswer.split(/,(?![^()]*\))/g);
    const ansParts = getAns(i).split(/,(?![^()]*\))/g);
    const isMany = expectedParts.length >= 3;
    const isPreview = mode === 'preview';

    const renderPart = (expected: string, ans: string, onChange: (v: string) => void) => {
      if (isPreview) {
         return <span className="font-black text-red-500 text-lg mx-1">{expected}</span>;
      }
      if (expected.startsWith('Q_R(')) {
        const parts = ans.split('...');
        const q = parts[0] || '';
        const r = parts[1] || '';
        return (
          <div className="flex items-center gap-1">
            <input value={q} onChange={e => onChange(e.target.value + '...' + r)} className="w-12 px-1 py-1 rounded border border-gray-200 bg-white text-center font-black text-sm sm:text-base text-blue-600 outline-none focus:border-blue-500" placeholder="몫" disabled={mode === 'new' && i === 0} />
            <span className="font-bold text-sm">...</span>
            <input value={r} onChange={e => onChange(q + '...' + e.target.value)} className="w-12 px-1 py-1 rounded border border-gray-200 bg-white text-center font-black text-sm sm:text-base text-blue-600 outline-none focus:border-blue-500" placeholder="나머지" disabled={mode === 'new' && i === 0} />
          </div>
        );
      }
      if (expected.startsWith('FRAC(')) {
        const parts = ans.split('/');
        const num = parts[0] || '';
        const den = parts[1] || '';
        return (
          <div className="inline-flex flex-col items-center mx-1 bg-white p-0.5 rounded border border-gray-200 shadow-sm align-middle">
            <input value={num} onChange={e => onChange(e.target.value + '/' + den)} className="w-8 h-6 text-center border-b border-gray-400 font-bold text-sm text-blue-600 outline-none bg-transparent" placeholder="?" disabled={mode === 'new' && i === 0} />
            <input value={den} onChange={e => onChange(num + '/' + e.target.value)} className="w-8 h-6 text-center font-bold text-sm text-blue-600 outline-none bg-transparent" placeholder="?" disabled={mode === 'new' && i === 0} />
          </div>
        );
      }
      if (expected.startsWith('MIXED(')) {
        const parts = ans.split('_');
        const w = parts[0] || '';
        const fracParts = (parts[1] || '').split('/');
        const num = fracParts[0] || '';
        const den = fracParts[1] || '';
        return (
          <div className="inline-flex items-center mx-1 bg-white p-0.5 rounded border border-gray-200 shadow-sm align-middle">
            <input value={w} onChange={e => onChange(e.target.value + '_' + num + '/' + den)} className="w-6 h-8 mr-1 text-center font-bold text-sm text-blue-600 outline-none bg-transparent" placeholder="?" disabled={mode === 'new' && i === 0} />
            <div className="inline-flex flex-col items-center">
              <input value={num} onChange={e => onChange(w + '_' + e.target.value + '/' + den)} className="w-6 h-5 text-center border-b border-gray-400 font-bold text-xs text-blue-600 outline-none bg-transparent" placeholder="?" disabled={mode === 'new' && i === 0} />
              <input value={den} onChange={e => onChange(w + '_' + num + '/' + e.target.value)} className="w-6 h-5 text-center font-bold text-xs text-blue-600 outline-none bg-transparent" placeholder="?" disabled={mode === 'new' && i === 0} />
            </div>
          </div>
        );
      }
      
      return (
        <input
          type="text"
          value={ans}
          onChange={(e) => onChange(e.target.value)}
          placeholder="정답"
          disabled={mode === 'new' && i === 0}
          className="w-16 sm:w-20 px-1 text-center font-bold text-base sm:text-lg text-blue-600 outline-none bg-white border border-gray-200 shadow-sm rounded-lg focus:border-blue-500 align-middle py-1.5"
        />
      );
    };

    const forceHorizontalAnswers = area?.startsWith('5_1_2_');
    const displayAsColumn = isMany && !forceHorizontalAnswers;

    const AnswersBlock = (
      <div className={"inline-flex items-center justify-center " + (displayAsColumn ? "flex-col gap-2" : "gap-1 flex-wrap")}>
        {expectedParts.map((exp, j) => (
          <React.Fragment key={j}>
            {j > 0 && <span className="font-bold text-gray-400">,</span>}
            {renderPart(exp, ansParts[j] || '', (v) => {
              const newAns = [...ansParts];
              newAns[j] = v;
              handleAnsChange(i, newAns.join(','));
            })}
          </React.Fragment>
        ))}
      </div>
    );

    if (parsedQ && parsedQ.type === 'relation_mul_div') {
      const updateAns = (idx: number, val: string) => {
        const newParts = [...ansParts.length < 6 ? ',,,,,'.split(',') : ansParts];
        newParts[idx] = val;
        handleAnsChange(i, newParts.join(','));
      };
      return (
        <div key={i} className="w-full flex flex-col items-center justify-center p-1 sm:p-2 bg-white rounded-xl border border-gray-100 shadow-sm relative min-h-[80px]">
           <div className="absolute top-2 left-3 flex items-center gap-2">
             <span className="text-blue-600 font-black text-sm">{displayIndex + 1}.</span>
             {mode === 'new' && i === 0 && <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">예시</span>}
           </div>
           <div className="text-lg font-bold text-gray-800 mb-2 mt-4 whitespace-nowrap">{parsedQ.n1} × {parsedQ.n2} = {parsedQ.prod}</div>
           <div className="flex flex-col gap-2 w-full max-w-[240px]">
             <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-800 bg-gray-50 p-2 rounded-lg whitespace-nowrap">
               <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
               <input readOnly={isPreview} value={ansParts[0] || ''} onChange={e => updateAns(0, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> ÷ 
               <input readOnly={isPreview} value={ansParts[1] || ''} onChange={e => updateAns(1, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> = 
               <input readOnly={isPreview} value={ansParts[2] || ''} onChange={e => updateAns(2, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} />
             </div>
             <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-800 bg-gray-50 p-2 rounded-lg whitespace-nowrap">
               <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
               <input readOnly={isPreview} value={ansParts[3] || ''} onChange={e => updateAns(3, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> ÷ 
               <input readOnly={isPreview} value={ansParts[4] || ''} onChange={e => updateAns(4, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> = 
               <input readOnly={isPreview} value={ansParts[5] || ''} onChange={e => updateAns(5, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} />
             </div>
           </div>
        </div>
      );
    }

    if (parsedQ && parsedQ.type === 'relation_div_mul') {
      const updateAns = (idx: number, val: string) => {
        const newParts = [...ansParts.length < 6 ? ',,,,,'.split(',') : ansParts];
        newParts[idx] = val;
        handleAnsChange(i, newParts.join(','));
      };
      return (
        <div key={i} className="w-full flex flex-col items-center justify-center p-1 sm:p-2 bg-white rounded-xl border border-gray-100 shadow-sm relative min-h-[80px]">
           <div className="absolute top-2 left-3 flex items-center gap-2">
             <span className="text-blue-600 font-black text-sm">{displayIndex + 1}.</span>
             {mode === 'new' && i === 0 && <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">예시</span>}
           </div>
           <div className="text-lg font-bold text-gray-800 mb-2 mt-4 whitespace-nowrap">{parsedQ.prod} ÷ {parsedQ.n1} = {parsedQ.n2}</div>
           <div className="flex flex-col gap-2 w-full max-w-[240px]">
             <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-800 bg-gray-50 p-2 rounded-lg whitespace-nowrap">
               <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
               <input readOnly={isPreview} value={ansParts[0] || ''} onChange={e => updateAns(0, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> × 
               <input readOnly={isPreview} value={ansParts[1] || ''} onChange={e => updateAns(1, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> = 
               <input readOnly={isPreview} value={ansParts[2] || ''} onChange={e => updateAns(2, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} />
             </div>
             <div className="flex items-center justify-center gap-1 text-xs font-bold text-gray-800 bg-gray-50 p-2 rounded-lg whitespace-nowrap">
               <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
               <input readOnly={isPreview} value={ansParts[3] || ''} onChange={e => updateAns(3, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> × 
               <input readOnly={isPreview} value={ansParts[4] || ''} onChange={e => updateAns(4, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} /> = 
               <input readOnly={isPreview} value={ansParts[5] || ''} onChange={e => updateAns(5, e.target.value)} className={"w-8 px-1 py-1 rounded text-center outline-none border border-gray-200" + (isPreview ? " text-red-500 font-black bg-transparent border-none w-auto min-w-[2rem]" : " text-blue-600")} />
             </div>
           </div>
        </div>
      );
    }

    if (parsedQ && parsedQ.type === 'split_gather') {
      const isSplit = parsedQ.mode === 'split';
      return (
        <div key={i} className="w-full flex flex-col items-center justify-center p-1 sm:p-2 bg-white rounded-xl border border-gray-100 shadow-sm relative min-h-[80px]">
           <div className="absolute top-2 left-3 flex items-center gap-2">
             <span className="text-blue-600 font-black text-sm">{displayIndex + 1}.</span>
             {mode === 'new' && i === 0 && <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">예시</span>}
           </div>
           <div className="mt-4 w-full flex justify-center">
             <div className="border border-gray-800 flex flex-col w-20 bg-white">
               {isSplit ? (
                 <>
                   <div className="border-b border-gray-800 text-center py-1 text-base font-bold text-gray-800">{parsedQ.top}</div>
                   <div className="flex h-8">
                     <div className="w-1/2 border-r border-gray-800 text-center flex items-center justify-center">
                       {parsedQ.bottom1 === '?' ? <input readOnly={isPreview} value={getAns(i) || ''} onChange={e => handleAnsChange(i, e.target.value)} className={"w-full text-center font-bold text-base outline-none" + (isPreview ? " text-red-500 bg-transparent" : " text-blue-600")} /> : <span className="font-bold text-base">{parsedQ.bottom1}</span>}
                     </div>
                     <div className="w-1/2 text-center flex items-center justify-center">
                       {parsedQ.bottom2 === '?' ? <input readOnly={isPreview} value={getAns(i) || ''} onChange={e => handleAnsChange(i, e.target.value)} className={"w-full text-center font-bold text-base outline-none" + (isPreview ? " text-red-500 bg-transparent" : " text-blue-600")} /> : <span className="font-bold text-base">{parsedQ.bottom2}</span>}
                     </div>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="flex border-b border-gray-800 h-8">
                     <div className="w-1/2 border-r border-gray-800 text-center flex items-center justify-center">
                       {parsedQ.top1 === '?' ? <input readOnly={isPreview} value={getAns(i) || ''} onChange={e => handleAnsChange(i, e.target.value)} className={"w-full text-center font-bold text-base outline-none" + (isPreview ? " text-red-500 bg-transparent" : " text-blue-600")} /> : <span className="font-bold text-base">{parsedQ.top1}</span>}
                     </div>
                     <div className="w-1/2 text-center flex items-center justify-center">
                       {parsedQ.top2 === '?' ? <input readOnly={isPreview} value={getAns(i) || ''} onChange={e => handleAnsChange(i, e.target.value)} className={"w-full text-center font-bold text-base outline-none" + (isPreview ? " text-red-500 bg-transparent" : " text-blue-600")} /> : <span className="font-bold text-base">{parsedQ.top2}</span>}
                     </div>
                   </div>
                   <div className="text-center flex items-center justify-center h-8">
                     {parsedQ.bottom === '?' ? <input readOnly={isPreview} value={getAns(i) || ''} onChange={e => handleAnsChange(i, e.target.value)} className={"w-full text-center font-bold text-base outline-none" + (isPreview ? " text-red-500 bg-transparent" : " text-blue-600")} /> : <span className="font-bold text-base">{parsedQ.bottom}</span>}
                   </div>
                 </>
               )}
             </div>
           </div>
        </div>
      );
    }

    return (
      <div key={i} className="w-full flex flex-col items-center justify-center p-1 sm:p-2 bg-white rounded-xl border border-gray-100 shadow-sm relative min-h-[80px]">
        <div className="absolute top-2 left-3 flex items-center gap-2">
           <span className="text-blue-600 font-black text-sm">{displayIndex + 1}.</span>
           {mode === 'new' && i === 0 && <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">예시</span>}
        </div>
        
        <div className="mt-4 mb-2 w-full flex justify-center flex-wrap items-center">
          {parsedQ && parsedQ.type === 'equivalent_fraction' ? (
            <div className="flex items-center gap-2 text-base font-bold text-gray-800 whitespace-nowrap">
              <div className="inline-flex flex-col items-center mx-1">
                <span className="border-b-2 border-black px-1 leading-tight">{parsedQ.num}</span>
                <span className="px-1 leading-tight">{parsedQ.den}</span>
              </div>
              <span className="mx-1">=</span>
              <div className="inline-flex flex-col items-center mx-1">
                {parsedQ.targetNum !== undefined ? (
                  <span className="border-b-2 border-black px-1 leading-tight">{parsedQ.targetNum}</span>
                ) : isPreview ? (
                  <span className="border-b-2 border-gray-400 px-1 leading-tight text-red-500 font-black">{p.correctAnswer}</span>
                ) : (
                  <div className="border-b-2 border-black w-6 text-center text-blue-600 pb-0.5">?</div>
                )}
                {parsedQ.targetDen !== undefined ? (
                  <span className="px-1 leading-tight pt-0.5">{parsedQ.targetDen}</span>
                ) : isPreview ? (
                  <span className="px-1 leading-tight pt-0.5 text-red-500 font-black">{p.correctAnswer}</span>
                ) : (
                  <div className="w-6 text-center text-blue-600 pt-0.5">?</div>
                )}
              </div>
            </div>
          ) : isVertical && verticalMatch ? (
            (() => {
              const maxDigits = Math.max(verticalMatch[1].length, verticalMatch[3].length);
              const numDigitCols = maxDigits + 1;
              const topDigits = Array(numDigitCols - verticalMatch[1].length).fill('').concat(verticalMatch[1].split(''));
              const bottomDigits = Array(numDigitCols - verticalMatch[3].length).fill('').concat(verticalMatch[3].split(''));
              
              const expectedStr = expectedParts[0] || '';
              const ansStr = ansParts[0] || '';
              const ansCols = ansStr.padEnd(expectedStr.length, ' ').split('').slice(0, expectedStr.length);
              
              return (
                <div className="flex flex-col font-mono text-xl font-bold text-gray-800 relative mx-auto my-2 border-t-0 border-l-0 border-r-0 items-end">
                  <div className="flex w-full justify-end">
                     <div className="w-6 sm:w-8 text-center pb-1 flex items-center justify-center font-black">
                        
                     </div>
                     {topDigits.map((char, cidx) => (
                        <div key={cidx} className={"w-6 sm:w-8 text-center pb-1 flex items-center justify-center border-l border-dashed border-gray-300"}>
                           {char}
                        </div>
                     ))}
                  </div>
                  <div className="flex border-b-2 border-gray-800 pb-1 w-full justify-end">
                     <div className="w-6 sm:w-8 text-center flex items-center justify-center font-black pr-2">
                        {verticalMatch[2]}
                     </div>
                     {bottomDigits.map((char, cidx) => (
                        <div key={cidx} className={"w-6 sm:w-8 text-center flex items-center justify-center border-l border-dashed border-gray-300"}>
                           {char}
                        </div>
                     ))}
                  </div>
                  <div className="mt-2 flex w-full justify-end">
                     {ansCols.map((char, cidx) => (
                        <div key={cidx} className="w-6 sm:w-8 text-center flex items-center justify-center border-l border-dashed border-gray-300 py-1">
                           {mode === 'preview' ? (
                              <span className="font-black text-red-500 text-lg w-full text-center">{expectedStr[cidx]}</span>
                           ) : (
                              <input 
                                 value={char.trim()} 
                                 maxLength={1}
                                 onChange={(e) => {
                                     const newChar = e.target.value.slice(-1) || ' ';
                                     const newArr = [...ansCols];
                                     newArr[cidx] = newChar;
                                     const newAns = [...ansParts];
                                     newAns[0] = newArr.join('');
                                     handleAnsChange(i, newAns.join(','));
                                 }}
                                 disabled={mode === 'new' && i === 0}
                                 className="w-5 sm:w-6 p-0 h-6 sm:h-8 bg-white text-center font-bold text-base sm:text-lg text-blue-600 outline-none border border-gray-200 shadow-sm rounded focus:border-blue-500"
                              />
                           )}
                        </div>
                     ))}
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              let cleanQ = p.question.replace(/☐|ㅁ/g, '▢').trim();
              if (cleanQ.match(/=\s*\?$/)) {
                cleanQ = cleanQ.replace(/=\s*\?$/, '= ▢');
              } else if (cleanQ.endsWith('?')) {
                cleanQ = cleanQ.replace(/\?$/, '▢');
              } else if (cleanQ.match(/=\s*$/)) {
                cleanQ = cleanQ + ' ▢';
              }
              
              const segments = cleanQ.split('▢');
              if (segments.length > 1) {
                return (
                  <div className="font-bold text-gray-800 text-center whitespace-nowrap text-lg sm:text-xl flex flex-wrap sm:flex-nowrap items-center justify-center gap-x-2 gap-y-1 leading-normal w-full overflow-x-auto pb-1">
                    {segments.map((frag, fragIdx) => (
                      <React.Fragment key={fragIdx}>
                        {frag.trim() !== '' && renderMathText(frag.trim())}
                        {fragIdx < segments.length - 1 && AnswersBlock}
                      </React.Fragment>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="flex flex-col items-center justify-center gap-2 w-full">
                    <div className="font-bold text-gray-800 text-center whitespace-nowrap text-lg sm:text-xl flex sm:flex-nowrap justify-center items-center gap-2 leading-normal overflow-x-auto pb-1 max-w-full">
                      {renderMathText(cleanQ)}
                    </div>
                    {AnswersBlock}
                  </div>
                );
              }
            })()
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 w-full">
      {(horizontalProblems.length > 0 || verticalProblems.length > 0) && (
        <div className="w-full">
          {horizontalProblems.length > 0 && (
            <div className={`grid ${horizontalGridClass} gap-2 sm:gap-4 relative z-10 w-full items-stretch justify-start mb-4 sm:mb-6`}>
              {horizontalProblems.map((d, index) => renderProblem(d, index))}
            </div>
          )}
          {verticalProblems.length > 0 && (
            <div className={`grid ${verticalGridClass} gap-2 sm:gap-4 relative z-10 w-full items-stretch justify-start`}>
              {verticalProblems.map((d, index) => renderProblem(d, horizontalProblems.length + index))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
