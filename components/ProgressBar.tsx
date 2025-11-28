import React, { useMemo } from 'react';

interface ProgressBarProps {
  total: number;
  current: number;
  phase: 'PLANNING' | 'EXECUTION';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ total, current, phase }) => {
  // Ensure we don't divide by zero and clamp values
  const safeTotal = Math.max(1, total);
  
  // In planning, we show how much is allocated (current) vs total
  // In execution, we show how much is remaining (current) vs total
  // Actually, the prompt implies "Willpower Pool" behavior.
  
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (current / safeTotal) * 100));
  }, [current, safeTotal]);

  const isOverdraft = current < 0;

  return (
    <div className="w-full space-y-2 sticky top-0 bg-white/95 backdrop-blur py-4 z-20 border-b border-stone-100 px-6">
      <div className="flex justify-between items-end">
        <span className="text-xs font-medium text-stone-500 tracking-wider">
          {phase === 'PLANNING' ? '规划中' : '执行中'}
        </span>
        <div className="text-right">
          <span className={`text-2xl font-light tabular-nums tracking-tight ${isOverdraft ? 'text-red-500' : 'text-stone-800'}`}>
            {current}
          </span>
          <span className="text-xs text-stone-400 ml-1">/ {total} WP</span>
        </div>
      </div>
      
      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden relative">
        <div 
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            isOverdraft ? 'bg-red-400' : 'bg-stone-800'
          }`}
          style={{ width: `${isOverdraft ? 100 : percentage}%` }}
        />
        {/* Helper line for max capacity in case of overdraft visual */}
      </div>
    </div>
  );
};