import { create } from "zustand";

import type { Action, Session, Suggestion } from "../types/api";

interface AppState {
  currentSession: Session | null;
  currentSuggestions: Suggestion[];
  activeAction: Action | null;
  smallerSuggestions: Suggestion[];
  setCurrentSession: (session: Session | null) => void;
  setCurrentSuggestions: (suggestions: Suggestion[]) => void;
  addSmallerSuggestions: (suggestions: Suggestion[]) => void;
  setActiveAction: (action: Action | null) => void;
  resetFlow: () => void;
}

const sessionKey = "decide.currentSession";
const suggestionsKey = "decide.currentSuggestions";
const actionKey = "decide.activeAction";
const smallerKey = "decide.smallerSuggestions";

function readJson<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export const useAppStore = create<AppState>((set) => ({
  currentSession: readJson<Session | null>(sessionKey, null),
  currentSuggestions: readJson<Suggestion[]>(suggestionsKey, []),
  activeAction: readJson<Action | null>(actionKey, null),
  smallerSuggestions: readJson<Suggestion[]>(smallerKey, []),
  setCurrentSession: (session) => {
    if (session) {
      localStorage.setItem(sessionKey, JSON.stringify(session));
    } else {
      localStorage.removeItem(sessionKey);
    }
    set({ currentSession: session });
  },
  setCurrentSuggestions: (suggestions) => {
    localStorage.setItem(suggestionsKey, JSON.stringify(suggestions));
    set({ currentSuggestions: suggestions });
  },
  addSmallerSuggestions: (suggestions) => {
    set((state) => {
      const existingSmallerIds = new Set(state.smallerSuggestions.map((item) => item.id));
      const existingSuggestionIds = new Set(state.currentSuggestions.map((item) => item.id));
      const uniqueSmaller = suggestions.filter((item) => !existingSmallerIds.has(item.id));
      const uniqueSuggestions = suggestions.filter((item) => !existingSuggestionIds.has(item.id));
      const nextSmaller = [...uniqueSmaller, ...state.smallerSuggestions];
      const nextSuggestions = [...uniqueSuggestions, ...state.currentSuggestions];
      localStorage.setItem(smallerKey, JSON.stringify(nextSmaller));
      localStorage.setItem(suggestionsKey, JSON.stringify(nextSuggestions));
      return {
        smallerSuggestions: nextSmaller,
        currentSuggestions: nextSuggestions,
      };
    });
  },
  setActiveAction: (action) => {
    if (action) {
      localStorage.setItem(actionKey, JSON.stringify(action));
    } else {
      localStorage.removeItem(actionKey);
    }
    set({ activeAction: action });
  },
  resetFlow: () => {
    localStorage.removeItem(sessionKey);
    localStorage.removeItem(suggestionsKey);
    localStorage.removeItem(actionKey);
    localStorage.removeItem(smallerKey);
    set({
      currentSession: null,
      currentSuggestions: [],
      activeAction: null,
      smallerSuggestions: [],
    });
  },
}));
