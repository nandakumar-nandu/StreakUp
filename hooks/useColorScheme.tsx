import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  themePreference: ThemeType;
  setThemePreference: (pref: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Context Provider component that wraps your app and provides colorScheme overrides.
 * Persists user selections in local AsyncStorage.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const rawScheme = _useColorScheme();
  const systemScheme: 'light' | 'dark' = rawScheme === 'dark' ? 'dark' : 'light';
  const [themePreference, setThemePrefState] = useState<ThemeType>('system');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(systemScheme);

  // Load saved theme preference on boot
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('streakup_theme_preference');
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePrefState(stored);
        }
      } catch (e) {
        console.error("Error loading theme preference:", e);
      }
    };
    loadTheme();
  }, []);

  // Update colorScheme whenever theme preference or system preference changes
  useEffect(() => {
    if (themePreference === 'system') {
      setColorScheme(systemScheme);
    } else {
      setColorScheme(themePreference);
    }
  }, [themePreference, systemScheme]);

  const setThemePreference = async (pref: ThemeType) => {
    setThemePrefState(pref);
    try {
      await AsyncStorage.setItem('streakup_theme_preference', pref);
    } catch (e) {
      console.error("Error saving theme preference:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * A custom hook to access the active colorScheme.
 * Automatically resolves system defaults and manual overrides.
 * 
 * @returns 'light' or 'dark'
 */
export function useColorScheme(): 'light' | 'dark' {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback if accessed outside ThemeProvider (e.g. before mount or during tests)
    return 'light';
  }
  return context.colorScheme;
}

/**
 * A custom hook to get and set theme preferences ('light' | 'dark' | 'system').
 * 
 * @returns ThemeContextType containing themePreference and setThemePreference.
 */
export function useThemeOverride(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeOverride must be used within a ThemeProvider');
  }
  return context;
}

export default useColorScheme;
