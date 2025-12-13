import { useEffect, useState } from "react";

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
  const [animatedOffset, setAnimatedOffset] = useState(0);
  const [opacity, setOpacity] = useState(0);
  
  // SVG Config
  const strokeWidth = size * 0.08; // Proportional thickness
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    // Animate stroke dashoffset
    const startOffset = circumference;
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedOffset(startOffset - (startOffset - targetOffset) * easeOut);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedOffset(targetOffset);
      }
    };
    
    animate();
    
    // Animate opacity
    setOpacity(0);
    setTimeout(() => setOpacity(1), 100);
  }, [percentage, circumference, targetOffset]);

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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-semibold text-[#8E8E93] tracking-wide uppercase mb-1">{label}</span>
        <span 
            className="text-3xl font-bold text-white tracking-tight transition-opacity duration-300"
            style={{ opacity }}
        >
            {percentage}%
        </span>
        {sublabel && <span className="text-xs text-[#8E8E93] mt-1">{sublabel}</span>}
      </div>
    </div>
  );
}
