import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { GlowingBalance } from "@/components/ui/GlowingBalance";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { useGame } from "@/lib/store";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Plus, Check, Clock, Calendar as CalendarIcon, Pencil, Trash2, TrendingUp, Sparkles, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { CalendarModal } from "@/components/ui/CalendarModal";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import quotesRaw from "@assets/quotes.txt?raw";
import { apiGet } from "@/apiClient";

export default function Home() {
  const { 
    user, tasks, setTasks, toggleTask, addTask, updateTask, deleteTask, getAISuggestion, 
    lifetimeXP, nextRankXP, isGoogleCalendarConnected, syncToGoogleCalendar 
  } = useGame();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [taskScheduledTime, setTaskScheduledTime] = useState("");
  const [taskEndTime, setTaskEndTime] = useState("");
  const [taskPoints, setTaskPoints] = useState<string>("");
  const [taskNotes, setTaskNotes] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [calendarItemType, setCalendarItemType] = useState<"task" | "event">("task");

  const level = Math.max(1, Math.floor(lifetimeXP / 1000) + 1);
  const progressToNextLevel = nextRankXP > 0 ? Math.min(100, Math.round((lifetimeXP / nextRankXP) * 100)) : 0;
  const filteredTasks = tasks.filter((t) => t.date === selectedDate.toISOString().split("T")[0]);
  const completedCount = filteredTasks.filter(t => t.completed).length;
  const totalCount = filteredTasks.length;
  const allTasksCompleted = totalCount > 0 && completedCount === totalCount;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Load quotes from attached_assets/quotes.txt file
  const quotes = useMemo(() => {
    return quotesRaw
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean); // Remove empty lines
  }, []);
  
  // Start with a random quote each time the component mounts (when navigating to this page)
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Set random initial quote when component mounts or quotes change
  useEffect(() => {
    if (quotes.length > 0) {
      setQuoteIndex(Math.floor(Math.random() * quotes.length));
    }
  }, []); // Only run once on mount

  // Rotate quotes every 5 seconds
  useEffect(() => {
    if (quotes.length === 0) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const weeklyData = [
    { day: "M", points: 450 }, { day: "T", points: 820 }, { day: "W", points: 300 },
    { day: "T", points: 600 }, { day: "F", points: 950 }, { day: "S", points: 120 }, { day: "S", points: 50 },
  ];
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const handleGeneratePoints = async () => {
    if (taskTitle.length > 3) {
        setIsAnalyzing(true);
        const points = await getAISuggestion(taskTitle);
        setAiSuggestion(points);
        setTaskPoints(points.toString());
        setIsAnalyzing(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setTaskTitle("");
    setTaskTime("");
    setTaskScheduledTime("");
    setTaskEndTime("");
    setTaskPoints("");
    setTaskNotes("");
    setSyncToCalendar(false);
    setCalendarItemType("task");
    setAiSuggestion(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setIsEditing(true);
    setEditingId(task.id);
    setTaskTitle(task.title);
    setTaskTime(task.time);
    setTaskScheduledTime("");
    setTaskEndTime("");
    setTaskPoints(task.points.toString());
    setTaskNotes(task.notes || "");
    setSyncToCalendar(false);
    setCalendarItemType("task");
    setAiSuggestion(task.points);
    setIsDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskTitle) return;
    const finalPoints = parseInt(taskPoints) || aiSuggestion || 100;
    if (isEditing && editingId) {
        updateTask(editingId, {
            title: taskTitle, time: taskTime || "30m", points: finalPoints, notes: taskNotes
        });
    } else {
        addTask({
            title: taskTitle, time: taskTime || "30m", points: finalPoints,
            date: selectedDate.toISOString().split("T")[0], priority: "medium", notes: taskNotes
        });
    }
    if (syncToCalendar && isGoogleCalendarConnected) {
        syncToGoogleCalendar({
            title: taskTitle, time: taskScheduledTime || taskTime, endTime: taskEndTime,
            date: selectedDate.toISOString().split("T")[0], type: calendarItemType, notes: taskNotes
        });
    }
    setIsDialogOpen(false);
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete task?")) deleteTask(id);
  };

  const dayOffsets = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <MobileShell>
      <div className="flex justify-between items-end mb-8 pt-4">
        <div>
            <div className="flex items-center gap-2 mb-1">
                 <span className="text-[#0A84FF] text-xs font-bold uppercase tracking-wider bg-[#0A84FF]/10 px-2 py-0.5 rounded-full border border-[#0A84FF]/20">
                    {format(selectedDate, "EEE, MMM do")}
                 </span>
            </div>
            <div className="text-xs text-[#8E8E93] bg-white/5 border border-white/5 rounded-lg px-3 py-2 mb-2 max-w-xs leading-snug">
                “{quotes[quoteIndex]}”
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{greeting}, {user?.name || 'User'}</h1>
            <div className="flex items-center gap-2 mt-2">
                <div className="bg-[#1C1C1E] px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Lvl {level}</span>
                    <div className="w-16 h-1.5 bg-[#2C2C2E] rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-[#0A84FF] to-[#0A84FF]/50"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNextLevel}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
        <GlowingBalance />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setViewDate(addDays(viewDate, -3))} className="text-[#8E8E93] hover:text-white shrink-0 hover:bg-white/10 rounded-full"><ChevronLeft /></Button>
        <div className="overflow-x-auto pb-2 scrollbar-hide flex-1">
            <div className="flex gap-2 min-w-max px-1 justify-center">
                {dayOffsets.map((offset) => {
                    const date = addDays(viewDate, offset);
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                        <button key={offset} onClick={() => setSelectedDate(date)}
                            className={cn("flex flex-col items-center justify-center w-[60px] h-[64px] rounded-[16px] transition-all border",
                                isSelected ? "bg-[#0A84FF] border-[#0A84FF] text-white shadow-lg shadow-blue-500/20 scale-105" : "bg-[#1C1C1E] border-white/5 text-[#8E8E93] hover:bg-[#2C2C2E]"
                            )}
                        >
                            <span className="text-[10px] font-bold uppercase mb-0.5">{format(date, "EEE")}</span>
                            <span className={cn("text-lg font-bold", isSelected ? "text-white" : "text-white/80")}>{format(date, "d")}</span>
                            {isToday && <div className="w-1 h-1 rounded-full bg-[#0A84FF] mt-1" />}
                        </button>
                    );
                })}
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setViewDate(addDays(viewDate, 3))} className="text-[#8E8E93] hover:text-white shrink-0 hover:bg-white/10 rounded-full"><ChevronRight /></Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <LiquidCard className="flex flex-col items-center justify-center py-4 bg-[#1C1C1E] border-white/10 relative overflow-hidden">
             <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Daily Goal</span>
             </div>
             <div className="mt-4"><ProgressRing completed={completedCount} total={totalCount} size={100} label="" color="#0A84FF" /></div>
        </LiquidCard>
        <LiquidCard className="flex flex-col justify-end p-4 bg-[#1C1C1E] border-white/10">
            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold text-[#8E8E93] uppercase">Weekly Focus</span><TrendingUp size={14} className="text-[#30D158]" /></div>
            <div className="h-[80px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}><Bar dataKey="points" radius={[4, 4, 4, 4]}>{weeklyData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === currentDayIndex ? "#0A84FF" : "#2C2C2E"} />))}</Bar></BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-2 px-1">{weeklyData.map((d, i) => (<span key={i} className={cn("text-[8px] font-bold uppercase", i === currentDayIndex ? "text-white" : "text-[#505055]")}>{d.day}</span>))}</div>
        </LiquidCard>
      </div>
      <CalendarModal open={isCalendarOpen} onOpenChange={setIsCalendarOpen} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-lg font-bold text-white tracking-tight">Tasks</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button onClick={handleOpenAdd} size="sm" className="bg-[#1C1C1E] text-[#0A84FF] hover:bg-[#2C2C2E] rounded-full h-8 px-4 font-semibold text-xs border border-[#0A84FF]/30"><Plus size={14} className="mr-1" /> Add Task</Button></DialogTrigger>
          <DialogContent className="bg-[#1C1C1E] border-white/10 text-white sm:max-w-[520px] rounded-[24px] shadow-2xl p-6">
            <DialogHeader className="pb-2"><DialogTitle className="font-bold text-white text-2xl">{isEditing ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="title" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Title</Label><div className="relative"><Input id="title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF] pr-16 rounded-[12px] h-12" placeholder="Task name" /><div className="absolute right-2 top-2"><Button size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0 text-[#0A84FF]" onClick={handleGeneratePoints} disabled={isAnalyzing || taskTitle.length < 3}>{isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}</Button></div></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="time">Duration</Label><Input id="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" placeholder="30m" /></div><div className="grid gap-2"><Label htmlFor="scheduledTime">Scheduled</Label><Input id="scheduledTime" type="time" value={taskScheduledTime} onChange={(e) => setTaskScheduledTime(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" /></div></div>
              <div className="grid gap-2"><Label htmlFor="points">Points (XP)</Label><Input id="points" type="number" value={taskPoints} onChange={(e) => { setTaskPoints(e.target.value); setAiSuggestion(null); }} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" placeholder="100" /></div>
              <div className="grid gap-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px]" placeholder="Details..." /></div>
              {isGoogleCalendarConnected && (
                <div className="space-y-3 bg-[#2C2C2E] rounded-[12px] p-3 border border-white/5">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><CalendarIcon size={16} className="text-[#EA4335]" /><Label htmlFor="gcal" className="text-white cursor-pointer">Add to Google Calendar</Label></div><Switch id="gcal" checked={syncToCalendar} onCheckedChange={setSyncToCalendar} className="data-[state=checked]:bg-[#EA4335]" /></div>
                </div>
              )}
            </div>
            <Button onClick={handleSaveTask} className="w-full bg-[#0A84FF] text-white hover:bg-[#007AFF] font-bold rounded-[12px] h-12 text-base">{isEditing ? "Save" : "Create"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className={cn("space-y-3 pb-24 transition-all duration-500 rounded-[24px]", allTasksCompleted ? "p-6 bg-gradient-to-b from-[#0A84FF]/10 to-transparent border border-[#0A84FF]/20" : "")}>
        <AnimatePresence>
        {filteredTasks.map((task) => (
          <LiquidCard as={motion.div} layout key={task.id} className={cn("flex items-center gap-4 p-4 transition-all group", task.completed ? "opacity-60" : "")} onClick={() => toggleTask(task.id)}>
            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 relative", task.completed ? "bg-[#0A84FF] border-[#0A84FF]" : "border-[#8E8E93] group-hover:border-[#0A84FF]")}>{task.completed && <Check size={14} className="text-white font-bold" />}</div>
            <div className="flex-1 min-w-0"><h3 className={cn("text-base font-semibold truncate", task.completed ? "text-[#8E8E93] line-through" : "text-white")}>{task.title}</h3><div className="flex items-center gap-3 mt-1"><span className="text-xs text-[#8E8E93] font-medium flex items-center gap-1"><Clock size={12} /> {task.time}</span><span className="bg-[#0A84FF]/10 text-[#0A84FF] px-2 py-0.5 rounded-[6px] text-[10px] font-bold border border-[#0A84FF]/20">{task.points} PTS</span></div></div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8 text-[#8E8E93] hover:text-white" onClick={(e) => { e.stopPropagation(); handleOpenEdit(task); }}><Pencil size={16} /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-[#8E8E93] hover:text-[#FF453A]" onClick={(e) => handleDeleteTask(task.id, e)}><Trash2 size={16} /></Button></div>
          </LiquidCard>
        ))}
        </AnimatePresence>
      </div>
    </MobileShell>
  );
}