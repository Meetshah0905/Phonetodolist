import React, { createContext, useContext, useState, useEffect, useRef } from "react";
// RESTORED: Sound imports
import completionSound from "@assets/soundeffect.MP3";
import wishlistSound from "@assets/wishlistsound.MP3";
import { toast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/apiClient";

// --- Helper to generate a fake valid MongoDB ObjectID ---
function generateObjectId() {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
}

// --- EXPORTED RANKS FOR PROFILE PAGE ---
export const RANKS = [
  { name: "Iron 1", minXP: 0 },
  { name: "Iron 2", minXP: 2000 },
  { name: "Iron 3", minXP: 2500 },
  { name: "Bronze 1", minXP: 3000 },
  { name: "Bronze 2", minXP: 4000 },
  { name: "Bronze 3", minXP: 5500 },
  { name: "Silver 1", minXP: 7500 },
  { name: "Silver 2", minXP: 10000 },
  { name: "Silver 3", minXP: 15000 },
  { name: "Gold 1", minXP: 22000 },
  { name: "Gold 2", minXP: 32000 },
  { name: "Gold 3", minXP: 50000 },
  { name: "Platinum 1", minXP: 75000 },
  { name: "Platinum 2", minXP: 110000 },
  { name: "Platinum 3", minXP: 160000 },
  { name: "Diamond 1", minXP: 230000 },
  { name: "Diamond 2", minXP: 330000 },
  { name: "Diamond 3", minXP: 470000 },
  { name: "Ascendant 1", minXP: 650000 },
  { name: "Ascendant 2", minXP: 750000 },
  { name: "Ascendant 3", minXP: 850000 },
  { name: "Immortal 1", minXP: 920000 },
  { name: "Immortal 2", minXP: 950000 },
  { name: "Immortal 3", minXP: 970000 },
  { name: "Radiant", minXP: 985000 },
];

type Task = {
  id: string;
  title: string;
  time: string;
  points: number;
  completed: boolean;
  date: string;
  priority: "high" | "medium" | "low";
  notes?: string;
};

type Habit = {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  type: "morning" | "afternoon" | "evening" | "night";
  resetTime: string;
  mustDo: boolean;
};

type Book = {
  id: string;
  title: string;
  author: string;
  totalPoints: number;
  status: "not-started" | "reading" | "completed";
  deadline: string;
  progress: number;
  totalPages: number;
  currentPage: number;
  image?: string;
};

type WishlistItem = {
  id: string;
  name: string;
  cost: number;
  redeemed: boolean;
  image?: string;
};

type JournalEntry = {
    id: string;
    text: string;
    date: string;
    hasAudio?: boolean;
    audioUrl?: string;
};

type StoredState = {
  points: number;
  tasks: Task[];
  habits: Habit[];
  books: Book[];
  wishlist: WishlistItem[];
  journalEntries: JournalEntry[];
  lifetimeXP: number;
};

type GameState = {
  points: number;
  tasks: Task[];
  habits: Habit[];
  books: Book[];
  wishlist: WishlistItem[];
  journalEntries: JournalEntry[];
  lifetimeXP: number;
  rank: string;
  nextRankXP: number;
  levelUp: { show: boolean; newRank: string };
  dismissLevelUp: () => void;
  addPoints: (amount: number) => void;
  deductPoints: (amount: number) => void;
  addTask: (task: Omit<Task, "id" | "completed">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTask: (id: string, direction: "up" | "down") => void;
  addHabit: (habit: Omit<Habit, "id" | "completed">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string) => void;
  reorderHabit: (id: string, direction: "up" | "down") => void;
  addBook: (book: Omit<Book, "id" | "status" | "progress" | "currentPage">) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  updateBookProgress: (id: string, page: number) => void;
  addWishlistItem: (item: Omit<WishlistItem, "id" | "redeemed">) => void;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  redeemItem: (id: string) => void;
  getAISuggestion: (title: string) => Promise<number>;
  saveJournalEntry: (text: string, audioBlob?: Blob) => Promise<void>;
  user: { name: string; email: string; id: string } | null;
  login: (email: string, name: string, id?: string) => void;
  logout: () => void;
  isGoogleCalendarConnected: boolean;
  connectGoogleCalendar: () => void;
  disconnectGoogleCalendar: () => void;
  syncToGoogleCalendar: (item: { title: string; time?: string; endTime?: string; date?: string; type?: string; notes?: string }) => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Morning Run (5km)", time: "30m", points: 250, completed: false, date: new Date().toISOString().split('T')[0], priority: "high" },
  { id: "2", title: "Deep Work Session", time: "2h", points: 500, completed: false, date: new Date().toISOString().split('T')[0], priority: "medium" },
];

const INITIAL_HABITS: Habit[] = [
  { id: "1", title: "Wake up at 6:30", points: 10, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: true },
  { id: "2", title: "Hydrate", points: 5, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: false },
];

const INITIAL_BOOKS: Book[] = [];
const INITIAL_WISHLIST: WishlistItem[] = [
  { id: "1", name: "Reward 1", cost: 1000, redeemed: false },
];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const loadSavedState = (): StoredState | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("gameState");
      if (!raw) return null;
      return JSON.parse(raw) as StoredState;
    } catch (err) {
      console.warn("Failed to parse saved state", err);
      return null;
    }
  };

  const [savedState] = useState<StoredState | null>(() => loadSavedState());

  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === "Guest") { parsed.name = "Meet Shah"; }
        return parsed;
    }
    const newId = generateObjectId();
    const newUser = { name: "Meet Shah", email: `meet_${newId}@phonetodolist.com`, id: newId };
    localStorage.setItem("user", JSON.stringify(newUser));
    return newUser;
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [points, setPoints] = useState(savedState?.points ?? 0);
  const [tasks, setTasks] = useState<Task[]>(savedState?.tasks ?? INITIAL_TASKS);
  const [habits, setHabits] = useState<Habit[]>(savedState?.habits ?? INITIAL_HABITS);
  const [books, setBooks] = useState<Book[]>(savedState?.books ?? INITIAL_BOOKS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(savedState?.wishlist ?? INITIAL_WISHLIST);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(savedState?.journalEntries ?? []);
  const [lifetimeXP, setLifetimeXP] = useState(savedState?.lifetimeXP ?? 0); 
  const [levelUp, setLevelUp] = useState({ show: false, newRank: "" });
  
  // RESTORED: Audio References
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);
  const wishlistAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHydratingRef = useRef(false);
  const localSaveErrorRef = useRef(false);

  // RESTORED: Play Sound Functions - Preload audio for instant playback
  useEffect(() => {
    if (typeof window !== "undefined") {
      completionAudioRef.current = new Audio(completionSound);
      completionAudioRef.current.volume = 0.4;
      completionAudioRef.current.preload = "auto";
      wishlistAudioRef.current = new Audio(wishlistSound);
      wishlistAudioRef.current.volume = 0.4;
      wishlistAudioRef.current.preload = "auto";
    }
  }, []);

  const playCompletionSound = () => {
    if (typeof window === "undefined") return;
    try {
      if (completionAudioRef.current) {
        // Reset and play immediately - don't wait for state updates
        completionAudioRef.current.currentTime = 0;
        completionAudioRef.current.play().catch(() => {});
      }
    } catch (e) { 
      // Silently fail
    }
  };

  const playWishlistSound = () => {
    if (typeof window === "undefined") return;
    try {
      if (wishlistAudioRef.current) {
        // Reset and play immediately
        wishlistAudioRef.current.currentTime = 0;
        wishlistAudioRef.current.play().catch(() => {});
      }
    } catch (e) { 
      // Silently fail
    }
  };

  const getToken = () => localStorage.getItem("token") || "meet-token";

  const hydrateFromServer = async (userId: string) => {
    try {
      isHydratingRef.current = true;
      const res = await apiGet(`/api/state?userId=${userId}`, getToken());
      if (!res.ok) { setIsInitialized(true); return; }
      const data = await res.json();
      
      if (typeof data.points === 'number') setPoints(data.points);
      if (typeof data.lifetimeXP === 'number') setLifetimeXP(data.lifetimeXP);
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.habits)) setHabits(data.habits);
      if (Array.isArray(data.books)) setBooks(data.books);
      if (Array.isArray(data.wishlist)) setWishlist(data.wishlist);
      
      setIsInitialized(true);
    } catch (err) {
      console.error("Hydration error", err);
      setIsInitialized(true);
    } finally {
      isHydratingRef.current = false;
    }
  };

  const persistState = () => {
    if (!user?.id) return;
    if (isHydratingRef.current) return;
    if (!isInitialized) return; 

    // Save locally for offline resilience
    const localPayload: StoredState = { points, lifetimeXP, tasks, habits, books, wishlist, journalEntries };
    try {
      localStorage.setItem("gameState", JSON.stringify(localPayload));
      localSaveErrorRef.current = false;
    } catch (err: any) {
      if (!localSaveErrorRef.current) {
        localSaveErrorRef.current = true;
        toast({
          title: "Storage almost full",
          description: "We could not save everything locally. Try deleting large images/files or free some space.",
          variant: "destructive",
        });
      }
      console.error("Local save failed", err);
    }

    // And also push to backend (best effort)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      apiPost(
        "/api/state",
        { userId: user.id, points, lifetimeXP, tasks, habits, books, wishlist },
        getToken(),
      ).catch((err) => console.error("Persist state failed", err));
    }, 1000); 
  };

  useEffect(() => {
    if (user?.id) { hydrateFromServer(user.id); }
  }, [user?.id]);

  useEffect(() => {
    persistState();
  }, [points, lifetimeXP, tasks, habits, books, wishlist, journalEntries]);

  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const connectGoogleCalendar = () => toast({ title: "Feature Restricted", description: "Google Calendar requires a full Google account." });
  const disconnectGoogleCalendar = () => {};
  const syncToGoogleCalendar = () => toast({ title: "Feature Restricted", description: "Google Calendar requires a full Google account." });

  const login = (email: string, name: string, id?: string) => {
    const userData = { email, name, id: id || generateObjectId() };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    if (confirm("This will reset your local data. Are you sure?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const getRankData = (xp: number) => {
      for (let i = 0; i < RANKS.length - 1; i++) {
          if (xp >= RANKS[i].minXP && xp < RANKS[i+1].minXP) {
              return { name: RANKS[i].name, nextXP: RANKS[i+1].minXP };
          }
      }
      return { name: "Radiant", nextXP: Infinity };
  };

  const { name: rank, nextXP: nextRankXP } = getRankData(lifetimeXP);

  const addPoints = (amount: number) => {
    setPoints((prev) => prev + amount);
    setLifetimeXP((prev) => {
        const newXP = prev + amount;
        const oldRank = getRankData(prev).name;
        const newRank = getRankData(newXP).name;
        if (newRank !== oldRank) setLevelUp({ show: true, newRank });
        return newXP;
    });
  };

  const dismissLevelUp = () => setLevelUp({ show: false, newRank: "" });
  const deductPoints = (amount: number) => {
    setPoints((prev) => Math.max(0, prev - amount));
    setLifetimeXP((prev) => Math.max(0, prev - amount));
  };

  const getAISuggestion = async (title: string): Promise<number> => {
    return new Promise((resolve) => { setTimeout(() => resolve(150), 500); });
  };

  const saveJournalEntry = async (text: string, audioBlob?: Blob) => {
      addPoints(50);
      const newEntry = { id: Math.random().toString(), text, date: new Date().toISOString(), hasAudio: !!audioBlob };
      setJournalEntries(prev => [...prev, newEntry]);
  }

  // --- UPDATED CRUD TO PLAY SOUNDS ---
  const addTask = (task: Omit<Task, "id" | "completed">) => setTasks(prev => [...prev, { ...task, id: Math.random().toString(), completed: false }]);
  const updateTask = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
          const isCompleting = !t.completed;
          // Play sound IMMEDIATELY before state updates (for instant feedback)
          if (isCompleting) {
              playCompletionSound();
              addPoints(t.points);
          } else {
              deductPoints(t.points);
          }
          return { ...t, completed: isCompleting };
      }
      return t;
    }));
  };

  // Reorder tasks within the same date bucket
  const reorderTask = (id: string, direction: "up" | "down") => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const targetDate = prev[idx].date;
      const sameDayIndexes = prev.map((t, i) => t.date === targetDate ? i : -1).filter(i => i >= 0);
      const position = sameDayIndexes.indexOf(idx);
      const swapWith = direction === "up" ? sameDayIndexes[position - 1] : sameDayIndexes[position + 1];
      if (swapWith === undefined) return prev;
      const copy = [...prev];
      [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
      return copy;
    });
  };

  const addHabit = (h: Omit<Habit, "id" | "completed">) => setHabits(prev => [...prev, { ...h, id: Math.random().toString(), completed: false }]);
  const updateHabit = (id: string, u: Partial<Habit>) => setHabits(prev => prev.map(h => h.id === id ? { ...h, ...u } : h));
  const deleteHabit = (id: string) => setHabits(prev => prev.filter(h => h.id !== id));
  
  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
          const isCompleting = !h.completed;
          // Play sound IMMEDIATELY before state updates
          if (isCompleting) {
              playCompletionSound();
              addPoints(h.points);
          } else {
              deductPoints(h.points);
          }
          return { ...h, completed: isCompleting };
      }
      return h;
    }));
  };

  const reorderHabit = (id: string, direction: "up" | "down") => {
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === id);
      if (idx === -1) return prev;
      const targetType = prev[idx].type;
      const sameTypeIndexes = prev.map((h, i) => h.type === targetType ? i : -1).filter(i => i >= 0);
      const position = sameTypeIndexes.indexOf(idx);
      const swapWith = direction === "up" ? sameTypeIndexes[position - 1] : sameTypeIndexes[position + 1];
      if (swapWith === undefined) return prev;
      const copy = [...prev];
      [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
      return copy;
    });
  };

  const addBook = (b: Omit<Book, "id" | "status" | "progress" | "currentPage">) => setBooks(prev => [...prev, { ...b, id: Math.random().toString(), status: "not-started", progress: 0, currentPage: 0 }]);
  const updateBook = (id: string, u: Partial<Book>) => setBooks(prev => prev.map(b => b.id === id ? { ...b, ...u } : b));
  const deleteBook = (id: string) => setBooks(prev => prev.filter(b => b.id !== id));
  const updateBookProgress = (id: string, page: number) => setBooks(prev => prev.map(b => b.id === id ? { ...b, currentPage: page, progress: Math.min(100, Math.round((page / b.totalPages) * 100)) } : b));

  const addWishlistItem = (i: Omit<WishlistItem, "id" | "redeemed">) => setWishlist(prev => [...prev, { ...i, id: Math.random().toString(), redeemed: false }]);
  const updateWishlistItem = (id: string, u: Partial<WishlistItem>) => setWishlist(prev => prev.map(i => i.id === id ? { ...i, ...u } : i));
  const deleteWishlistItem = (id: string) => setWishlist(prev => prev.filter(i => i.id !== id));
  const redeemItem = (id: string) => {
      const item = wishlist.find(i => i.id === id);
      if (item && points >= item.cost) {
          deductPoints(item.cost);
          setWishlist(prev => prev.map(i => i.id === id ? { ...i, redeemed: true } : i));
          playWishlistSound(); // Wishlist Sound
      }
  };

  return (
    <GameContext.Provider value={{
        points, tasks, habits, books, wishlist, journalEntries, lifetimeXP, rank, nextRankXP, levelUp,
        dismissLevelUp, addPoints, deductPoints,
        addTask, updateTask, deleteTask, toggleTask,
        reorderTask,
        addHabit, updateHabit, deleteHabit, toggleHabit, reorderHabit,
        addBook, updateBook, deleteBook, updateBookProgress,
        addWishlistItem, updateWishlistItem, deleteWishlistItem, redeemItem,
        getAISuggestion, saveJournalEntry, user, login, logout,
        isGoogleCalendarConnected, connectGoogleCalendar, disconnectGoogleCalendar, syncToGoogleCalendar
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}