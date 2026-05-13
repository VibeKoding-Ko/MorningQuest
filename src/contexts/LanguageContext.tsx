import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../translations';
import { mathPromptsContext, topicWritingTranslations } from '../lib/staticTranslations';
import generatedThemesTranslations from '../lib/generatedThemesTranslations.json';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['ko'] | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'ko';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: string) => {
    return (translations as any)[language]?.[key] || (translations as any)['ko']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const useDynamicTranslation = (text: string) => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      return;
    }
    
    if (language === 'ko') {
      setTranslatedText(text);
      return;
    }
    
    // Check if we have exact match in standard translations
    if ((translations as any)[language] && (translations as any)[language][text]) {
       setTranslatedText((translations as any)[language][text]);
       return;
    }

    // Manual static overrides (Math Prompts and Static Topics)
    if (mathPromptsContext[text] && mathPromptsContext[text][language]) {
      setTranslatedText(mathPromptsContext[text][language]);
      return;
    }
    if (topicWritingTranslations[text] && topicWritingTranslations[text][language]) {
      setTranslatedText(topicWritingTranslations[text][language]);
      return;
    }

    // Automatically generated theme translations
    const generated = (generatedThemesTranslations as any)[text];
    if (generated) {
      // mapped zh-CN back to zh since generating step used zh-CN
      const langKey = language === 'zh' ? 'zh-CN' : language; 
      if (generated[langKey]) {
        setTranslatedText(generated[langKey]);
        return;
      }
    }

    // Default fallback
    setTranslatedText(text);

  }, [text, language]);

  return translatedText;
};