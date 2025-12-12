import { useState, useEffect, useRef } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { useGame } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mic, StopCircle, ExternalLink, Check, Bell, Calendar, Volume2, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, subDays, isSameDay } from "date-fns";

export default function Journal() {
  const { saveJournalEntry, journalEntries, user, isGoogleCalendarConnected } = useGame();
  const [entry, setEntry] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("23:11");
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [backendEntries, setBackendEntries] = useState<Array<{id: string; text: string; date: string; hasAudio: boolean}>>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Load reminder settings from backend
  useEffect(() => {
    if (user?.id) {
      fetch(`http://localhost:4000/api/journal/reminder?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.settings) {
            setReminderEnabled(data.settings.enabled);
            setReminderTime(data.settings.time);
            setSyncToCalendar(data.settings.syncToCalendar);
          }
        })
        .catch(err => console.error("Failed to load reminder settings", err));
      
      // Load journal entries
      fetch(`http://localhost:4000/api/journal/entries?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.entries) {
            setBackendEntries(data.entries);
          }
        })
        .catch(err => console.error("Failed to load journal entries", err));
    }
  }, [user?.id]);

  // Schedule daily notification
  useEffect(() => {
    if (!reminderEnabled || notificationPermission !== "granted") return;

    const scheduleNotification = () => {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const timeUntilNotification = scheduledTime.getTime() - now.getTime();

      const timeoutId = setTimeout(() => {
        new Notification("📔 Journal Reminder", {
          body: "Time for your daily reflection and journaling",
          icon: "/icon.png",
          badge: "/badge.png",
        });
        scheduleNotification(); // Reschedule for next day
      }, timeUntilNotification);

      return () => clearTimeout(timeoutId);
    };

    return scheduleNotification();
  }, [reminderEnabled, reminderTime, notificationPermission]);

  const handleReminderUpdate = async () => {
    if (!user?.id) return;

    try {
      await fetch("http://localhost:4000/api/journal/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          enabled: reminderEnabled,
          time: reminderTime,
          syncToCalendar,
        }),
      });

      toast({ 
        title: "Reminder Updated", 
        description: `Daily reminder ${reminderEnabled ? 'enabled' : 'disabled'} at ${reminderTime}${syncToCalendar ? ' (synced to Google Calendar)' : ''}`,
      });
    } catch (error) {
      toast({ 
        title: "Update Failed", 
        description: "Could not save reminder settings", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user?.id) return;
    if (!confirm("Are you sure you want to delete this journal entry?")) return;

    try {
      await fetch(`http://localhost:4000/api/journal/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, entryId }),
      });

      setBackendEntries(prev => prev.filter(e => e.id !== entryId));
      toast({ 
        title: "Entry Deleted", 
        description: "Journal entry has been removed",
        variant: "destructive"
      });
    } catch (error) {
      toast({ 
        title: "Delete Failed", 
        description: "Could not delete entry", 
        variant: "destructive" 
      });
    }
  };

  const handleEditEntry = async (entryId: string) => {
    if (!user?.id || !editText) return;

    try {
      await fetch(`http://localhost:4000/api/journal/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, entryId, text: editText }),
      });

      setBackendEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, text: editText } : e
      ));
      setEditingEntryId(null);
      setEditText("");
      toast({ 
        title: "Entry Updated", 
        description: "Changes saved successfully" 
      });
    } catch (error) {
      toast({ 
        title: "Update Failed", 
        description: "Could not update entry", 
        variant: "destructive" 
      });
    }
  };

  const startEditingEntry = (entry: any) => {
    setEditingEntryId(entry.id);
    setEditText(entry.text);
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditText("");
  };

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
    // Allow save if there's either text (min 5 chars) OR audio recorded
    const hasAudio = audioChunksRef.current.length > 0;
    if (entry.length < 5 && !hasAudio) {
      toast({
        title: "Cannot Save",
        description: "Write at least 5 characters or record audio",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      let audioBase64: string | undefined;
      
      // Convert audio blob to base64 if exists
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(audioBlob);
        });
      }

      // Save to backend with audio
      if (user?.id) {
        await fetch("http://localhost:4000/api/journal/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            text: entry || "[Audio Note]", // Default text if only audio
            audioBase64,
          }),
        });
      }

      await saveJournalEntry(entry || "[Audio Note]");
      
      toast({ 
        title: "Reflection Saved", 
        description: "+50 pts added to balance" + (audioBase64 ? " (with audio)" : ""),
        className: "bg-[#1C1C1E] text-white border border-white/10" 
      });
      
      setEntry("");
      audioChunksRef.current = [];
      
      // Reload entries from backend
      if (user?.id) {
        fetch(`http://localhost:4000/api/journal/entries?userId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.entries) {
              setBackendEntries(data.entries);
            }
          })
          .catch(err => console.error("Failed to reload entries", err));
      }
    } catch (error) {
      toast({ 
        title: "Save Failed", 
        description: "Could not save journal entry", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast({ title: "Recording...", description: "Microphone active" });
      } catch (error) {
        toast({ 
          title: "Recording Failed", 
          description: "Could not access microphone", 
          variant: "destructive" 
        });
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast({ 
          title: "Recording Stopped", 
          description: "Audio will be saved with your entry" 
        });
      }
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
      <div className="bg-[#1C1C1E] border border-white/10 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF]">
              <Bell size={16} />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Daily Reminder</div>
              <div className="text-xs text-[#8E8E93]">
                {notificationPermission === "granted" 
                  ? `Notification at ${reminderTime}` 
                  : "Enable notifications"}
              </div>
            </div>
          </div>
          <Switch 
            checked={reminderEnabled} 
            onCheckedChange={(checked) => {
              setReminderEnabled(checked);
              if (notificationPermission !== "granted" && checked) {
                Notification.requestPermission().then(permission => {
                  setNotificationPermission(permission);
                  if (permission !== "granted") {
                    toast({ 
                      title: "Notifications Blocked", 
                      description: "Please enable notifications in your browser settings", 
                      variant: "destructive" 
                    });
                    setReminderEnabled(false);
                  }
                });
              }
            }}
          />
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <input 
            type="time" 
            value={reminderTime} 
            onChange={(e) => setReminderTime(e.target.value)} 
            className="bg-[#2C2C2E] border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex-1"
          />
          <Button 
            size="sm" 
            className="bg-[#0A84FF] text-white hover:bg-[#007AFF] text-xs rounded-lg px-4"
            onClick={() => {
              setReminderTime("23:11");
              handleReminderUpdate();
            }}
          >
            Set 11:11 PM
          </Button>
        </div>

        {isGoogleCalendarConnected && (
          <div className="flex items-center justify-between py-2 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#EA4335]" />
              <span className="text-xs text-white">Sync to Google Calendar</span>
            </div>
            <Switch 
              checked={syncToCalendar} 
              onCheckedChange={setSyncToCalendar}
              className="data-[state=checked]:bg-[#EA4335]"
            />
          </div>
        )}

        <Button
          onClick={handleReminderUpdate}
          size="sm"
          className="w-full mt-3 bg-[#2C2C2E] text-white hover:bg-[#3C3C3E] text-xs rounded-lg"
        >
          Save Reminder Settings
        </Button>
      </div>

      {/* Streak Calendar - iPhone Style */}
      <div className="bg-[#1C1C1E] border border-white/10 rounded-3xl p-5 mb-6 flex justify-between items-center shadow-lg shadow-black/20">
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
                disabled={isSaving}
                className={cn(
                    "w-full font-bold h-12 rounded-2xl text-base transition-all duration-300",
                    isSaving ? "bg-[#2C2C2E] text-[#8E8E93]" : "bg-[#0A84FF] text-white hover:bg-[#007AFF] shadow-lg shadow-blue-500/20"
                )}
            >
                {isSaving ? "Saving..." : `Save Entry (+50 PTS)${audioChunksRef.current.length > 0 ? " 🎤" : ""}`}
            </Button>
        </div>
      </LiquidCard>

      {/* Previous Journal Entries */}
      {backendEntries.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-bold text-white px-1">Previous Entries</h3>
          {backendEntries.slice().reverse().map((entry) => (
            <div key={entry.id} className="bg-[#1C1C1E] border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-[#8E8E93] font-semibold">
                  {format(new Date(entry.date), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <div className="flex items-center gap-2">
                  {entry.hasAudio && (
                    <div className="flex items-center gap-1 text-[#0A84FF] text-xs">
                      <Volume2 size={12} />
                      <span>Audio</span>
                    </div>
                  )}
                  {editingEntryId !== entry.id && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-[#8E8E93] hover:text-[#0A84FF] hover:bg-white/5"
                        onClick={() => startEditingEntry(entry)}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-[#8E8E93] hover:text-[#FF453A] hover:bg-white/5"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {editingEntryId === entry.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-[#2C2C2E] border-white/10 text-white text-sm min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditEntry(entry.id)}
                      className="flex-1 bg-[#0A84FF] text-white hover:bg-[#007AFF] text-xs"
                    >
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditing}
                      className="flex-1 bg-transparent border-white/10 text-white hover:bg-white/5 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-white text-sm leading-relaxed mb-3">{entry.text}</p>
              )}
              
              {entry.hasAudio && user?.id && (
                <audio 
                  controls 
                  className="w-full h-10 mt-3"
                  src={`http://localhost:4000/api/journal/audio/${user.id}/${entry.id}`}
                  style={{
                    filter: 'invert(1) hue-rotate(180deg)',
                    borderRadius: '8px',
                  }}
                >
                  Your browser does not support audio playback.
                </audio>
              )}
            </div>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
