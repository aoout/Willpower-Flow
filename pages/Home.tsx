import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, ArrowRight, RotateCcw, Sunrise, CheckCircle2, Circle } from 'lucide-react';
import { AppState, Task, DayRecord } from '../types';
import { ProgressBar } from '../components/ProgressBar';

interface HomeProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const Home: React.FC<HomeProps> = ({ state, updateState }) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Logic: Diary Parsing ---
  const handleDiaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    
    // Extract numbers using regex (integers, positive or negative)
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

  // Display Value Logic
  // PLANNING: Show Remaining = Max - Allocated
  // EXECUTION: Show Remaining = Max - Completed
  const displayRemaining = state.phase === 'PLANNING' 
    ? todayPoolMax - allocatedCost 
    : todayPoolMax - completedCost;

  // --- Logic: Task Management ---
  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // Parse format: "Task Name 20"
      // Regex: Capture everything before the last number as name, last number as cost
      const match = inputValue.match(/^(.*?)(\d+)$/);
      
      let title = inputValue;
      let cost = 5; // Default cost if parsing fails

      if (match) {
        title = match[1].trim();
        cost = parseInt(match[2], 10);
      } else {
        // Fallback: try to split by space
        const parts = inputValue.split(' ');
        const lastPart = parts[parts.length - 1];
        const maybeCost = parseInt(lastPart);
        if (!isNaN(maybeCost)) {
            cost = maybeCost;
            title = parts.slice(0, -1).join(' ').trim();
        }
      }
      
      if (!title) return; // Guard empty title

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
      
      // Scroll to bottom
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    updateState({
      todayTasks: state.todayTasks.map(t => t.id === id ? { ...t, ...updates } : t)
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

  // --- Logic: Library Interaction ---
  const copyFromLibrary = (template: Task) => {
    const newTask: Task = {
      ...template,
      id: uuidv4(),
      completed: false, // Reset completion
      type: 'normal' // Convert to normal execution task
    };
    updateState({
      todayTasks: [...state.todayTasks, newTask]
    });
  };

  const moveFromBacklog = (backlogTask: Task) => {
    // Add to today
    const newTask: Task = {
      ...backlogTask,
      type: 'normal'
    };
    
    // Remove from backlog and add to today
    updateState({
      backlog: state.backlog.filter(t => t.id !== backlogTask.id),
      todayTasks: [...state.todayTasks, newTask]
    });
  };

  // --- Logic: Phase Transition ---
  const startExecution = () => {
    updateState({ phase: 'EXECUTION' });
  };

  const handleNewDay = () => {
    // 1. Calculate stats
    const finalBalance = todayPoolMax - completedCost;
    const isAwakening = finalBalance < 0;
    
    // Collect completed task titles for stats
    const completedTitles = state.todayTasks
        .filter(t => t.completed && t.type !== 'filler')
        .map(t => t.title);

    // 2. Adjust Base Max
    let newBaseMax = state.baseMax;
    if (finalBalance > 0) {
      newBaseMax = Math.max(40, state.baseMax - 10);
    }
    
    // 3. Create Record
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

    // 4. Move incomplete tasks back to backlog? Or archive?
    // Move normal/template tasks back to backlog if not completed
    const incompleteTasks = state.todayTasks
      .filter(t => !t.completed && t.type !== 'filler')
      .map(t => ({ ...t, type: 'backlog' as const }));

    const nextBacklog = [...state.backlog, ...incompleteTasks];

    // 5. Reset State
    const todayStr = new Date().toISOString().split('T')[0];
    
    updateState({
      baseMax: newBaseMax,
      lastActiveDate: todayStr, // Update to "now" (which creates the new day context)
      diaryContent: '',
      diaryAdjustment: 0,
      todayTasks: [],
      backlog: nextBacklog,
      phase: 'PLANNING',
      history: [...state.history, record]
    });

    alert(isAwakening ? "觉醒时刻！你的意志力超越了极限。" : "新的一天开始了。");
  };

  // --- Render ---
  return (
    <div className="min-h-full flex flex-col bg-stone-50 pb-40">
      
      {/* 1. Progress Bar (Sticky) */}
      <ProgressBar 
        total={todayPoolMax} 
        current={displayRemaining} 
        phase={state.phase}
      />

      {/* 2. Diary / Calibration */}
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

      {/* 3. Today's Allocation */}
      <section className="flex-1 px-6 py-6 space-y-4">
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
          {state.phase === 'PLANNING' ? '今日分配' : '执行清单'}
        </h2>

        {/* Task List */}
        <div className="space-y-3">
          {state.todayTasks.map(task => (
            <div 
              key={task.id} 
              className={`group relative flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                task.completed 
                  ? 'bg-stone-100 border-transparent opacity-60' 
                  : 'bg-white border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200'
              }`}
            >
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => {
                  if (state.phase === 'EXECUTION') {
                    updateTask(task.id, { completed: !task.completed });
                  }
                }}
              >
                {state.phase === 'EXECUTION' && (
                  <div className={`transition-colors ${task.completed ? 'text-stone-400' : 'text-stone-200 group-hover:text-stone-300'}`}>
                    {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </div>
                )}
                
                <span className={`text-sm font-medium ${task.completed ? 'text-stone-400 line-through decoration-stone-300' : 'text-stone-700'}`}>
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-stone-400 bg-stone-50 px-2 py-1 rounded">
                  {task.cost}
                </span>
                
                <button 
                  onClick={() => removeTask(task.id)}
                  className="text-stone-200 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Inputs (Always Available) */}
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

      {/* 4. Mini Task Library (Always Available) */}
      <section className="px-6 py-4 border-t border-stone-100">
          <h3 className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-3">快速添加</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
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
            
            {state.templates.length === 0 && state.backlog.length === 0 && (
              <span className="text-xs text-stone-300 italic">任务库为空，去配置页添加...</span>
            )}
          </div>
      </section>

      {/* 5. Action Footer */}
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