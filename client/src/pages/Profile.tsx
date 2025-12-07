import { useState } from "react";
import { useLocation } from "wouter";
import { MobileShell } from "@/components/layout/MobileShell";
import { useGame } from "@/lib/store";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { cn } from "@/lib/utils";
import { Trophy, Shield, Zap, Target, Star, LogOut, Calendar, Bell, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const RANKS = [
    { name: "Iron 1", min: 0, color: "text-gray-400", bg: "from-gray-500/20" },
    { name: "Iron 2", min: 500, color: "text-gray-400", bg: "from-gray-500/20" },
    { name: "Iron 3", min: 1000, color: "text-gray-400", bg: "from-gray-500/20" },
    { name: "Bronze 1", min: 1500, color: "text-[#cd7f32]", bg: "from-[#cd7f32]/20" },
    { name: "Bronze 2", min: 2500, color: "text-[#cd7f32]", bg: "from-[#cd7f32]/20" },
    { name: "Bronze 3", min: 3500, color: "text-[#cd7f32]", bg: "from-[#cd7f32]/20" },
    { name: "Silver 1", min: 5000, color: "text-slate-300", bg: "from-slate-300/20" },
    { name: "Silver 2", min: 6000, color: "text-slate-300", bg: "from-slate-300/20" },
    { name: "Silver 3", min: 7000, color: "text-slate-300", bg: "from-slate-300/20" },
    { name: "Gold 1", min: 8500, color: "text-yellow-400", bg: "from-yellow-400/20" },
    { name: "Gold 2", min: 10000, color: "text-yellow-400", bg: "from-yellow-400/20" },
    { name: "Gold 3", min: 11500, color: "text-yellow-400", bg: "from-yellow-400/20" },
    { name: "Platinum 1", min: 13500, color: "text-cyan-400", bg: "from-cyan-400/20" },
    { name: "Platinum 2", min: 15500, color: "text-cyan-400", bg: "from-cyan-400/20" },
    { name: "Platinum 3", min: 17500, color: "text-cyan-400", bg: "from-cyan-400/20" },
    { name: "Diamond 1", min: 20000, color: "text-purple-400", bg: "from-purple-400/20" },
    { name: "Diamond 2", min: 23000, color: "text-purple-400", bg: "from-purple-400/20" },
    { name: "Diamond 3", min: 26000, color: "text-purple-400", bg: "from-purple-400/20" },
    { name: "Ascendant 1", min: 30000, color: "text-emerald-400", bg: "from-emerald-400/20" },
    { name: "Ascendant 2", min: 35000, color: "text-emerald-400", bg: "from-emerald-400/20" },
    { name: "Ascendant 3", min: 40000, color: "text-emerald-400", bg: "from-emerald-400/20" },
    { name: "Immortal 1", min: 50000, color: "text-red-500", bg: "from-red-500/20" },
    { name: "Immortal 2", min: 60000, color: "text-red-500", bg: "from-red-500/20" },
    { name: "Immortal 3", min: 70000, color: "text-red-500", bg: "from-red-500/20" },
    { name: "Radiant", min: 80000, color: "text-yellow-100", bg: "from-yellow-100/20" },
];

export default function Profile() {
  const { lifetimeXP, rank, nextRankXP, logout, user } = useGame();
  const [, setLocation] = useLocation();
  
  const currentRankIdx = RANKS.findIndex(r => r.name === rank);
  const progress = nextRankXP === Infinity 
      ? 100 
      : Math.min(100, (lifetimeXP / nextRankXP) * 100);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <MobileShell>
      <div className="flex justify-between items-center mb-6 pt-2 px-1">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Agent Profile</h2>
            <p className="text-[#8E8E93] text-sm">{user?.email || "Guest Agent"}</p>
        </div>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
        >
            <LogOut size={16} className="mr-2" />
            Logout
        </Button>
      </div>

      {/* Main Rank Card */}
      <LiquidCard className="mb-6 flex flex-col items-center justify-center py-10 relative overflow-hidden">
        <div className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-20 pointer-events-none",
            RANKS[currentRankIdx]?.bg || "from-gray-500/20"
        )} />
        
        <div className="relative z-10 flex flex-col items-center">
            {/* Rank Icon Placeholder (CSS based) */}
            <div className={cn(
                "w-32 h-32 rounded-full border-4 flex items-center justify-center mb-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                RANKS[currentRankIdx]?.color.replace('text-', 'border-') || "border-gray-400"
            )}>
                <Trophy size={64} className={RANKS[currentRankIdx]?.color} />
            </div>
            
            <h1 className={cn(
                "text-4xl font-black uppercase tracking-widest mb-2 drop-shadow-lg",
                RANKS[currentRankIdx]?.color
            )}>
                {rank}
            </h1>
            
            <div className="text-[#8E8E93] font-mono text-sm mb-6">
                LIFETIME XP: <span className="text-white font-bold">{lifetimeXP.toLocaleString()}</span>
            </div>

            {/* XP Bar */}
            <div className="w-full max-w-[200px] space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-[#8E8E93]">
                    <span>Current</span>
                    <span>Next Rank</span>
                </div>
                <div className="h-2 bg-[#2C2C2E] rounded-full overflow-hidden border border-white/5">
                    <div 
                        className={cn("h-full transition-all duration-500", RANKS[currentRankIdx]?.color.replace('text-', 'bg-'))} 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-center text-[10px] text-[#8E8E93]">
                    {nextRankXP === Infinity ? "MAX RANK" : `${(nextRankXP - lifetimeXP).toLocaleString()} XP to go`}
                </div>
            </div>
        </div>
      </LiquidCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1C1C1E] rounded-[20px] p-4 border border-white/10 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Target size={20} />
            </div>
            <div className="text-2xl font-bold text-white">85%</div>
            <div className="text-[10px] font-bold text-[#8E8E93] uppercase">Task Completion</div>
        </div>
        <div className="bg-[#1C1C1E] rounded-[20px] p-4 border border-white/10 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Zap size={20} />
            </div>
            <div className="text-2xl font-bold text-white">12</div>
            <div className="text-[10px] font-bold text-[#8E8E93] uppercase">Day Streak</div>
        </div>
      </div>

      {/* Integrations & Settings */}
      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-bold text-[#8E8E93] uppercase pl-2">Integrations & Settings</h3>
        
        {/* Google Calendar */}
        <div className="bg-[#1C1C1E] rounded-[20px] p-4 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Calendar size={20} />
                </div>
                <div>
                    <div className="font-bold text-white text-sm">Google Calendar</div>
                    <div className="text-[10px] text-[#8E8E93]">Sync tasks & habits</div>
                </div>
            </div>
            <Switch />
        </div>

        {/* Task Notifications */}
        <div className="bg-[#1C1C1E] rounded-[20px] p-4 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <Bell size={20} />
                </div>
                <div>
                    <div className="font-bold text-white text-sm">Task Reminders</div>
                    <div className="text-[10px] text-[#8E8E93]">Notify for incomplete tasks</div>
                </div>
            </div>
            <Switch defaultChecked />
        </div>
      </div>

      {/* Rank Progression */}
      <div className="space-y-2 mb-8">
        <h3 className="text-sm font-bold text-[#8E8E93] uppercase pl-2 mb-4">Rank Progression</h3>
        {RANKS.map((r, i) => (
            <div key={r.name} className={cn(
                "flex items-center gap-4 p-3 rounded-[16px] border transition-all",
                r.name === rank 
                    ? "bg-[#2C2C2E] border-white/20" 
                    : "bg-transparent border-transparent opacity-50"
            )}>
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border",
                    r.name === rank ? r.color.replace('text-', 'border-') : "border-white/10 bg-white/5"
                )}>
                    {i < currentRankIdx ? <Shield size={16} className={r.color} /> : <Star size={16} className={r.name === rank ? r.color : "text-white/20"} />}
                </div>
                <div className="flex-1">
                    <div className={cn("font-bold text-sm", r.name === rank ? "text-white" : "text-[#8E8E93]")}>{r.name}</div>
                    <div className="text-[10px] text-[#8E8E93]">{r.min.toLocaleString()} XP</div>
                </div>
                {i < currentRankIdx && <div className="text-[#30D158] text-[10px] font-bold">UNLOCKED</div>}
                {i === currentRankIdx && <div className="text-blue-500 text-[10px] font-bold">CURRENT</div>}
            </div>
        ))}
      </div>
    </MobileShell>
  );
}
