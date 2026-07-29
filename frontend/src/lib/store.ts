import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type Dispatch,
  type ReactNode,
} from "react";
import { createElement } from "react";
import { generateId } from "./utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Theme = "dark" | "light";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  emotion: string;
  confidence: number;
  imageThumbnail: string;
  probabilities: Record<string, number>;
}

export interface Stats {
  totalProcessed: number;
  totalSessions: number;
  avgConfidence: number;
  happyCount: number;
  todayCount: number;
}

export interface AppState {
  theme: Theme;
  sidebarExpanded: boolean;
  sidebarMobileOpen: boolean;
  detectionHistory: HistoryEntry[];
  stats: Stats;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

type Action =
  | { type: "SET_THEME"; payload: Theme }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_EXPANDED"; payload: boolean }
  | { type: "SET_SIDEBAR_MOBILE_OPEN"; payload: boolean }
  | { type: "ADD_HISTORY"; payload: Omit<HistoryEntry, "id" | "timestamp"> }
  | { type: "CLEAR_HISTORY" }
  | { type: "UPDATE_STATS"; payload: Partial<Stats> };

/* ------------------------------------------------------------------ */
/*  Storage Keys & Initializers                                        */
/* ------------------------------------------------------------------ */

const THEME_STORAGE_KEY = "deepfer-theme";
const HISTORY_STORAGE_KEY = "deepfer-history";
const STATS_STORAGE_KEY = "deepfer-stats";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage unavailable */
  }
  return "light";
}

const DEFAULT_DEMO_HISTORY: HistoryEntry[] = [
  {
    id: "demo-1",
    timestamp: Date.now() - 30000,
    emotion: "neutral",
    confidence: 0.747,
    imageThumbnail: "/samples/neutral.jpg",
    probabilities: { neutral: 0.747, happy: 0.15, sad: 0.1 },
  },
  {
    id: "demo-2",
    timestamp: Date.now() - 120000,
    emotion: "happy",
    confidence: 0.942,
    imageThumbnail: "/samples/happy.jpg",
    probabilities: { happy: 0.942, neutral: 0.04, surprise: 0.018 },
  },
  {
    id: "demo-3",
    timestamp: Date.now() - 300000,
    emotion: "surprise",
    confidence: 0.917,
    imageThumbnail: "/samples/surprised.jpg",
    probabilities: { surprise: 0.917, happy: 0.05, fear: 0.033 },
  },
];

function getInitialHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_HISTORY;
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed; // Returns [] cleanly if user cleared history!
      }
    }
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_DEMO_HISTORY;
}

function computeStatsFromHistory(history: HistoryEntry[]): Stats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let totalProcessed = history.length;
  let totalConf = 0;
  let happyCount = 0;
  let todayCount = 0;

  for (const entry of history) {
    totalConf += entry.confidence;
    if (entry.emotion.toLowerCase() === "happy") {
      happyCount++;
    }
    if (entry.timestamp >= todayStart) {
      todayCount++;
    }
  }

  const avgConfidence = totalProcessed > 0 ? totalConf / totalProcessed : 0;

  return {
    totalProcessed,
    totalSessions: totalProcessed > 0 ? 1 : 0,
    avgConfidence,
    happyCount,
    todayCount,
  };
}

function getInitialStats(): Stats {
  if (typeof window === "undefined") return computeStatsFromHistory(DEFAULT_DEMO_HISTORY);
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.totalProcessed === "number") {
        return parsed;
      }
    }
  } catch {
    /* localStorage unavailable */
  }
  return computeStatsFromHistory(getInitialHistory());
}

function createInitialState(): AppState {
  const history = getInitialHistory();
  const stats = getInitialStats();

  return {
    theme: getInitialTheme(),
    sidebarExpanded: true,
    sidebarMobileOpen: false,
    detectionHistory: history,
    stats: stats,
  };
}

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.payload };

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarExpanded: !state.sidebarExpanded };

    case "SET_SIDEBAR_EXPANDED":
      return { ...state, sidebarExpanded: action.payload };

    case "SET_SIDEBAR_MOBILE_OPEN":
      return { ...state, sidebarMobileOpen: action.payload };

    case "ADD_HISTORY": {
      const entry: HistoryEntry = {
        ...action.payload,
        id: generateId(),
        timestamp: Date.now(),
      };
      const updatedHistory = [entry, ...state.detectionHistory].slice(0, 200);
      const updatedStats = computeStatsFromHistory(updatedHistory);

      return {
        ...state,
        detectionHistory: updatedHistory,
        stats: updatedStats,
      };
    }

    case "CLEAR_HISTORY":
      return {
        ...state,
        detectionHistory: [],
        stats: {
          totalProcessed: 0,
          totalSessions: 0,
          avgConfidence: 0,
          happyCount: 0,
          todayCount: 0,
        },
      };

    case "UPDATE_STATS":
      return { ...state, stats: { ...state.stats, ...action.payload } };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface AppStoreContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  /* Persist theme */
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, state.theme);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  /* Persist detectionHistory & stats */
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.detectionHistory));
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(state.stats));
    } catch {
      /* ignore */
    }
  }, [state.detectionHistory, state.stats]);

  return createElement(
    AppStoreContext.Provider,
    { value: { state, dispatch } },
    children,
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }

  const { state, dispatch } = context;

  const setTheme = useCallback(
    (theme: Theme) => dispatch({ type: "SET_THEME", payload: theme }),
    [dispatch],
  );

  const toggleTheme = useCallback(
    () =>
      dispatch({
        type: "SET_THEME",
        payload: state.theme === "dark" ? "light" : "dark",
      }),
    [dispatch, state.theme],
  );

  const toggleSidebar = useCallback(
    () => dispatch({ type: "TOGGLE_SIDEBAR" }),
    [dispatch],
  );

  const setSidebarExpanded = useCallback(
    (expanded: boolean) =>
      dispatch({ type: "SET_SIDEBAR_EXPANDED", payload: expanded }),
    [dispatch],
  );

  const setSidebarMobileOpen = useCallback(
    (open: boolean) =>
      dispatch({ type: "SET_SIDEBAR_MOBILE_OPEN", payload: open }),
    [dispatch],
  );

  const addHistory = useCallback(
    (entry: Omit<HistoryEntry, "id" | "timestamp">) =>
      dispatch({ type: "ADD_HISTORY", payload: entry }),
    [dispatch],
  );

  const clearHistory = useCallback(
    () => dispatch({ type: "CLEAR_HISTORY" }),
    [dispatch],
  );

  const updateStats = useCallback(
    (stats: Partial<Stats>) =>
      dispatch({ type: "UPDATE_STATS", payload: stats }),
    [dispatch],
  );

  return {
    ...state,
    dispatch,
    setTheme,
    toggleTheme,
    toggleSidebar,
    setSidebarExpanded,
    setSidebarMobileOpen,
    addHistory,
    clearHistory,
    updateStats,
  };
}
