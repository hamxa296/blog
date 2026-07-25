import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'basic-dark' | 'basic-light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('selected-theme');
    return (saved === 'basic-light' ? 'basic-light' : 'basic-dark') as Theme;
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('selected-theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'basic-dark' ? 'basic-light' : 'basic-dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove old classes
    root.classList.remove('theme-basic-light', 'theme-basic-dark');
    body.classList.remove('theme-basic-light', 'theme-basic-dark');

    // Add new classes
    root.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
