import { useState, useEffect } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { useGame } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mic, StopCircle, ExternalLink, Check, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, subDays, isSameDay } from "date-fns";

export default function Journal() {
  const { saveJournalEntry, journalEntries } = useGame();
  const [entry, setEntry] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calendar Logic (Last 7 Days)
  const days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      // Check if entry exists for this date
      const hasEntry = journalEntries.some(e => isSameDay(new Date(e.date), date));
      
      return {
          day: format(date, "EEEEE"), // Single letter day (M, T, W...)
          date: date.getDate(),
          fullDate: date,
          checked: hasEntry,
          isToday: isSameDay(date, new Date())
      };
  });

  const handleSave = async () => {
    if (entry.length < 5) return;
    
    setIsSaving(true);
    await saveJournalEntry(entry);
    setIsSaving(false);
    
    toast({ 
        title: "Reflection Saved", 
        description: "+50 pts added to balance", 
        className: "bg-[#1C1C1E] text-white border border-white/10" 
    });
    setEntry("");
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Mock recording logic
    if (!isRecording) {
        toast({ title: "Recording...", description: "Microphone active" });
    } else {
        toast({ title: "Recording Stopped", description: "Audio saved" });
        setEntry(prev => prev + " [Audio Note Attached] ");
    }
  };

  return (
    <MobileShell>
      <div className="flex justify-between items-start mb-6 pt-2 px-1">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Journal</h2>
            <p className="text-[#8E8E93] text-sm">Capture your thoughts.</p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            className="h-8 bg-[#1C1C1E] text-white border-white/10 text-xs gap-2 rounded-full hover:bg-white/5"
            onClick={() => window.open('https://notion.so', '_blank')}
        >
            <ExternalLink size={12} /> Open Notion
        </Button>
      </div>

      {/* Notification Setting */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-[20px] p-4 mb-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF]">
                 <Bell size={16} />
             </div>
             <div>
                 <div className="font-bold text-white text-xs">Daily Reminder</div>
                 <div className="text-[10px] text-[#8E8E93]">Notification at 11:11 PM</div>
             </div>
         </div>
         <Switch defaultChecked />
      </div>

      {/* Streak Calendar - iPhone Style */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-[24px] p-5 mb-6 flex justify-between items-center shadow-lg shadow-black/20">
        {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-3 relative">
                <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    d.isToday ? "text-white" : "text-[#8E8E93]"
                )}>{d.day}</span>
                
                <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300",
                    d.checked 
                        ? "bg-[#30D158] border-[#30D158] shadow-[0_0_15px_rgba(48,209,88,0.4)]" 
                        : d.isToday
                            ? "bg-[#2C2C2E] border-white/20 text-white"
                            : "bg-transparent border-transparent text-[#505055]"
                )}>
                    {d.checked ? (
                        <Check size={16} className="text-black font-bold" strokeWidth={4} />
                    ) : (
                        <span className="text-sm font-semibold">{d.date}</span>
                    )}
                </div>
            </div>
        ))}
      </div>

      <LiquidCard className="p-0 overflow-hidden bg-[#1C1C1E] border-white/10 min-h-[400px] flex flex-col">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#2C2C2E]/30 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wide text-[#8E8E93]">
                {format(new Date(), "EEEE, MMMM do")}
            </span>
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "rounded-full transition-all duration-300 w-8 h-8",
                    isRecording ? "bg-[#FF453A]/20 text-[#FF453A] animate-pulse" : "text-[#8E8E93] hover:text-white hover:bg-white/10"
                )}
                onClick={toggleRecording}
            >
                {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
            </Button>
        </div>
        
        <Textarea 
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write your thoughts..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-base p-6 text-white placeholder:text-[#8E8E93]/50 font-sans leading-relaxed resize-none selection:bg-[#0A84FF]/30"
        />

        <div className="p-4 border-t border-white/5 bg-[#1C1C1E]/50 backdrop-blur-sm">
            <Button 
                onClick={handleSave}
                disabled={!entry || isSaving}
                className={cn(
                    "w-full font-bold h-12 rounded-[16px] text-base transition-all duration-300",
                    !entry ? "bg-[#2C2C2E] text-[#8E8E93]" : "bg-[#0A84FF] text-white hover:bg-[#007AFF] shadow-lg shadow-blue-500/20"
                )}
            >
                {isSaving ? "Saving..." : "Save Entry (+50 PTS)"}
            </Button>
        </div>
      </LiquidCard>
    </MobileShell>
  );
}
