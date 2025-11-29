
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, ArrowRight, Sunrise, CalendarClock } from 'lucide-react';
import { AppState, Task, DayRecord, ScheduledTask } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { TaskItem } from '../components/TaskItem';

interface HomeProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const Home: React.FC<HomeProps> = ({ state, updateState }) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Logic: Auto-Inject Scheduled Tasks ---
  useEffect(() => {
    // Only run if in Planning phase to avoid disrupting Execution
    if (state.phase !== 'PLANNING') return;

    const todayDay = new Date().getDay(); // 0-6
    const tasksToAdd: Task[] = [];

    state.scheduledTasks.forEach(plan => {
      // 1. Check Specific Days
      if (plan.config.mode === 'specific_days' && plan.config.days?.includes(todayDay)) {
        // Check if already exists in todayTasks (by sourceId) or was recently completed?
        // Simple check: is it in todayTasks?
        const exists = state.todayTasks.some(t => t.sourceId === plan.id);
        
        if (!exists) {
          tasksToAdd.push({
            id: uuidv4(),
            title: plan.title,
            cost: plan.cost,
            completed: false,
            type: 'scheduled',
            note: plan.note,
            sourceId: plan.id
          });
        }
      }
    });

    if (tasksToAdd.length > 0) {
      updateState({
        todayTasks: [...state.todayTasks, ...tasksToAdd]
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.scheduledTasks, state.phase]); // Dependency on phase ensures checks happen on new day reset

  // --- Logic: Diary Parsing ---
  const handleDiaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const matches = text.match(/-?\d+/g);
    const adjustment = matches ? matches.reduce((acc, curr) => acc + parseInt(curr, 10), 0) : 0;

    updateState({
      diaryContent: text,
      diaryAdjustment: adjustment
    });
  };

  // --- Logic: Calculations ---
  const todayPoolMax = state.baseMax + state.diaryAdjustment;
  const allocatedCost = state.todayTasks.reduce((acc, t) => acc + t.cost, 0);
  const completedCost = state.todayTasks.filter(t => t.completed).reduce((acc, t) => acc + t.cost, 0);

  const displayRemaining = state.phase === 'PLANNING' 
    ? todayPoolMax - allocatedCost 
    : todayPoolMax - completedCost;

  // --- Logic: Task Management ---
  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const match = inputValue.match(/^(.*?)(\d+)$/);
      let title = inputValue;
      let cost = 5;

      if (match) {
        title = match[1].trim();
        cost = parseInt(match[2], 10);
      } else {
        const parts = inputValue.split(' ');
        const lastPart = parts[parts.length - 1];
        const maybeCost = parseInt(lastPart);
        if (!isNaN(maybeCost)) {
            cost = maybeCost;
            title = parts.slice(0, -1).join(' ').trim();
        }
      }
      
      if (!title) return;

      const newTask: Task = {
        id: uuidv4(),
        title,
        cost,
        completed: false,
        type: 'normal'
      };

      updateState({
        todayTasks: [...state.todayTasks, newTask]
      });
      setInputValue('');
      
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const toggleTask = (id: string) => {
    updateState({
      todayTasks: state.todayTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    });
  };

  const removeTask = (id: string) => {
    updateState({
      todayTasks: state.todayTasks.filter(t => t.id !== id)
    });
  };

  const fillRemaining = () => {
    if (displayRemaining <= 0) return;
    const filler: Task = {
      id: uuidv4(),
      title: '自由探索 / 休息',
      cost: displayRemaining,
      completed: false,
      type: 'filler'
    };
    updateState({
      todayTasks: [...state.todayTasks, filler]
    });
  };

  // --- Logic: Swipe Action (Defer Plan) ---
  const handleSwipeAction = (task: Task) => {
    // 1. Remove from today
    const newToday = state.todayTasks.filter(t => t.id !== task.id);
    
    // 2. Add to backlog with context
    const todayStr = new Date().toISOString().split('T')[0];
    const backlogItem: Task = {
      ...task,
      id: uuidv4(),
      title: `(推迟) ${task.title} - ${todayStr.slice(5)}`, // e.g. (推迟) Gym - 11-28
      type: 'backlog',
      completed: false
    };

    updateState({
      todayTasks: newToday,
      backlog: [...state.backlog, backlogItem]
    });
  };

  // --- Logic: Library Interaction ---
  const copyFromLibrary = (template: Task) => {
    const newTask: Task = {
      ...template,
      id: uuidv4(),
      completed: false,
      type: 'normal'
    };
    updateState({
      todayTasks: [...state.todayTasks, newTask]
    });
  };

  const addScheduledTask = (plan: ScheduledTask) => {
     // Manually add a frequency task
     const newTask: Task = {
         id: uuidv4(),
         title: plan.title,
         cost: plan.cost,
         completed: false,
         type: 'scheduled',
         note: plan.note,
         sourceId: plan.id
     };
     updateState({
         todayTasks: [...state.todayTasks, newTask]
     });
  };

  const moveFromBacklog = (backlogTask: Task) => {
    const newTask: Task = {
      ...backlogTask,
      type: 'normal'
    };
    updateState({
      backlog: state.backlog.filter(t => t.id !== backlogTask.id),
      todayTasks: [...state.todayTasks, newTask]
    });
  };

  const startExecution = () => {
    updateState({ phase: 'EXECUTION' });
  };

  const handleNewDay = () => {
    const finalBalance = todayPoolMax - completedCost;
    const isAwakening = finalBalance < 0;
    
    const completedTitles = state.todayTasks
        .filter(t => t.completed && t.type !== 'filler')
        .map(t => t.title);

    let newBaseMax = state.baseMax;
    if (finalBalance > 0) {
      newBaseMax = Math.max(40, state.baseMax - 10);
    }
    
    const record: DayRecord = {
      date: state.lastActiveDate,
      diary: state.diaryContent,
      baseMax: state.baseMax,
      finalBalance,
      awakening: isAwakening,
      tasksCompleted: state.todayTasks.filter(t => t.completed).length,
      totalCostConsumed: completedCost,
      completedTaskTitles: completedTitles
    };

    const incompleteTasks = state.todayTasks
      .filter(t => !t.completed && t.type !== 'filler' && t.type !== 'scheduled') // Don't move skipped scheduled tasks to backlog automatically, they just disappear or user swiped them
      .map(t => ({ ...t, type: 'backlog' as const }));

    // Note: Scheduled tasks that were NOT completed just vanish from "Today", 
    // waiting for their next schedule or manual add, unless the user swiped them to backlog manually.

    const nextBacklog = [...state.backlog, ...incompleteTasks];
    const todayStr = new Date().toISOString().split('T')[0];
    
    updateState({
      baseMax: newBaseMax,
      lastActiveDate: todayStr,
      diaryContent: '',
      diaryAdjustment: 0,
      todayTasks: [],
      backlog: nextBacklog,
      phase: 'PLANNING',
      history: [...state.history, record]
    });

    alert(isAwakening ? "觉醒时刻！你的意志力超越了极限。" : "新的一天开始了。");
  };

  // --- Helper: Count frequency completions ---
  const getFrequencyStats = (planId: string, mode: 'weekly' | 'monthly') => {
      // Calculate how many times tasks with sourceId === planId were completed in current period
      // Since History only stores titles (legacy), we match by title for history, 
      // but for "today" we check sourceId.
      // Ideally, we should check history by matching Title == plan.title (Assuming titles are unique-ish)
      
      const now = new Date();
      let count = 0;
      
      // 1. Check History
      state.history.forEach(day => {
          const d = new Date(day.date);
          let inPeriod = false;
          
          if (mode === 'weekly') {
             // Simple check: within last 7 days? Or same ISO week? 
             // Let's do last 7 days for simplicity + rolling window
             const diffTime = Math.abs(now.getTime() - d.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             if (diffDays <= 7) inPeriod = true;
          } else {
             // Same month
             if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) inPeriod = true;
          }

          if (inPeriod && day.completedTaskTitles) {
             // Find matching titles. 
             // Note: In real app, better to store ID in history.
             // We access the plan from the closure if needed, but here we just need count.
             // We need to look up the plan title from state.scheduledTasks using planId?
             const plan = state.scheduledTasks.find(p => p.id === planId);
             if (plan && day.completedTaskTitles.includes(plan.title)) {
                 count++;
             }
          }
      });

      // 2. Check Today (if completed)
      const completedToday = state.todayTasks.filter(t => t.completed && t.sourceId === planId).length;
      
      return count + completedToday;
  };

  return (
    <div className="min-h-full flex flex-col bg-stone-50 pb-40">
      <ProgressBar total={todayPoolMax} current={displayRemaining} phase={state.phase} />

      {/* Diary */}
      <section className="px-6 py-6 border-b border-stone-100">
        <textarea
          value={state.diaryContent}
          onChange={handleDiaryChange}
          placeholder="写下今天的状态或限制... (输入数字如 -20 会自动调整意志力池)"
          className="w-full bg-transparent text-stone-600 placeholder:text-stone-300 resize-none outline-none text-sm leading-relaxed min-h-[60px]"
        />
        {state.diaryAdjustment !== 0 && (
          <div className="text-xs text-stone-400 mt-2 text-right italic">
            当日校准: {state.diaryAdjustment > 0 ? '+' : ''}{state.diaryAdjustment}
          </div>
        )}
      </section>

      {/* Task List */}
      <section className="flex-1 px-6 py-6 space-y-4">
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
          {state.phase === 'PLANNING' ? '今日分配' : '执行清单'}
        </h2>

        <div className="space-y-1">
          {state.todayTasks.map(task => (
            <TaskItem 
                key={task.id}
                task={task}
                phase={state.phase}
                onToggle={toggleTask}
                onRemove={removeTask}
                onSwipeAction={handleSwipeAction}
            />
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleAddTask}
            placeholder="输入任务 20 (回车添加)"
            className="w-full bg-white border border-stone-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all placeholder:text-stone-300"
          />

          {displayRemaining > 0 && (
            <button
              onClick={fillRemaining}
              className="w-full py-3 border border-dashed border-stone-200 text-stone-400 rounded-lg text-xs hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              一键填充剩余 ({displayRemaining})
            </button>
          )}
        </div>
      </section>

      {/* Mini Task Library */}
      <section className="px-6 py-4 border-t border-stone-100">
          <h3 className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-3">任务库</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            
            {/* Frequency Plans (Yellow) */}
            {state.scheduledTasks
                .filter(p => p.config.mode !== 'specific_days')
                .map(p => {
                    const isWeekly = p.config.mode === 'weekly_frequency';
                    const currentCount = getFrequencyStats(p.id, isWeekly ? 'weekly' : 'monthly');
                    const target = p.config.targetCount || 1;
                    const isDone = currentCount >= target;
                    
                    return (
                        <button
                            key={p.id}
                            onClick={() => addScheduledTask(p)}
                            className={`relative flex-shrink-0 pl-3 pr-8 py-2 border rounded-md text-xs font-medium whitespace-nowrap transition-colors flex flex-col items-start ${
                                isDone 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200 opacity-60' 
                                : 'bg-white text-stone-600 border-yellow-200 hover:bg-yellow-50'
                            }`}
                        >
                            <span className="font-bold text-yellow-600">{p.title}</span>
                            <span className="text-[9px] text-stone-400">{p.cost} WP</span>
                            
                            {/* Progress Ring */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                                <span className="text-[9px] font-bold text-yellow-500">
                                    {currentCount}/{target}
                                </span>
                            </div>
                        </button>
                    );
                })
            }

            {/* Templates (Pink) */}
            {state.templates.map(t => (
              <button
                key={t.id}
                onClick={() => copyFromLibrary(t)}
                className="flex-shrink-0 px-3 py-2 bg-pink-50 text-pink-700 border border-pink-100 rounded-md text-xs font-medium whitespace-nowrap hover:bg-pink-100 transition-colors"
              >
                {t.title} <span className="opacity-50 ml-1">{t.cost}</span>
              </button>
            ))}
            
            {/* Backlog (Blue) */}
            {state.backlog.map(t => (
              <button
                key={t.id}
                onClick={() => moveFromBacklog(t)}
                className="flex-shrink-0 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-medium whitespace-nowrap hover:bg-blue-100 transition-colors"
              >
                {t.title} <span className="opacity-50 ml-1">{t.cost}</span>
              </button>
            ))}
            
            {state.templates.length === 0 && state.backlog.length === 0 && state.scheduledTasks.length === 0 && (
              <span className="text-xs text-stone-300 italic">任务库为空...</span>
            )}
          </div>
      </section>

      {/* Action Footer */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-6 py-4 pointer-events-none flex justify-between items-end bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent z-40">
        <button
          onClick={handleNewDay}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-600 rounded-full text-xs font-medium transition-colors shadow-sm"
        >
          <Sunrise size={16} />
          新的一天
        </button>

        {state.phase === 'PLANNING' && (
          <button
            onClick={startExecution}
            className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-stone-800 hover:bg-stone-900 text-stone-50 rounded-full text-sm font-medium transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            分配完成
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
