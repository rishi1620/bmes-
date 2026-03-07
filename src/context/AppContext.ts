import { createContext } from 'react';

export interface AppState {
  title: string;
  description: string;
  heroImage: string;
}

export interface AppContextType {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
