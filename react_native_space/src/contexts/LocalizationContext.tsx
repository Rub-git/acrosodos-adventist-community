import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from '../i18n';
import { Language } from '../types';

interface LocalizationContextType {
  locale: string;
  changeLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: any) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState(i18n.locale);

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        i18n.locale = savedLanguage;
        setLocale(savedLanguage);
      } else {
        // Use device language or fallback to English
        const deviceLanguage = getLocales?.()?.[0]?.languageCode ?? 'en';
        const supportedLocale = ['en', 'es'].includes(deviceLanguage) ? deviceLanguage : 'en';
        i18n.locale = supportedLocale;
        setLocale(supportedLocale);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const changeLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      i18n.locale = lang;
      setLocale(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const t = (key: string, params?: any): string => {
    return i18n.t(key, params);
  };

  return (
    <LocalizationContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
