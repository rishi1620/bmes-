import { useState, ReactNode } from 'react';
import { AppContext } from './AppContext';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState({
    title: 'Welcome to My App',
    description: 'This is the main public page.',
    heroImage: 'https://picsum.photos/seed/nature/1920/1080',
  });

  const updateState = (newState: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  return (
    <AppContext.Provider value={{ state, updateState }}>
      {children}
    </AppContext.Provider>
  );
};
