import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

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
  user: { name: string; email: string } | null;
  login: (email: string, name: string) => void;
  logout: () => void;
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
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
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

  const login = (email: string, name: string) => {
    setUser({ email, name });
    // In a real app, you would fetch user data here
  };

  const logout = () => {
    setUser(null);
    setPoints(0);
    setLifetimeXP(0);
    setTasks(INITIAL_TASKS);
    // Reset other state if needed
  };

  // Rank Logic
  const getRankData = (xp: number) => {
      // Iron
      if (xp < 500) return { name: "Iron 1", nextXP: 500 };
      if (xp < 1000) return { name: "Iron 2", nextXP: 1000 };
      if (xp < 1500) return { name: "Iron 3", nextXP: 1500 };
      
      // Bronze
      if (xp < 2500) return { name: "Bronze 1", nextXP: 2500 };
      if (xp < 3500) return { name: "Bronze 2", nextXP: 3500 };
      if (xp < 5000) return { name: "Bronze 3", nextXP: 5000 };
      
      // Silver
      if (xp < 6000) return { name: "Silver 1", nextXP: 6000 };
      if (xp < 7000) return { name: "Silver 2", nextXP: 7000 };
      if (xp < 8500) return { name: "Silver 3", nextXP: 8500 };
      
      // Gold
      if (xp < 10000) return { name: "Gold 1", nextXP: 10000 };
      if (xp < 11500) return { name: "Gold 2", nextXP: 11500 };
      if (xp < 13500) return { name: "Gold 3", nextXP: 13500 };
      
      // Platinum
      if (xp < 15500) return { name: "Platinum 1", nextXP: 15500 };
      if (xp < 17500) return { name: "Platinum 2", nextXP: 17500 };
      if (xp < 20000) return { name: "Platinum 3", nextXP: 20000 };
      
      // Diamond
      if (xp < 23000) return { name: "Diamond 1", nextXP: 23000 };
      if (xp < 26000) return { name: "Diamond 2", nextXP: 26000 };
      if (xp < 30000) return { name: "Diamond 3", nextXP: 30000 };
      
      // Ascendant
      if (xp < 35000) return { name: "Ascendant 1", nextXP: 35000 };
      if (xp < 40000) return { name: "Ascendant 2", nextXP: 40000 };
      if (xp < 50000) return { name: "Ascendant 3", nextXP: 50000 };
      
      // Immortal
      if (xp < 60000) return { name: "Immortal 1", nextXP: 60000 };
      if (xp < 70000) return { name: "Immortal 2", nextXP: 70000 };
      if (xp < 80000) return { name: "Immortal 3", nextXP: 80000 };
      
      return { name: "Radiant", nextXP: Infinity };
  };

  const { name: rank, nextXP: nextRankXP } = getRankData(lifetimeXP);

  // --- Logic: Daily Penalties & Reset ---
  useEffect(() => {
    const lastLogin = localStorage.getItem("lastLogin");
    const today = new Date().toISOString().split('T')[0];

    if (lastLogin && lastLogin !== today) {
        // It's a new day! Calculate penalties.
        let penalty = 0;
        
        // 1. Unfinished tasks from "yesterday" (simplified: checking current list)
        const unfinishedTasks = tasks.filter(t => !t.completed && t.date < today);
        if (unfinishedTasks.length > 0) {
            penalty += unfinishedTasks.length * 20;
            toast({ title: "Task Penalty", description: `-${unfinishedTasks.length * 20} pts for missed tasks`, variant: "destructive" });
        }

        // 2. Overdue Books
        const overdueBooks = books.filter(b => b.status !== "completed" && b.deadline < today);
        if (overdueBooks.length > 0) {
            penalty += overdueBooks.length * 20;
            toast({ title: "Library Penalty", description: `-${overdueBooks.length * 20} pts for overdue books`, variant: "destructive" });
        }

        // 3. Journal Check (Did they journal yesterday?)
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
              const newEntry = { id: Math.random().toString(), text, date: new Date().toISOString() };
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
      
      if (allDone && !prev.filter(t => t.date === today).every(t => t.completed)) {
        setTimeout(() => {
            toast({ title: "DAY CONQUERED", description: "All daily protocols complete. +500 Bonus.", className: "bg-[#0A84FF] text-white font-bold text-lg" });
            addPoints(500);
        }, 500);
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
            const newProgress = Math.min(100, Math.round((page / b.totalPages) * 100));
            
            if (newProgress === 100 && b.status !== "completed") {
                addPoints(b.totalPoints);
                toast({ title: "Book Finished!", description: `+${b.totalPoints} pts`, className: "bg-[#0A84FF] text-white font-bold" });
                return { ...b, currentPage: page, progress: newProgress, status: "completed" };
            }
            
            return { ...b, currentPage: page, progress: newProgress, status: newProgress > 0 ? "reading" : "not-started" };
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
        logout
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
