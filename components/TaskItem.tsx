
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Trash2, StickyNote, RotateCcw } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  phase: 'PLANNING' | 'EXECUTION';
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSwipeAction?: (task: Task) => void; // Used for "Move to Backlog"
}

export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  phase, 
  onToggle, 
  onRemove,
  onSwipeAction 
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const SWIPE_THRESHOLD = -80; // Distance to trigger action
  
  // Theme based on type
  const isScheduled = task.type === 'scheduled';
  
  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (phase !== 'PLANNING') return; // Only allow swipe in planning
    if (!onSwipeAction || !isScheduled) return; // Only scheduled tasks can be swiped to backlog
    startX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current || startX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Only allow swiping left
    if (diff < 0) {
      setOffsetX(Math.max(diff, -150)); // Clamp max swipe
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    
    if (offsetX < SWIPE_THRESHOLD && onSwipeAction) {
      // Triggered
      onSwipeAction(task);
    } 
    
    // Reset
    setOffsetX(0);
    startX.current = null;
    isSwiping.current = false;
  };

  // Mouse fallback for testing on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (phase !== 'PLANNING' || !onSwipeAction || !isScheduled) return;
    startX.current = e.clientX;
    isSwiping.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping.current || startX.current === null) return;
    const currentX = e.clientX;
    const diff = currentX - startX.current;
    if (diff < 0) {
      setOffsetX(Math.max(diff, -150));
    }
  };

  const handleMouseUp = () => {
      handleTouchEnd();
  };
  
  const handleMouseLeave = () => {
     if(isSwiping.current) handleTouchEnd();
  }

  // Visuals
  const borderColor = isScheduled ? 'border-yellow-200' : 'border-stone-100';
  const bgColor = isScheduled ? (task.completed ? 'bg-yellow-50/50' : 'bg-yellow-50') : (task.completed ? 'bg-stone-100' : 'bg-white');
  const textColor = task.completed ? 'text-stone-400' : 'text-stone-700';

  return (
    <div className="relative overflow-hidden mb-3 rounded-lg">
        {/* Background Action Layer */}
        <div className="absolute inset-0 bg-stone-200 flex items-center justify-end pr-6 rounded-lg">
             <div className="flex items-center gap-2 text-stone-500 font-medium text-xs">
                <RotateCcw size={16} />
                <span>推迟</span>
             </div>
        </div>

        {/* Foreground Task Layer */}
        <div 
            className={`relative flex items-center justify-between p-3 rounded-lg border transition-transform duration-200 ${borderColor} ${bgColor} shadow-sm`}
            style={{ transform: `translateX(${offsetX}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            <div 
                className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden"
                onClick={() => {
                    if (phase === 'EXECUTION') {
                        onToggle(task.id);
                    }
                }}
            >
                {phase === 'EXECUTION' && (
                    <div className={`transition-colors shrink-0 ${task.completed ? 'text-stone-400' : (isScheduled ? 'text-yellow-400' : 'text-stone-200')}`}>
                        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                )}
                
                <div className="flex flex-col overflow-hidden">
                    <span className={`text-sm font-medium truncate ${task.completed ? 'line-through decoration-stone-300' : textColor}`}>
                        {task.title}
                    </span>
                    {task.note && (
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-0.5">
                            <StickyNote size={10} />
                            <span className="truncate">{task.note}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className={`text-xs font-mono px-2 py-1 rounded ${isScheduled ? 'bg-white/50 text-yellow-600' : 'bg-stone-50 text-stone-400'}`}>
                    {task.cost}
                </span>
                
                {/* Trash is only available in Planning, unless it's a scheduled task which uses swipe to remove */}
                {(!isScheduled || phase === 'PLANNING') && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(task.id);
                        }}
                        className="text-stone-200 hover:text-red-400 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};
