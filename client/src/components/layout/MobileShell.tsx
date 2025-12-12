import React from "react";
import { Link, useLocation } from "wouter";
import { Home, CheckSquare, BookOpen, PenTool, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { rank, lifetimeXP, levelUp, dismissLevelUp, user, nextRankXP } = useGame();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: CheckSquare, label: "Habits", path: "/habits" },
    { icon: BookOpen, label: "Library", path: "/library" },
    { icon: PenTool, label: "Journal", path: "/journal" },
    { icon: ShoppingBag, label: "Shop", path: "/shop" },
  ];

  return (
    <div className="min-h-screen bg-black text-foreground font-sans relative flex flex-col">
      {/* Level Up Modal */}
      <Dialog open={levelUp.show} onOpenChange={(open) => !open && dismissLevelUp()}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border-none text-white flex flex-col items-center justify-center h-full max-w-none w-full border-0">
            <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-4xl font-black italic uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">Rank Up!</h2>
                <p className="text-xl font-bold text-white mb-8">You are now {levelUp.newRank}</p>
                <Button onClick={dismissLevelUp} className="bg-white text-black font-bold rounded-full px-8 py-6 text-lg hover:bg-white/90">
                    Continue Grinding
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Header with Rank Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/5 pt-safe-top">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Link href="/profile">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold border border-white/20 cursor-pointer">
                        {rank[0]}
                    </div>
                </Link>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{user?.name || "Agent"}</span>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[#0A84FF] border border-white/5">
                            {rank}
                        </span>
                    </div>
                    {/* Tiny XP Bar in Header */}
                    <div className="w-24 h-1 bg-[#2C2C2E] rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#0A84FF] transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((lifetimeXP / (nextRankXP || 1)) * 100))}%` }}
                        />
                    </div>
                </div>
            </div>
            
            <Link href="/profile">
                <Button variant="ghost" size="icon" className="text-[#8E8E93] hover:text-white">
                    <User size={20} />
                </Button>
            </Link>
        </div>
      </header>

      {/* Content Layer */}
      <main className="flex-1 relative z-10 overflow-y-auto pb-24 pt-16 scrollbar-hide">
        <div className="max-w-md mx-auto min-h-full px-4 pt-4">
            {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav pb-safe">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div className="relative cursor-pointer w-12 h-12 flex flex-col items-center justify-center gap-1 group">
                  <Icon 
                    strokeWidth={2} 
                    size={24} 
                    className={cn(
                        "transition-all duration-300", 
                        isActive ? "text-[#0A84FF]" : "text-[#8E8E93] group-hover:text-white"
                    )}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
