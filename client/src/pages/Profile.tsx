import { MobileShell } from "@/components/layout/MobileShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/store";
import { Settings, User, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { user, rank, lifetimeXP, isGoogleCalendarConnected, connectGoogleCalendar, disconnectGoogleCalendar } = useGame();

  return (
    <MobileShell>
      <div className="flex flex-col items-center mb-8 pt-8">
        <Avatar className="w-24 h-24 mb-4 border-4 border-[#1C1C1E] shadow-2xl">
          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || "Meet"}`} />
          <AvatarFallback className="bg-[#2C2C2E] text-white text-2xl">MS</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold text-white mb-1">{user?.name || "Meet Shah"}</h1>
        <div className="flex items-center gap-2">
            <span className="text-[#0A84FF] font-bold text-sm bg-[#0A84FF]/10 px-3 py-1 rounded-full border border-[#0A84FF]/20">{rank}</span>
            <span className="text-[#8E8E93] text-sm font-medium">{lifetimeXP} XP</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
            <h3 className="text-[#8E8E93] text-xs font-bold uppercase tracking-wider ml-1">Account</h3>
            
            <div className="bg-[#1C1C1E] rounded-[20px] p-4 border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-white"><User size={20} /></div>
                    <div className="flex-1">
                        <Label className="text-xs text-[#8E8E93]">Name</Label>
                        <Input value={user?.name || "Meet Shah"} readOnly className="bg-transparent border-none p-0 h-auto text-white font-medium focus-visible:ring-0" />
                    </div>
                </div>
                <Separator className="bg-white/5" />
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-white"><Mail size={20} /></div>
                    <div className="flex-1">
                        <Label className="text-xs text-[#8E8E93]">Email</Label>
                        {/* Hidden/Fake Email for UI aesthetics */}
                        <div className="text-white font-medium">meet@phonetodolist.com</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-[#8E8E93] text-xs font-bold uppercase tracking-wider ml-1">Integrations</h3>
            <div className="bg-[#1C1C1E] rounded-[20px] p-4 border border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EA4335]/20 flex items-center justify-center text-[#EA4335]"><Calendar size={20} /></div>
                        <div>
                            <div className="text-white font-medium">Google Calendar</div>
                            <div className="text-xs text-[#8E8E93]">{isGoogleCalendarConnected ? "Connected" : "Not connected"}</div>
                        </div>
                    </div>
                    <Switch checked={isGoogleCalendarConnected} onCheckedChange={(c) => c ? connectGoogleCalendar() : disconnectGoogleCalendar()} />
                </div>
            </div>
        </div>
      </div>
    </MobileShell>
  );
}