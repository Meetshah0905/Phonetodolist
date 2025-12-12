import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import completionSound from "@assets/soundeffect.MP3";
import wishlistSound from "@assets/wishlistsound.MP3";
import { toast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/apiClient";

type Task = {
  id: string;
  title: string;
  time: string;
  points: number;
  completed: boolean;
  date: string; // ISO date string YYYY-MM-DD
  priority: "high" | "medium" | "low";
  notes?: string;
};

type Habit = {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  type: "morning" | "afternoon" | "evening" | "night";
  resetTime: string; // e.g., "06:30 - 07:10"
  mustDo: boolean;
};

type Book = {
  id: string;
  title: string;
  author: string;
  totalPoints: number;
  status: "not-started" | "reading" | "completed";
  deadline: string;
  progress: number; // 0-100
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
    date: string; // ISO String
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
  
  // Task Actions
  addTask: (task: Omit<Task, "id" | "completed">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  
  // Habit Actions
  addHabit: (habit: Omit<Habit, "id" | "completed">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string) => void;
  
  // Book Actions
  addBook: (book: Omit<Book, "id" | "status" | "progress" | "currentPage">) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  updateBookProgress: (id: string, page: number) => void;
  
  // Wishlist Actions
  addWishlistItem: (item: Omit<WishlistItem, "id" | "redeemed">) => void;
  updateWishlistItem: (id: string, updates: Partial<WishlistItem>) => void;
  deleteWishlistItem: (id: string) => void;
  redeemItem: (id: string) => void;
  
  // Utils
  getAISuggestion: (title: string) => Promise<number>;
  saveJournalEntry: (text: string, audioBlob?: Blob) => Promise<void>;
  
  // Auth
  user: { name: string; email: string; id?: string } | null;
  login: (email: string, name: string, id?: string) => void;
  logout: () => void;

  // Google Calendar
  isGoogleCalendarConnected: boolean;
  connectGoogleCalendar: () => void;
  disconnectGoogleCalendar: () => void;
  syncToGoogleCalendar: (item: { title: string; time?: string; endTime?: string; date?: string; type?: string; notes?: string }) => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Morning Run (5km)", time: "30m", points: 250, completed: false, date: new Date().toISOString().split('T')[0], priority: "high" },
  { id: "2", title: "Deep Work Session", time: "2h", points: 500, completed: false, date: new Date().toISOString().split('T')[0], priority: "medium" },
  { id: "3", title: "Review PRs", time: "45m", points: 150, completed: true, date: new Date().toISOString().split('T')[0], priority: "medium" },
];

const INITIAL_HABITS: Habit[] = [
  { id: "1", title: "Wake up at 6:30", points: 10, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: true },
  { id: "2", title: "Black coffee", points: 5, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: false },
  { id: "3", title: "Read 5 pages", points: 15, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: false },
  { id: "4", title: "Oil pulling", points: 10, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: false },
  { id: "5", title: "Brush teeth", points: 5, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: false },
  { id: "6", title: "Shower", points: 5, completed: false, type: "morning", resetTime: "06:30 - 07:10", mustDo: false },
  { id: "7", title: "Gym", points: 30, completed: false, type: "morning", resetTime: "08:30 - 10:30", mustDo: false },
  { id: "8", title: "Review Day", points: 20, completed: false, type: "evening", resetTime: "21:30 - 22:30", mustDo: true },
  { id: "9", title: "Pack Bag", points: 10, completed: false, type: "evening", resetTime: "21:30 - 22:30", mustDo: false },
];

const INITIAL_BOOKS: Book[] = [
  { id: "1", title: "Dune", author: "Frank Herbert", totalPoints: 1000, status: "reading", deadline: "2025-12-31", progress: 45, totalPages: 800, currentPage: 360 },
  { id: "2", title: "Atomic Habits", author: "James Clear", totalPoints: 500, status: "not-started", deadline: "2025-06-01", progress: 0, totalPages: 300, currentPage: 0 },
];

const INITIAL_WISHLIST: WishlistItem[] = [
  { id: "1", name: "iPhone 17 Pro", cost: 15000, redeemed: false },
  { id: "2", name: "Herman Miller Chair", cost: 8000, redeemed: false },
  { id: "3", name: "Coffee", cost: 50, redeemed: true },
];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string; id?: string } | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  
  // Flags to control saving
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLIST);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
      { id: "1", text: "Initial reflection", date: new Date().toISOString() }
  ]);
  const [lifetimeXP, setLifetimeXP] = useState(0); 
  const [levelUp, setLevelUp] = useState({ show: false, newRank: "" });
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);
  const wishlistAudioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHydratingRef = useRef(false);
  const dailyBonusAwardedRef = useRef<Record<string, boolean>>({});

  // Play provided completion sound effect
  const playCompletionSound = () => {
    if (typeof window === "undefined") return;

    try {
      if (!completionAudioRef.current) {
        completionAudioRef.current = new Audio(completionSound);
        completionAudioRef.current.volume = 0.35;
      }

      const audio = completionAudioRef.current;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      // Audio may be blocked
    }
  };

  const playWishlistSound = () => {
    if (typeof window === "undefined") return;

    try {
      if (!wishlistAudioRef.current) {
        wishlistAudioRef.current = new Audio(wishlistSound);
        wishlistAudioRef.current.volume = 0.35;
      }
      const audio = wishlistAudioRef.current;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  };

  // --- Persistence helpers ---
  const getToken = () => localStorage.getItem("token") || undefined;

  const hydrateFromServer = async (userId: string) => {
    try {
      isHydratingRef.current = true;
      const res = await apiGet(`/api/state?userId=${userId}`, getToken());
      if (!res.ok) throw new Error("Failed to load state");
      const data = await res.json();
      
      console.log("Loaded data from server:", data);
      
      if (typeof data.points === 'number') setPoints(data.points);
      if (typeof data.lifetimeXP === 'number') setLifetimeXP(data.lifetimeXP);
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
      if (Array.isArray(data.habits)) setHabits(data.habits);
      if (Array.isArray(data.books)) setBooks(data.books);
      if (Array.isArray(data.wishlist)) setWishlist(data.wishlist);
      
      // Mark as initialized so we can start saving updates
      setIsInitialized(true);
    } catch (err) {
      console.error("Hydration error", err);
      // Do NOT set initialized to true if we failed to load, 
      // to prevent overwriting server data with local zeros.
    } finally {
      isHydratingRef.current = false;
    }
  };

  const persistState = () => {
    if (!user?.id) return;
    if (isHydratingRef.current) return;
    if (!isInitialized) return; // Prevent saving empty state before loading

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      console.log("Saving state to server...");
      apiPost(
        "/api/state",
        {
          userId: user.id,
          points,
          lifetimeXP,
          tasks,
          habits,
          books,
          wishlist,
        },
        getToken(),
      )
        .then((res) => {
          if (!res.ok) throw new Error(`Persist state failed ${res.status}`);
        })
        .catch((err) => console.error("Persist state failed", err));
    }, 1000); // Increased debounce time slightly
  };

  useEffect(() => {
    if (user?.id) {
      hydrateFromServer(user.id);
    } else {
      setPoints(0);
      setLifetimeXP(0);
      setTasks(INITIAL_TASKS);
      setHabits(INITIAL_HABITS);
      setBooks(INITIAL_BOOKS);
      setWishlist(INITIAL_WISHLIST);
      setIsInitialized(false);
    }
  }, [user?.id]);

  useEffect(() => {
    persistState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, lifetimeXP, tasks, habits, books, wishlist]);

  // Google Calendar Integration
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

  useEffect(() => {
    if (!user?.email || !user?.id) return;

    apiPost("/api/auth/login", { email: user.email, password: "check-status" }, getToken())
      .then(res => res.json())
      .then(data => {
        if (data.isGoogleCalendarConnected !== undefined) {
          setIsGoogleCalendarConnected(data.isGoogleCalendarConnected);
        }
      })
      .catch(() => {});
  }, [user?.email, user?.id]);

  const connectGoogleCalendar = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "Please log in first", variant: "destructive" });
      return;
    }

    try {
      const res = await apiGet(`/api/auth/google/connect?userId=${user.id}`, getToken());
      const data = await res.json();
      if (!res.ok || data?.error) {
        toast({ 
          title: "Connection Error", 
          description: data.message || "Could not connect to Google.", 
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast({ title: "Connection Failed", description: "Network error connecting to Google", variant: "destructive" });
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!user?.id) return;

    try {
      const res = await apiPost("/api/auth/google/disconnect", { userId: user.id }, getToken());
      if (!res.ok) throw new Error("Disconnect failed");
      
      setIsGoogleCalendarConnected(false);
      toast({ title: "Disconnected", description: "Google Calendar has been unlinked." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    }
  };

  const syncToGoogleCalendar = async (item: { title: string; time?: string; endTime?: string; date?: string; type?: string; notes?: string }) => {
    if (!isGoogleCalendarConnected || !user?.id) {
        toast({ title: "Connect Google Calendar", description: "Please link your account in Profile settings first.", variant: "destructive" });
        return;
    }
    
    try {
      const res = await apiPost(
        "/api/calendar/sync",
        {
          userId: user.id,
          title: item.title,
          time: item.time,
          endTime: item.endTime,
          date: item.date,
          type: item.type || "event",
          notes: item.notes || "",
        },
        getToken(),
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details || err.message || "Failed to sync");
      }

      const itemType = item.type === "task" ? "Google Task" : "Calendar Event";
      toast({ 
          title: "Synced Successfully", 
          description: `Added "${item.title}" as ${itemType}`, 
          className: "bg-[#0A84FF] text-white border-none" 
      });
    } catch (error: any) {
      toast({ 
        title: "Sync Failed", 
        description: error?.message || "Unable to add to Google Calendar", 
        variant: "destructive" 
      });
    }
  };

  const login = (email: string, name: string, id?: string) => {
    const userData = { email, name, id };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setPoints(0);
    setLifetimeXP(0);
    setTasks(INITIAL_TASKS);
    setIsInitialized(false);
  };

  // Rank Logic (Simulated for frontend)
  const getRankData = (xp: number) => {
      // Iron
      if (xp < 2000) return { name: "Iron 1", nextXP: 2000 };
      if (xp < 2500) return { name: "Iron 2", nextXP: 2500 };
      if (xp < 3000) return { name: "Iron 3", nextXP: 3000 };
      // Bronze
      if (xp < 4000) return { name: "Bronze 1", nextXP: 4000 };
      if (xp < 5500) return { name: "Bronze 2", nextXP: 5500 };
      if (xp < 7500) return { name: "Bronze 3", nextXP: 7500 };
      // Silver
      if (xp < 10000) return { name: "Silver 1", nextXP: 10000 };
      if (xp < 15000) return { name: "Silver 2", nextXP: 15000 };
      if (xp < 22000) return { name: "Silver 3", nextXP: 22000 };
      // Gold
      if (xp < 32000) return { name: "Gold 1", nextXP: 32000 };
      if (xp < 50000) return { name: "Gold 2", nextXP: 50000 };
      if (xp < 75000) return { name: "Gold 3", nextXP: 75000 };
      // Platinum
      if (xp < 110000) return { name: "Platinum 1", nextXP: 110000 };
      if (xp < 160000) return { name: "Platinum 2", nextXP: 160000 };
      if (xp < 230000) return { name: "Platinum 3", nextXP: 230000 };
      // Diamond
      if (xp < 330000) return { name: "Diamond 1", nextXP: 330000 };
      if (xp < 470000) return { name: "Diamond 2", nextXP: 470000 };
      if (xp < 650000) return { name: "Diamond 3", nextXP: 650000 };
      // Ascendant
      if (xp < 750000) return { name: "Ascendant 1", nextXP: 750000 };
      if (xp < 850000) return { name: "Ascendant 2", nextXP: 850000 };
      if (xp < 920000) return { name: "Ascendant 3", nextXP: 920000 };
      // Immortal
      if (xp < 950000) return { name: "Immortal 1", nextXP: 950000 };
      if (xp < 970000) return { name: "Immortal 2", nextXP: 970000 };
      if (xp < 985000) return { name: "Immortal 3", nextXP: 985000 };
      
      return { name: "Radiant", nextXP: Infinity };
  };

  const { name: rank, nextXP: nextRankXP } = getRankData(lifetimeXP);
  
  // --- Logic: Daily Penalties & Reset ---
  useEffect(() => {
    const lastLogin = localStorage.getItem("lastLogin");
    const today = new Date().toISOString().split('T')[0];

    if (lastLogin && lastLogin !== today) {
        let penalty = 0;
        const unfinishedTasks = tasks.filter(t => !t.completed && t.date < today);
        if (unfinishedTasks.length > 0) penalty += unfinishedTasks.length * 50;

        const yesterdayHabits = habits.filter(h => !h.completed);
        if (yesterdayHabits.length > 0) penalty += yesterdayHabits.length * 20;

        if (penalty > 0) {
            deductPoints(penalty);
            toast({ title: "New Day", description: `Yesterday's penalties: -${penalty} pts`, variant: "destructive" });
        }
        setHabits(prev => prev.map(h => ({ ...h, completed: false })));
    }
    localStorage.setItem("lastLogin", today);
  }, []); 

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
    return new Promise((resolve) => {
        setTimeout(() => {
            const lower = title.toLowerCase();
            let score = 100;
            if (lower.includes("gym") || lower.includes("workout")) score = 300;
            else if (lower.includes("code") || lower.includes("study")) score = 500;
            else if (lower.includes("read")) score = 150;
            resolve(score);
        }, 1000); 
    });
  };

  const saveJournalEntry = async (text: string, audioBlob?: Blob) => {
      // Mock save locally + backend sync happens via persistState
      addPoints(50);
      const newEntry = { id: Math.random().toString(), text, date: new Date().toISOString(), hasAudio: !!audioBlob };
      setJournalEntries(prev => [...prev, newEntry]);
  }

  // --- CRUD Functions (simplified for brevity, logic maintained) ---
  const addTask = (task: Omit<Task, "id" | "completed">) => {
    setTasks((prev) => [...prev, { ...task, id: Math.random().toString(36).substr(2, 9), completed: false }]);
  };
  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id === id) {
        if (!t.completed) { addPoints(t.points); playCompletionSound(); } else { deductPoints(t.points); }
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const addHabit = (h: Omit<Habit, "id" | "completed">) => setHabits(prev => [...prev, { ...h, id: Math.random().toString(), completed: false }]);
  const updateHabit = (id: string, u: Partial<Habit>) => setHabits(prev => prev.map(h => h.id === id ? { ...h, ...u } : h));
  const deleteHabit = (id: string) => setHabits(prev => prev.filter(h => h.id !== id));
  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => {
        if (h.id === id) {
             if (!h.completed) { addPoints(h.points); playCompletionSound(); } else { deductPoints(h.points); }
             return { ...h, completed: !h.completed };
        }
        return h;
    }));
  };

  const addBook = (b: Omit<Book, "id" | "status" | "progress" | "currentPage">) => setBooks(prev => [...prev, { ...b, id: Math.random().toString(), status: "not-started", progress: 0, currentPage: 0 }]);
  const updateBook = (id: string, u: Partial<Book>) => setBooks(prev => prev.map(b => b.id === id ? { ...b, ...u } : b));
  const deleteBook = (id: string) => setBooks(prev => prev.filter(b => b.id !== id));
  const updateBookProgress = (id: string, page: number) => {
      setBooks(prev => prev.map(b => {
          if (b.id === id) {
              const newProgress = Math.min(100, Math.round((page / b.totalPages) * 100));
              if (newProgress === 100 && b.progress < 100) addPoints(b.totalPoints);
              return { ...b, currentPage: page, progress: newProgress, status: newProgress === 100 ? "completed" : "reading" };
          }
          return b;
      }));
  };

  const addWishlistItem = (i: Omit<WishlistItem, "id" | "redeemed">) => setWishlist(prev => [...prev, { ...i, id: Math.random().toString(), redeemed: false }]);
  const updateWishlistItem = (id: string, u: Partial<WishlistItem>) => setWishlist(prev => prev.map(i => i.id === id ? { ...i, ...u } : i));
  const deleteWishlistItem = (id: string) => setWishlist(prev => prev.filter(i => i.id !== id));
  const redeemItem = (id: string) => {
      const item = wishlist.find(i => i.id === id);
      if (item && points >= item.cost) {
          deductPoints(item.cost);
          setWishlist(prev => prev.map(i => i.id === id ? { ...i, redeemed: true } : i));
          playWishlistSound();
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