import React from "react";
import { cn } from "@/lib/utils";

interface LiquidCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: "cyan" | "magenta" | "blue" | "white"; // Kept for API compatibility
  children: React.ReactNode;
}

export function LiquidCard({ className, children, glowColor, ...props }: LiquidCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-white/5 backdrop-blur-2xl border border-white/10",
        "rounded-[24px] shadow-2xl shadow-black/20",
        "hover:scale-[1.01] active:scale-[0.99]",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-[24px] after:border after:border-white/10 after:pointer-events-none",
        className
      )}
      {...props}
    >
      {/* Iridescent Glow Effect */}
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-30 blur-3xl pointer-events-none" />
      
      {children}
    </div>
  );
}
