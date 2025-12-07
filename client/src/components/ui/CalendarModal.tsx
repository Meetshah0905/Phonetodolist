import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function CalendarModal({ open, onOpenChange, selectedDate, onSelectDate }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Calculate padding for start of month
  const startDay = startOfMonth(currentMonth).getDay();
  const paddingDays = Array(startDay).fill(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1C1C1E] border-none text-white max-w-[350px] rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between mb-6 space-y-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
            className="text-white hover:bg-white/10 rounded-full w-8 h-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <DialogTitle className="text-xl font-bold font-display tracking-wide">
            {format(currentMonth, "MMMM yyyy")}
          </DialogTitle>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
            className="text-white hover:bg-white/10 rounded-full w-8 h-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-gray-500 text-xs font-bold uppercase py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {paddingDays.map((_, i) => (
            <div key={`padding-${i}`} />
          ))}
          
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  onSelectDate(day);
                  onOpenChange(false);
                }}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative",
                  isSelected 
                    ? "bg-white text-black font-bold shadow-lg scale-110 z-10" 
                    : "text-white hover:bg-white/10",
                  !isSelected && isCurrentDay && "text-neon-cyan font-bold"
                )}
              >
                {format(day, "d")}
                {!isSelected && isCurrentDay && (
                  <div className="absolute bottom-1.5 w-1 h-1 bg-neon-cyan rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
            <Button variant="ghost" className="text-xs text-gray-400 hover:text-white" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="ghost" className="text-xs text-neon-cyan hover:text-white" onClick={() => {
                onSelectDate(new Date());
                onOpenChange(false);
            }}>Today</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
