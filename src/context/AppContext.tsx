import { createContext, useState, useContext, ReactNode } from 'react';

interface AppState {
  title: string;
  description: string;
  heroImage: string;
}

interface AppContextType {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>({
    title: 'Welcome to My App',
    description: 'This is the main public page.',
    heroImage: 'https://picsum.photos/seed/nature/1920/1080',
  });

  const updateState = (newState: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  return (
    <AppContext.Provider value={{ state, updateState }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
