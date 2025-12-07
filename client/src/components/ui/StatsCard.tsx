import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LiquidCard } from "@/components/ui/LiquidCard";

const data = [
  { name: "Mon", tasks: 4 },
  { name: "Tue", tasks: 6 },
  { name: "Wed", tasks: 2 },
  { name: "Thu", tasks: 5 },
  { name: "Fri", tasks: 8 },
  { name: "Sat", tasks: 3 },
  { name: "Sun", tasks: 1, active: true },
];

export function StatsCard() {
  return (
    <LiquidCard className="h-64 flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-gray-400 text-sm font-medium">Last 7 Days</h3>
        <div className="text-3xl font-display font-bold text-white mt-1">1</div>
      </div>
      
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }} 
              dy={10}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                backgroundColor: '#18181B', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.active ? '#3B82F6' : 'rgba(255,255,255,0.1)'} 
                  height={entry.active ? 4 : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </LiquidCard>
  );
}
