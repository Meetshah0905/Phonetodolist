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
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(INITIAL_WISHLIST);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
      { id: "1", text: "Initial reflection", date: new Date().toISOString() }
  ]);
  const [lifetimeXP, setLifetimeXP] = useState(0); // Start with 0 XP
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
      audio.play().catch(() => {
        // Audio play can be blocked until user interaction; ignore errors
      });
    } catch {
      // Audio may be blocked; fail silently
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
      const data = await apiGet(`/api/state?userId=${userId}`, getToken());
      setPoints(data.points ?? 0);
      setLifetimeXP(data.lifetimeXP ?? 0);
      setTasks((data.tasks as Task[]) ?? INITIAL_TASKS);
      setHabits((data.habits as Habit[]) ?? INITIAL_HABITS);
      setBooks((data.books as Book[]) ?? INITIAL_BOOKS);
      setWishlist((data.wishlist as WishlistItem[]) ?? INITIAL_WISHLIST);
    } catch (err) {
      console.error("Hydration error", err);
    } finally {
      isHydratingRef.current = false;
    }
  };

  const persistState = () => {
    if (!user?.id) return;
    if (isHydratingRef.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
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
      ).catch((err) => console.error("Persist state failed", err));
    }, 500);
  };

  useEffect(() => {
    if (user?.id) {
      hydrateFromServer(user.id);
    } else {
      // reset to defaults if no user
      setPoints(0);
      setLifetimeXP(0);
      setTasks(INITIAL_TASKS);
      setHabits(INITIAL_HABITS);
      setBooks(INITIAL_BOOKS);
      setWishlist(INITIAL_WISHLIST);
    }
  }, [user?.id]);

  useEffect(() => {
    persistState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, lifetimeXP, tasks, habits, books, wishlist]);

  // Google Calendar Integration
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

  // Refresh Google Calendar link status when a user is loaded from storage
  useEffect(() => {
    if (!user?.email || !user?.id) return;

    apiPost("/api/auth/login", { email: user.email, password: "check-status" }, getToken())
      .then(data => {
        if (data.isGoogleCalendarConnected !== undefined) {
          setIsGoogleCalendarConnected(data.isGoogleCalendarConnected);
        }
      })
      .catch(() => {
        // Non-blocking: if this fails, the rest of the app still works
      });
  }, [user?.email, user?.id]);

  const connectGoogleCalendar = async () => {
    if (!user?.id) {
      toast({ title: "Error", description: "Please log in first", variant: "destructive" });
      return;
    }

    try {
      const data = await apiGet(`/api/auth/google/connect?userId=${user.id}`, getToken());
      
      if (data?.error) {
        toast({ 
          title: "Setup Required", 
          description: data.message || "Google Calendar needs to be configured. Check GOOGLE_CALENDAR_SETUP.md", 
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast({ title: "Connection Failed", description: "Unable to connect to Google Calendar", variant: "destructive" });
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!user?.id) return;

    try {
      await apiPost("/api/auth/google/disconnect", { userId: user.id }, getToken());
      
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
      await apiPost(
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

      const itemType = item.type === "task" ? "Google Task" : "Google Calendar";
      toast({ 
          title: `Synced to ${itemType}`, 
          description: `Added: ${item.title}`, 
          className: "bg-white text-black font-bold border-none" 
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
    
    // Check if Google Calendar is connected for this user
    if (id) {
      apiPost("/api/auth/login", { email, password: "check-status" }, getToken())
        .then(data => {
          if (data.isGoogleCalendarConnected !== undefined) {
            setIsGoogleCalendarConnected(data.isGoogleCalendarConnected);
          }
        })
        .catch(() => {
          // Ignore errors, user is already logged in
        });
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setPoints(0);
    setLifetimeXP(0);
    setTasks(INITIAL_TASKS);
    // Reset other state if needed
  };

  // Rank Logic
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
  const rankProgress = Math.min(100, nextRankXP === 0 ? 0 : Math.round((lifetimeXP / nextRankXP) * 100));

  // --- Logic: Daily Penalties & Reset ---
  useEffect(() => {
    const lastLogin = localStorage.getItem("lastLogin");
    const today = new Date().toISOString().split('T')[0];

    if (lastLogin && lastLogin !== today) {
        // It's a new day! Calculate penalties.
        let penalty = 0;
        
        // 1. Unfinished tasks from "yesterday" - deduct 50 points per incomplete task
        const unfinishedTasks = tasks.filter(t => !t.completed && t.date < today);
        if (unfinishedTasks.length > 0) {
            const taskPenalty = unfinishedTasks.length * 50;
            penalty += taskPenalty;
            toast({ 
              title: "Task Penalty", 
              description: `-${taskPenalty} pts for ${unfinishedTasks.length} missed task${unfinishedTasks.length > 1 ? 's' : ''}`, 
              variant: "destructive" 
            });
        }

        // 2. Incomplete habits from yesterday - deduct 20 points per incomplete habit
        const yesterdayHabits = habits.filter(h => !h.completed);
        if (yesterdayHabits.length > 0) {
            const habitPenalty = yesterdayHabits.length * 20;
            penalty += habitPenalty;
            toast({ 
              title: "Routine Penalty", 
              description: `-${habitPenalty} pts for ${yesterdayHabits.length} incomplete habit${yesterdayHabits.length > 1 ? 's' : ''}`, 
              variant: "destructive" 
            });
        }

        // 3. Overdue Books
        const overdueBooks = books.filter(b => b.status !== "completed" && b.deadline < today);
        if (overdueBooks.length > 0) {
            penalty += overdueBooks.length * 20;
            toast({ title: "Library Penalty", description: `-${overdueBooks.length * 20} pts for overdue books`, variant: "destructive" });
        }

        // 4. Journal Check (Did they journal yesterday?) - deduct 50 points if no entry
        // Check if there is an entry for "yesterday"
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        const journaledYesterday = journalEntries.some(e => e.date.startsWith(yesterdayString));
        
        if (!journaledYesterday) {
             penalty += 50;
             toast({ title: "Journal Penalty", description: "-50 pts for missing daily reflection", variant: "destructive" });
        }

        if (penalty > 0) {
            deductPoints(penalty);
        }

        // Reset Habits
        setHabits(prev => prev.map(h => ({ ...h, completed: false })));
    }

    localStorage.setItem("lastLogin", today);
  }, []); // Run once on mount

  const addPoints = (amount: number) => {
    setPoints((prev) => prev + amount);
    setLifetimeXP((prev) => {
        const newXP = prev + amount;
        const oldRank = getRankData(prev).name;
        const newRank = getRankData(newXP).name;
        
        if (newRank !== oldRank) {
            setLevelUp({ show: true, newRank });
        }
        return newXP;
    });
  };

  const dismissLevelUp = () => setLevelUp({ show: false, newRank: "" });

  const deductPoints = (amount: number) => {
    setPoints((prev) => Math.max(0, prev - amount));
    setLifetimeXP((prev) => {
        const newXP = Math.max(0, prev - amount);
        const oldRank = getRankData(prev).name;
        const newRank = getRankData(newXP).name;
        
        if (newRank !== oldRank) {
            // Rank decreased, could show a notification if desired
            toast({ 
              title: "Rank Changed", 
              description: `${oldRank} → ${newRank}`, 
              variant: "destructive" 
            });
        }
        return newXP;
    });
  };

  // --- Logic: AI Scoring Simulation ---
  const getAISuggestion = async (title: string): Promise<number> => {
    return new Promise((resolve) => {
        // Simulate "Thinking" time
        setTimeout(() => {
            const lower = title.toLowerCase();
            let score = 100; // Base score
            
            // "Gemini" Simulation Logic
            if (lower.includes("gym") || lower.includes("workout") || lower.includes("exercise")) score = 300;
            else if (lower.includes("run") || lower.includes("cardio")) score = 250;
            else if (lower.includes("read") || lower.includes("study") || lower.includes("learn")) score = 150;
            else if (lower.includes("code") || lower.includes("dev") || lower.includes("project")) score = 500;
            else if (lower.includes("meditate") || lower.includes("yoga")) score = 200;
            else if (lower.includes("clean") || lower.includes("chores")) score = 120;
            else if (lower.includes("write") || lower.includes("journal")) score = 180;
            
            // Random variation to feel "organic"
            const variation = Math.floor(Math.random() * 20) - 10;
            resolve(score + variation);
        }, 1500); 
    });
  };

  const saveJournalEntry = async (text: string, audioBlob?: Blob) => {
      // Mock backend save
      return new Promise<void>((resolve) => {
          setTimeout(() => {
              addPoints(50);
              const newEntry = { 
                id: Math.random().toString(), 
                text, 
                date: new Date().toISOString(),
                hasAudio: !!audioBlob,
              };
              setJournalEntries(prev => [...prev, newEntry]);
              resolve();
          }, 500);
      })
  }

  // --- TASK CRUD ---
  const addTask = (task: Omit<Task, "id" | "completed">) => {
    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9), completed: false };
    setTasks((prev) => [...prev, newTask]);
    toast({ title: "Task Added", description: `Potential reward: ${task.points} pts` });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    toast({ title: "Task Updated", description: "Changes saved successfully." });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast({ title: "Task Deleted", variant: "destructive" });
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      const newTasks = prev.map((t) => {
        if (t.id === id) {
          const isCompleting = !t.completed;
          if (isCompleting) {
            addPoints(t.points);
            playCompletionSound();
            toast({ title: "Task Complete!", description: `+${t.points} pts`, className: "bg-[#0A84FF] text-white font-bold" });
          } else {
            deductPoints(t.points);
          }
          return { ...t, completed: isCompleting };
        }
        return t;
      });

      // Check for Day Completion (Celebration)
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = newTasks.filter(t => t.date === today);
      const allDone = todaysTasks.length > 0 && todaysTasks.every(t => t.completed);

      const prevAllDone = prev.filter(t => t.date === today).every(t => t.completed);
      if (allDone && !dailyBonusAwardedRef.current[today]) {
        dailyBonusAwardedRef.current[today] = true;
        setTimeout(() => {
            toast({ title: "DAY CONQUERED", description: "All daily protocols complete. +500 Bonus.", className: "bg-[#0A84FF] text-white font-bold text-lg" });
            addPoints(500);
        }, 500);
      } else if (!allDone && prevAllDone && dailyBonusAwardedRef.current[today]) {
        dailyBonusAwardedRef.current[today] = false;
        deductPoints(500);
      }

      return newTasks;
    });
  };

  // --- HABIT ACTIONS ---
  const addHabit = (habit: Omit<Habit, "id" | "completed">) => {
    const newHabit = { ...habit, id: Math.random().toString(36).substr(2, 9), completed: false };
    setHabits((prev) => [...prev, newHabit]);
    toast({ title: "Habit Created", description: "Routine updated." });
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
    toast({ title: "Habit Updated" });
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    toast({ title: "Habit Deleted", variant: "destructive" });
  };

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const isCompleting = !h.completed;
          if (isCompleting) {
            addPoints(h.points);
            playCompletionSound();
            toast({ title: "Habit Done!", description: `+${h.points} pts`, className: "bg-[#30D158] text-white font-bold" });
          } else {
            deductPoints(h.points);
          }
          return { ...h, completed: isCompleting };
        }
        return h;
      })
    );
  };

  // --- BOOK CRUD ---
  const addBook = (book: Omit<Book, "id" | "status" | "progress" | "currentPage">) => {
    const newBook = { ...book, id: Math.random().toString(36).substr(2, 9), status: "not-started" as const, progress: 0, currentPage: 0 };
    setBooks((prev) => [...prev, newBook]);
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    toast({ title: "Book Updated", description: "Changes saved." });
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    toast({ title: "Book Removed", variant: "destructive" });
  };

  const updateBookProgress = (id: string, page: number) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
            const oldProgress = b.progress;
            const newProgress = Math.min(100, Math.round((page / b.totalPages) * 100));
            
            // Only award points if transitioning from incomplete to 100% for the first time
            if (newProgress === 100 && oldProgress < 100 && b.status !== "completed") {
                addPoints(b.totalPoints);
                toast({ title: "Book Finished!", description: `+${b.totalPoints} pts`, className: "bg-[#0A84FF] text-white font-bold" });
                return { ...b, currentPage: page, progress: newProgress, status: "completed" };
            }
            
            // If sliding back from 100%, deduct points
            if (oldProgress === 100 && newProgress < 100 && b.status === "completed") {
                deductPoints(b.totalPoints);
                toast({ title: "Progress Updated", description: `Book unmarked as complete. -${b.totalPoints} pts`, variant: "destructive" });
                return { ...b, currentPage: page, progress: newProgress, status: "reading" };
            }
            
            return { ...b, currentPage: page, progress: newProgress, status: newProgress > 0 ? (b.status === "completed" ? "completed" : "reading") : "not-started" };
        }
        return b;
      })
    );
  };

  // --- WISHLIST CRUD ---
  const addWishlistItem = (item: Omit<WishlistItem, "id" | "redeemed">) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), redeemed: false };
    setWishlist((prev) => [...prev, newItem]);
  };

  const updateWishlistItem = (id: string, updates: Partial<WishlistItem>) => {
    setWishlist(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    toast({ title: "Item Updated" });
  };

  const deleteWishlistItem = (id: string) => {
    setWishlist(prev => prev.filter(i => i.id !== id));
    toast({ title: "Item Deleted", variant: "destructive" });
  };

  const redeemItem = (id: string) => {
    const item = wishlist.find((i) => i.id === id);
    if (!item) return;

    if (points >= item.cost) {
      deductPoints(item.cost);
      setWishlist((prev) => prev.map((i) => (i.id === id ? { ...i, redeemed: true } : i)));
      toast({ title: "Item Redeemed!", description: `Enjoy your ${item.name}`, className: "bg-white text-black font-bold" });
      playWishlistSound();
    } else {
      toast({ title: "Insufficient Funds", description: `You need ${item.cost - points} more points.`, variant: "destructive" });
    }
  };

  return (
    <GameContext.Provider
      value={{
        points,
        tasks,
        habits,
        books,
        wishlist,
        journalEntries,
        lifetimeXP,
        rank,
        nextRankXP,
        levelUp,
        dismissLevelUp,
        addPoints,
        deductPoints,
        
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabit,
        
        addBook,
        updateBook,
        deleteBook,
        updateBookProgress,
        
        addWishlistItem,
        updateWishlistItem,
        deleteWishlistItem,
        redeemItem,
        
        getAISuggestion,
        saveJournalEntry,
        user,
        login,
        logout,
        
        isGoogleCalendarConnected,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        syncToGoogleCalendar
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}
