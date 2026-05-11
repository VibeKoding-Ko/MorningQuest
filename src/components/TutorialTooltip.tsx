import React from 'react';
import { TooltipRenderProps } from 'react-joyride';
import { useLanguage } from '../contexts/LanguageContext';

export const TutorialTooltip = ({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) => {
  const { t, language } = useLanguage();

  const skipText = language === 'en' ? 'Skip' : language === 'zh' ? '跳过' : language === 'ru' ? 'Пропустить' : language === 'vi' ? 'Bỏ qua' : '건너뛰기';
  const backText = language === 'en' ? 'Back' : language === 'zh' ? '上一步' : language === 'ru' ? 'Назад' : language === 'vi' ? 'Trở lại' : '이전';
  const nextText = language === 'en' ? 'Next' : language === 'zh' ? '下一步' : language === 'ru' ? 'Далее' : language === 'vi' ? 'Tiếp theo' : '다음';
  const doneText = language === 'en' ? 'Done' : language === 'zh' ? '完成' : language === 'ru' ? 'Готово' : language === 'vi' ? 'Hoàn thành' : '완료';

  return (
    <div
      {...tooltipProps}
      className="bg-white p-5 rounded-[2rem] border-[3px] border-indigo-100 shadow-[0_12px_40px_-12px_rgba(79,70,229,0.3),0_4px_12px_rgba(0,0,0,0.08)] w-[320px] max-w-full font-sans max-h-[90vh] overflow-y-auto"
    >
      <div className="mb-5">
        {step.title && <h3 className="font-black text-lg mb-2 text-indigo-900">{step.title}</h3>}
        <div className="text-gray-700 font-bold text-sm leading-relaxed">{step.content}</div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t-2 border-indigo-50 gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
           <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-100">
             {index + 1} / {size}
           </span>
           <button 
             {...skipProps}
             className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg transition-colors"
           >
             {skipText}
           </button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {index > 0 && (
            <button
              {...backProps}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl shadow-[0_2px_0_0_rgba(229,231,235,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
            >
              {backText}
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-2 text-xs font-black text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-[0_3px_0_0_rgb(67,56,202)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
          >
            {isLastStep ? doneText : nextText}
          </button>
        </div>
      </div>
    </div>
  );
};
