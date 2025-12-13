import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/apiClient";

// --- Helper to generate a fake valid MongoDB ObjectID ---
function generateObjectId() {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
}

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
  addHabit: (habit: Omit<Habit, "id" | "completed">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string) => void;
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

// Initial Data Constants
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
  // AUTO-LOGIN LOGIC: If no user, create a Guest user immediately
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(() => {
    const saved = localStorage.getItem("user");
    if (saved) return JSON.parse(saved);
    
    // Auto-create guest user
    const guestUser = {
      name: "Guest",
      email: "guest@example.com",
      id: generateObjectId() 
    };
    localStorage.setItem("user", JSON.stringify(guestUser));
    return guestUser;
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLIST);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [lifetimeXP, setLifetimeXP] = useState(0); 
  const [levelUp, setLevelUp] = useState({ show: false, newRank: "" });
  
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHydratingRef = useRef(false);

  // --- Persistence helpers ---
  const getToken = () => localStorage.getItem("token") || "guest-token";

  const hydrateFromServer = async (userId: string) => {
    try {
      isHydratingRef.current = true;
      const res = await apiGet(`/api/state?userId=${userId}`, getToken());
      if (!res.ok) {
         console.log("Creating new state for guest...");
         // If failed (404), we just stick with initial state and it will save on next update
         setIsInitialized(true);
         return;
      }
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
      setIsInitialized(true); // Allow saving even if hydration failed
    } finally {
      isHydratingRef.current = false;
    }
  };

  const persistState = () => {
    if (!user?.id) return;
    if (isHydratingRef.current) return;
    if (!isInitialized) return; 

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
    if (user?.id) {
      hydrateFromServer(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    persistState();
  }, [points, lifetimeXP, tasks, habits, books, wishlist]);

  // Google Calendar Integration (Stubbed for Guest)
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const connectGoogleCalendar = () => toast({ title: "Guest Mode", description: "Sign in required for Google Calendar" });
  const disconnectGoogleCalendar = () => {};
  const syncToGoogleCalendar = () => toast({ title: "Guest Mode", description: "Sign in required for Google Calendar" });

  const login = (email: string, name: string, id?: string) => {
    // This function acts as a reset/update now
    const userData = { email, name, id: id || generateObjectId() };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    // Reset to new guest instead of null
    const guestUser = { name: "Guest", email: "guest@example.com", id: generateObjectId() };
    setUser(guestUser);
    localStorage.setItem("user", JSON.stringify(guestUser));
    setPoints(0);
    setTasks(INITIAL_TASKS);
    setIsInitialized(false);
    window.location.reload();
  };

  const getRankData = (xp: number) => {
      if (xp < 2000) return { name: "Iron 1", nextXP: 2000 };
      if (xp < 5000) return { name: "Bronze 1", nextXP: 5000 };
      if (xp < 10000) return { name: "Silver 1", nextXP: 10000 };
      if (xp < 30000) return { name: "Gold 1", nextXP: 30000 };
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

  // Simplified CRUD operations
  const addTask = (task: Omit<Task, "id" | "completed">) => setTasks(prev => [...prev, { ...task, id: Math.random().toString(), completed: false }]);
  const updateTask = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  const toggleTask = (id: string) => setTasks(prev => prev.map(t => {
      if (t.id === id) {
          t.completed ? deductPoints(t.points) : addPoints(t.points);
          return { ...t, completed: !t.completed };
      }
      return t;
  }));

  const addHabit = (h: Omit<Habit, "id" | "completed">) => setHabits(prev => [...prev, { ...h, id: Math.random().toString(), completed: false }]);
  const updateHabit = (id: string, u: Partial<Habit>) => setHabits(prev => prev.map(h => h.id === id ? { ...h, ...u } : h));
  const deleteHabit = (id: string) => setHabits(prev => prev.filter(h => h.id !== id));
  const toggleHabit = (id: string) => setHabits(prev => prev.map(h => {
      if (h.id === id) {
          h.completed ? deductPoints(h.points) : addPoints(h.points);
          return { ...h, completed: !h.completed };
      }
      return h;
  }));

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
      }
  };

  return (
    <GameContext.Provider value={{
        points, tasks, habits, books, wishlist, journalEntries, lifetimeXP, rank, nextRankXP, levelUp,
        dismissLevelUp, addPoints, deductPoints,
        addTask, updateTask, deleteTask, toggleTask,
        addHabit, updateHabit, deleteHabit, toggleHabit,
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