
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppState, DayRecord } from '../types';
import { Battery, Trophy, BookOpen, Settings } from 'lucide-react';

interface AwarenessProps {
  state: AppState;
}

export const Awareness: React.FC<AwarenessProps> = ({ state }) => {
  // Helper: Parse diary adjustment
  const getAdjustment = (text: string) => {
    const matches = text.match(/-?\d+/g);
    return matches ? matches.reduce((acc, curr) => acc + parseInt(curr, 10), 0) : 0;
  };

  // 1. Heatmap Data (Last 30 days)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const days = [];
    // Explicitly type the Map to correctly infer DayRecord
    const historyMap = new Map<string, DayRecord>(state.history.map(h => [h.date, h]));

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = historyMap.get(dateStr);
      
      let colorClass = 'bg-transparent border border-stone-100'; // Default: No data
      
      if (record) {
        const adjustment = getAdjustment(record.diary);
        
        if (record.awakening) {
          colorClass = 'bg-red-500 border-red-500'; // Awakening
        } else if (record.finalBalance > 0) {
          colorClass = 'bg-stone-300 border-stone-300'; // Remaining
        } else {
          // Perfect Completion (Balance == 0)
          if (adjustment > 0) {
            colorClass = 'bg-emerald-700 border-emerald-700'; // Perfect + Added
          } else if (adjustment < 0) {
            colorClass = 'bg-emerald-300 border-emerald-300'; // Perfect + Removed
          } else {
            colorClass = 'bg-blue-500 border-blue-500'; // Perfect
          }
        }
      }

      days.push({ date: dateStr, colorClass, record });
    }
    return days;
  }, [state.history]);

  // 2. Most Completed Task
  const mostCompletedTask = useMemo(() => {
    const counts: Record<string, number> = {};
    state.history.forEach(day => {
      day.completedTaskTitles?.forEach(title => {
        counts[title] = (counts[title] || 0) + 1;
      });
    });

    let bestTask = null;
    let maxCount = 0;

    Object.entries(counts).forEach(([title, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestTask = title;
      }
    });

    return bestTask ? { title: bestTask, count: maxCount } : null;
  }, [state.history]);

  return (
    <div className="min-h-full flex flex-col bg-stone-50 p-6 pb-24">
      <header className="mb-8 flex items-start justify-between">
        <div>
            <h1 className="text-xl font-light text-stone-800 tracking-tight">自我觉察</h1>
            <p className="text-xs text-stone-400 mt-1">你的意志力流动轨迹</p>
        </div>
        <Link to="/settings" className="text-stone-300 hover:text-stone-500 transition-colors p-1">
            <Settings size={20} strokeWidth={1.5} />
        </Link>
      </header>

      {/* 1. Current Base Cap */}
      <section className="mb-8">
         <div className="bg-stone-800 p-6 rounded-2xl shadow-lg text-stone-50 flex items-center justify-between">
            <div className="flex flex-col">
                 <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-2">当前基础意志力上限</span>
                 <span className="text-4xl font-light tracking-tighter">{state.baseMax} <span className="text-lg text-stone-500">WP</span></span>
            </div>
            <Battery className="text-stone-500" size={40} strokeWidth={1} />
        </div>
      </section>

      {/* 2. Heatmap (Last 30 Days) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">最近 30 天</h3>
        </div>
       
        <div className="grid grid-cols-6 gap-2">
            {heatmapData.map((day) => (
                <div 
                    key={day.date} 
                    className={`aspect-square rounded-md transition-all duration-300 ${day.colorClass}`}
                    title={`${day.date}: ${day.record?.diary || '无记录'}`}
                />
            ))}
        </div>
        
        {/* Simple Legend */}
        <div className="flex flex-wrap gap-3 mt-4 text-[10px] text-stone-400">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>觉醒</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>圆满</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-700"></div>日记增益</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-300"></div>日记减益</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-stone-300"></div>剩余</div>
        </div>
      </section>

      {/* 3. Top Habit */}
      <section className="mb-10">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">最常完成</h3>
        <div className="bg-white border border-stone-100 p-4 rounded-xl flex items-center gap-4 shadow-sm">
            <div className="bg-pink-50 text-pink-500 p-3 rounded-full">
                <Trophy size={20} />
            </div>
            <div>
                {mostCompletedTask ? (
                    <>
                        <div className="text-stone-800 font-medium">{mostCompletedTask.title}</div>
                        <div className="text-xs text-stone-400">累计完成 {mostCompletedTask.count} 次</div>
                    </>
                ) : (
                    <div className="text-stone-300 text-sm italic">暂无数据</div>
                )}
            </div>
        </div>
      </section>

      {/* 4. Diary Stream */}
      <section className="flex-1">
         <div className="flex items-center gap-2 mb-4 text-stone-400">
            <BookOpen size={14} />
            <h3 className="text-xs font-bold uppercase tracking-widest">记忆回溯</h3>
         </div>
         
         <div className="space-y-6">
            {state.history.length === 0 && (
                <div className="text-stone-300 text-xs italic pl-6 border-l-2 border-stone-100 py-2">
                    完成一天后，日记将显示在这里。
                </div>
            )}
            
            {[...state.history].reverse().map((record, idx) => (
                <div key={idx} className="group relative pl-6 border-l-2 border-stone-100 hover:border-stone-300 transition-colors">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-stone-300 ring-4 ring-stone-50 group-hover:bg-stone-500 transition-colors"></div>
                    
                    <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-mono text-stone-500">{record.date}</span>
                        <div className="flex gap-2 text-[10px]">
                            {record.awakening && <span className="text-red-500 font-medium">觉醒</span>}
                            {record.finalBalance === 0 && !record.awakening && <span className="text-blue-500 font-medium">圆满</span>}
                            {record.finalBalance > 0 && <span className="text-stone-400">{record.finalBalance} WP 剩余</span>}
                        </div>
                    </div>
                    
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                        {record.diary || <span className="text-stone-300 italic">无言的一天...</span>}
                    </p>
                    
                    {record.completedTaskTitles && record.completedTaskTitles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                             {record.completedTaskTitles.slice(0, 3).map((t, i) => (
                                 <span key={i} className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                                     {t}
                                 </span>
                             ))}
                             {record.completedTaskTitles.length > 3 && (
                                 <span className="text-[10px] text-stone-300 px-1.5 py-0.5">+{record.completedTaskTitles.length - 3}</span>
                             )}
                        </div>
                    )}
                </div>
            ))}
         </div>
      </section>
    </div>
  );
};
