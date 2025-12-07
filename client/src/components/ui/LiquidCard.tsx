import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface LiquidCardProps extends HTMLMotionProps<"div"> {
  glowColor?: "cyan" | "magenta" | "blue" | "white"; // Kept for API compatibility
  children: React.ReactNode;
}

export function LiquidCard({ className, children, glowColor, ...props }: LiquidCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.01, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-white/5 backdrop-blur-2xl border border-white/10",
        "rounded-[24px] shadow-2xl shadow-black/20",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none",
        "after:absolute after:inset-0 after:rounded-[24px] after:border after:border-white/10 after:pointer-events-none",
        className
      )}
      {...props}
    >
      {/* Iridescent Glow Effect */}
      <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-30 blur-3xl pointer-events-none" />
      
      {children}
    </motion.div>
  );
}
