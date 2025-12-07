import { motion } from "framer-motion";

interface ProgressRingProps {
  completed: number;
  total: number;
  label?: string;
  sublabel?: string;
  color?: string;
  size?: number;
}

export function ProgressRing({ 
  completed, 
  total, 
  label = "Daily Goal", 
  sublabel,
  color = "#0A84FF", // Vibrant Blue
  size = 200 
}: ProgressRingProps) {
  const percentage = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  
  // SVG Config
  const strokeWidth = size * 0.08; // Proportional thickness
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2C2C2E"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Indicator */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-semibold text-[#8E8E93] tracking-wide uppercase mb-1">{label}</span>
        <motion.span 
            className="text-3xl font-bold text-white tracking-tight"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            {percentage}%
        </motion.span>
        {sublabel && <span className="text-xs text-[#8E8E93] mt-1">{sublabel}</span>}
      </div>
    </div>
  );
}
