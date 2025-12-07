import { useGame } from "@/lib/store";
import { motion } from "framer-motion";

export function GlowingBalance() {
  const { points } = useGame();

  return (
    <div className="relative z-50">
      <motion.div
        key={points}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-[#1C1C1E] pl-4 pr-1 py-1 rounded-full border border-white/10 flex items-center gap-3 shadow-lg shadow-blue-500/5 group hover:border-[#0A84FF]/30 transition-colors"
      >
        <div className="flex flex-col items-end leading-none">
            <span className="font-sans font-bold text-lg text-white tabular-nums tracking-tight">
            {points.toLocaleString()}
            </span>
        </div>
        <div className="bg-[#2C2C2E] h-8 px-2.5 rounded-full flex items-center justify-center border border-white/5">
             <span className="font-sans text-[10px] text-[#0A84FF] font-bold uppercase tracking-wider">PTS</span>
        </div>
      </motion.div>
    </div>
  );
}
