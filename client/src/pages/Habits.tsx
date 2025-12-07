import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { useGame } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Habits() {
  const { habits, toggleHabit, addHabit, updateHabit, deleteHabit, isGoogleCalendarConnected, syncToGoogleCalendar } = useGame();
  const [openSections, setOpenSections] = useState(["morning", "afternoon", "evening", "night"]);
  
  const morningHabits = habits.filter(h => h.type === "morning");
  const afternoonHabits = habits.filter(h => h.type === "afternoon");
  const eveningHabits = habits.filter(h => h.type === "evening");
  const nightHabits = habits.filter(h => h.type === "night");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [habitTitle, setHabitTitle] = useState("");
  const [habitType, setHabitType] = useState<"morning" | "afternoon" | "evening" | "night">("morning");
  const [habitPoints, setHabitPoints] = useState("10");
  const [habitMustDo, setHabitMustDo] = useState(false);
  const [syncToCalendar, setSyncToCalendar] = useState(false);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setHabitTitle("");
    setHabitType("morning");
    setHabitPoints("10");
    setHabitMustDo(false);
    setSyncToCalendar(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (habit: any) => {
    setIsEditing(true);
    setEditingId(habit.id);
    setHabitTitle(habit.title);
    setHabitType(habit.type);
    setHabitPoints(habit.points.toString());
    setHabitMustDo(habit.mustDo);
    setSyncToCalendar(false);
    setIsDialogOpen(true);
  };

  const getResetTime = (type: string) => {
    switch(type) {
        case "morning": return "06:30 - 11:59";
        case "afternoon": return "12:00 - 17:59";
        case "evening": return "18:00 - 21:59";
        case "night": return "22:00 - 06:29";
        default: return "All Day";
    }
  };

  const handleSaveHabit = () => {
    if (!habitTitle) return;

    if (isEditing && editingId) {
        updateHabit(editingId, {
            title: habitTitle,
            type: habitType,
            points: parseInt(habitPoints) || 10,
            mustDo: habitMustDo,
            resetTime: getResetTime(habitType)
        });
    } else {
        addHabit({
            title: habitTitle,
            type: habitType,
            points: parseInt(habitPoints) || 10,
            mustDo: habitMustDo,
            resetTime: getResetTime(habitType)
        });
    }

    if (syncToCalendar && isGoogleCalendarConnected) {
        syncToGoogleCalendar({
            title: habitTitle,
            type: habitType,
            date: "Daily"
        });
    }

    setIsDialogOpen(false);
  };

  const handleDeleteHabit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this habit?")) {
        deleteHabit(id);
    }
  };

  return (
    <MobileShell>
      <div className="flex justify-between items-center mb-6 pt-2 px-1">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Routines</h2>
            <p className="text-[#8E8E93] text-sm">System maintenance protocols.</p>
        </div>
        <Button onClick={handleOpenAdd} size="icon" className="rounded-full bg-[#1C1C1E] text-[#0A84FF] hover:bg-[#2C2C2E] border border-[#0A84FF]/30">
            <Plus size={20} />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="bg-[#1C1C1E] border-white/10 text-white sm:max-w-[425px] rounded-[20px] shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-bold text-white text-xl">{isEditing ? "Edit Habit" : "New Habit"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Title</Label>
                <Input id="title" value={habitTitle} onChange={(e) => setHabitTitle(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Type</Label>
                    <Select value={habitType} onValueChange={(val: "morning" | "afternoon" | "evening" | "night") => setHabitType(val)}>
                        <SelectTrigger className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1C1C1E] border-white/10 text-white">
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                            <SelectItem value="night">Night</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="points" className="text-[#8E8E93] font-medium text-xs uppercase tracking-wide">Points</Label>
                    <Input id="points" type="number" value={habitPoints} onChange={(e) => setHabitPoints(e.target.value)} className="bg-[#2C2C2E] border-transparent text-white rounded-[12px] h-12" />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="mustDo" className="text-white font-medium">Critical (Must Do)</Label>
                <Switch id="mustDo" checked={habitMustDo} onCheckedChange={setHabitMustDo} className="data-[state=checked]:bg-[#FF9F0A]" />
              </div>
              
              {isGoogleCalendarConnected && (
                <div className="flex items-center justify-between py-2 border-t border-white/5 pt-4 mt-2">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#EA4335]" />
                        <Label htmlFor="gcal" className="text-white font-medium cursor-pointer">Sync to Google Calendar</Label>
                    </div>
                    <Switch id="gcal" checked={syncToCalendar} onCheckedChange={setSyncToCalendar} className="data-[state=checked]:bg-[#EA4335]" />
                </div>
              )}
            </div>
            <Button onClick={handleSaveHabit} className="w-full bg-[#0A84FF] text-white hover:bg-[#007AFF] font-bold rounded-[12px] h-12 text-base">
              {isEditing ? "Save Changes" : "Create Habit"}
            </Button>
          </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* Morning Section */}
        <HabitSection 
            title="Morning Protocol" 
            time="06:30 - 11:59" 
            habits={morningHabits} 
            isOpen={openSections.includes("morning")}
            onToggle={() => setOpenSections(prev => prev.includes("morning") ? prev.filter(s => s !== "morning") : [...prev, "morning"])}
            onToggleHabit={toggleHabit}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteHabit}
        />

        {/* Afternoon Section */}
        <HabitSection 
            title="Afternoon Grind" 
            time="12:00 - 17:59" 
            habits={afternoonHabits} 
            isOpen={openSections.includes("afternoon")}
            onToggle={() => setOpenSections(prev => prev.includes("afternoon") ? prev.filter(s => s !== "afternoon") : [...prev, "afternoon"])}
            onToggleHabit={toggleHabit}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteHabit}
        />

        {/* Evening Section */}
        <HabitSection 
            title="Evening Wind Down" 
            time="18:00 - 21:59" 
            habits={eveningHabits} 
            isOpen={openSections.includes("evening")}
            onToggle={() => setOpenSections(prev => prev.includes("evening") ? prev.filter(s => s !== "evening") : [...prev, "evening"])}
            onToggleHabit={toggleHabit}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteHabit}
        />

        {/* Night Section */}
        <HabitSection 
            title="Night Reset" 
            time="22:00 - 06:29" 
            habits={nightHabits} 
            isOpen={openSections.includes("night")}
            onToggle={() => setOpenSections(prev => prev.includes("night") ? prev.filter(s => s !== "night") : [...prev, "night"])}
            onToggleHabit={toggleHabit}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteHabit}
        />
      </div>
    </MobileShell>
  );
}

// Reusable Section Component
function HabitSection({ title, time, habits, isOpen, onToggle, onToggleHabit, onEdit, onDelete }: any) {
    if (habits.length === 0) return null;

    return (
        <div className="bg-[#1C1C1E] rounded-[20px] overflow-hidden border border-white/10">
            <Collapsible open={isOpen} onOpenChange={onToggle}>
                <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div>
                        <h3 className="text-white font-bold text-lg">{title}</h3>
                        <p className="text-[#8E8E93] text-sm mt-0.5">{time}</p>
                    </div>
                    {isOpen ? <ChevronUp className="text-[#8E8E93]" /> : <ChevronDown className="text-[#8E8E93]" />}
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                    <div className="px-5 pb-5 space-y-1">
                        {habits.map((habit: any) => (
                            <div 
                                key={habit.id}
                                onClick={() => onToggleHabit(habit.id)}
                                className="flex items-center gap-4 py-3 cursor-pointer group border-b border-white/5 last:border-0 relative"
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                    habit.completed ? "bg-[#30D158] border-[#30D158]" : "border-[#8E8E93] group-hover:border-[#30D158]"
                                )}>
                                    {habit.completed && <Check size={14} className="text-white font-bold" />}
                                </div>
                                <div className="flex-1 flex justify-between items-center">
                                    <span className={cn(
                                        "text-base font-medium transition-colors",
                                        habit.completed ? "text-[#8E8E93] line-through" : "text-white"
                                    )}>
                                        {habit.title}
                                    </span>
                                    {habit.mustDo && !habit.completed && (
                                        <span className="text-[10px] font-bold text-[#FF9F0A] bg-[#FF9F0A]/10 px-2 py-0.5 rounded-[6px] border border-[#FF9F0A]/20 uppercase tracking-wide">
                                            Must Do
                                        </span>
                                    )}
                                </div>
                                
                                <div className="absolute right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1C1C1E] pl-2">
                                     <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-[#8E8E93] hover:text-white"
                                        onClick={(e) => { e.stopPropagation(); onEdit(habit); }}
                                    >
                                        <Pencil size={14} />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-[#8E8E93] hover:text-[#FF453A]"
                                        onClick={(e) => onDelete(habit.id, e)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
