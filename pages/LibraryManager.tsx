
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, X, Info, StickyNote, Calendar } from 'lucide-react';
import { AppState, Task, ScheduledTask, ScheduleConfig } from '../types';

interface LibraryManagerProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const LibraryManager: React.FC<LibraryManagerProps> = ({ state, updateState }) => {
  const [activeTab, setActiveTab] = useState<'template' | 'backlog' | 'scheduled'>('scheduled');
  
  // Simple Input for Templates/Backlog
  const [simpleInputValue, setSimpleInputValue] = useState('');

  // Modal State for Scheduled Tasks
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [planForm, setPlanForm] = useState<{
      title: string;
      cost: number;
      note: string;
      mode: 'specific_days' | 'weekly_frequency' | 'monthly_frequency';
      days: number[]; // 0-6
      targetCount: number;
  }>({
      title: '',
      cost: 10,
      note: '',
      mode: 'specific_days',
      days: [],
      targetCount: 1
  });

  // --- Helpers ---
  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  // --- Handlers: Simple Lists (Template/Backlog) ---
  const handleAddSimpleItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && simpleInputValue.trim()) {
      const match = simpleInputValue.match(/^(.*?)(\d+)$/);
      let title = simpleInputValue;
      let cost = 10;

      if (match) {
        title = match[1].trim();
        cost = parseInt(match[2], 10);
      } else {
         // Fallback logic
         const parts = simpleInputValue.split(' ');
         if(parts.length > 1) {
            const last = parseInt(parts[parts.length-1]);
            if(!isNaN(last)) {
                cost = last;
                title = parts.slice(0, -1).join(' ').trim();
            }
         }
      }

      const newItem: Task = {
        id: uuidv4(),
        title,
        cost,
        completed: false,
        type: activeTab === 'template' ? 'template' : 'backlog'
      };

      if (activeTab === 'template') {
        updateState({ templates: [...state.templates, newItem] });
      } else {
        updateState({ backlog: [...state.backlog, newItem] });
      }
      setSimpleInputValue('');
    }
  };

  const removeSimpleItem = (id: string, listType: 'template' | 'backlog') => {
    if (listType === 'template') {
      updateState({ templates: state.templates.filter(t => t.id !== id) });
    } else {
      updateState({ backlog: state.backlog.filter(t => t.id !== id) });
    }
  };

  // --- Handlers: Scheduled Tasks ---
  const openPlanModal = (existing?: ScheduledTask) => {
      if (existing) {
          setEditingId(existing.id);
          setPlanForm({
              title: existing.title,
              cost: existing.cost,
              note: existing.note,
              mode: existing.config.mode,
              days: existing.config.days || [],
              targetCount: existing.config.targetCount || 1
          });
      } else {
          setEditingId(null);
          setPlanForm({
              title: '',
              cost: 10,
              note: '',
              mode: 'specific_days',
              days: [],
              targetCount: 1
          });
      }
      setIsModalOpen(true);
  };

  const savePlan = () => {
      if (!planForm.title.trim()) return;

      const newPlan: ScheduledTask = {
          id: editingId || uuidv4(),
          title: planForm.title,
          cost: planForm.cost,
          note: planForm.note,
          created: new Date().toISOString(),
          config: {
              mode: planForm.mode,
              days: planForm.mode === 'specific_days' ? planForm.days : undefined,
              targetCount: planForm.mode !== 'specific_days' ? planForm.targetCount : undefined
          }
      };

      if (editingId) {
          updateState({
              scheduledTasks: state.scheduledTasks.map(p => p.id === editingId ? newPlan : p)
          });
      } else {
          updateState({
              scheduledTasks: [...state.scheduledTasks, newPlan]
          });
      }
      setIsModalOpen(false);
  };

  const removePlan = (id: string) => {
      if(window.confirm('确定删除这个计划任务吗?')) {
        updateState({
            scheduledTasks: state.scheduledTasks.filter(p => p.id !== id)
        });
      }
  };

  const toggleDay = (dayIndex: number) => {
      if (planForm.days.includes(dayIndex)) {
          setPlanForm(prev => ({ ...prev, days: prev.days.filter(d => d !== dayIndex) }));
      } else {
          setPlanForm(prev => ({ ...prev, days: [...prev.days, dayIndex].sort() }));
      }
  };

  // --- Render ---
  return (
    <div className="min-h-full flex flex-col bg-stone-50 p-6 pb-24 relative">
      <header className="mb-8">
        <h1 className="text-xl font-light text-stone-800 tracking-tight">任务库配置</h1>
        <p className="text-xs text-stone-400 mt-1">管理你的常用模板、待办和计划</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200 mb-6">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === 'scheduled' ? 'text-yellow-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          计划任务
          {activeTab === 'scheduled' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('template')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === 'template' ? 'text-pink-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          模板任务
          {activeTab === 'template' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('backlog')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeTab === 'backlog' ? 'text-blue-600' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          待办清单
          {activeTab === 'backlog' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Dynamic Content */}
      {activeTab === 'scheduled' ? (
          <>
             <button 
                onClick={() => openPlanModal()}
                className="w-full py-3 border border-dashed border-yellow-300 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2 mb-4"
             >
                <Plus size={16} />
                新建计划任务
             </button>

             <div className="space-y-3">
                 {state.scheduledTasks.map(plan => (
                     <div 
                        key={plan.id}
                        onClick={() => openPlanModal(plan)}
                        className="bg-white border border-yellow-100 rounded-xl p-4 shadow-sm active:scale-[0.99] transition-all relative overflow-hidden group cursor-pointer"
                     >
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={(e) => { e.stopPropagation(); removePlan(plan.id); }}
                                className="text-stone-300 hover:text-red-400"
                             >
                                 <Trash2 size={16} />
                             </button>
                        </div>

                        <div className="flex justify-between items-start mb-2">
                             <div>
                                 <h3 className="text-stone-800 font-bold">{plan.title}</h3>
                                 <span className="text-xs text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                     消耗 {plan.cost}
                                 </span>
                             </div>
                             <div className="flex flex-col items-end">
                                 {/* Badge */}
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-100">
                                     {plan.config.mode === 'specific_days' ? '固定日' : (plan.config.mode === 'weekly_frequency' ? '每周频次' : '每月频次')}
                                 </span>
                             </div>
                        </div>

                        {/* Config Details */}
                        <div className="text-xs text-stone-500 mt-2 flex items-center gap-2">
                             <Calendar size={12} />
                             {plan.config.mode === 'specific_days' && (
                                 <span>每周: {plan.config.days?.map(d => WEEKDAYS[d]).join(', ')}</span>
                             )}
                             {plan.config.mode === 'weekly_frequency' && (
                                 <span>每周完成 {plan.config.targetCount} 次</span>
                             )}
                             {plan.config.mode === 'monthly_frequency' && (
                                 <span>每月完成 {plan.config.targetCount} 次</span>
                             )}
                        </div>

                        {plan.note && (
                            <div className="mt-3 text-[11px] text-stone-400 border-t border-stone-50 pt-2 flex gap-1">
                                <StickyNote size={12} className="shrink-0" />
                                <span className="truncate">{plan.note}</span>
                            </div>
                        )}
                     </div>
                 ))}
             </div>
          </>
      ) : (
          // Template / Backlog Simple Input
          <>
            <div className="mb-6 relative group">
                <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none ${
                activeTab === 'template' ? 'text-pink-300' : 'text-blue-300'
                }`}>
                <Plus size={16} />
                </div>
                <input
                type="text"
                value={simpleInputValue}
                onChange={(e) => setSimpleInputValue(e.target.value)}
                onKeyDown={handleAddSimpleItem}
                placeholder={activeTab === 'template' ? "输入模板任务 10" : "输入待办事项 20"}
                className={`w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-stone-300 ${
                    activeTab === 'template' 
                    ? 'border-pink-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-400' 
                    : 'border-blue-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                }`}
                />
            </div>

            <div className="space-y-3">
                {(activeTab === 'template' ? state.templates : state.backlog).map(item => (
                <div 
                    key={item.id}
                    className={`flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm group hover:shadow-md transition-all ${
                    activeTab === 'template' ? 'border-pink-50' : 'border-blue-50'
                    }`}
                >
                    <div className="flex flex-col">
                    <span className="text-stone-700 font-medium text-sm">{item.title}</span>
                    <span className={`text-[10px] mt-0.5 ${
                        activeTab === 'template' ? 'text-pink-400' : 'text-blue-400'
                    }`}>
                        消耗: {item.cost}
                    </span>
                    </div>
                    
                    <button
                    onClick={() => removeSimpleItem(item.id, activeTab as 'template'|'backlog')}
                    className="text-stone-200 hover:text-red-400 transition-colors p-2 -mr-2"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
                ))}
            </div>
          </>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-stone-800">{editingId ? '编辑计划' : '新建计划'}</h2>
                      <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="space-y-4">
                      {/* Title & Cost */}
                      <div className="flex gap-4">
                          <div className="flex-1">
                              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">名称</label>
                              <input 
                                type="text" 
                                value={planForm.title}
                                onChange={e => setPlanForm({...planForm, title: e.target.value})}
                                className="w-full bg-stone-50 rounded-lg p-2 text-sm text-stone-600 outline-none focus:ring-1 focus:ring-yellow-200" 
                                placeholder="如: 健身"
                              />
                          </div>
                          <div className="w-20">
                              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">消耗</label>
                              <input 
                                type="number" 
                                value={planForm.cost}
                                onChange={e => setPlanForm({...planForm, cost: parseInt(e.target.value) || 0})}
                                className="w-full bg-stone-50 rounded-lg p-2 text-sm text-stone-600 outline-none focus:ring-1 focus:ring-yellow-200" 
                              />
                          </div>
                      </div>

                      {/* Note */}
                      <div>
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">笔记</label>
                          <textarea 
                             rows={2}
                             value={planForm.note}
                             onChange={e => setPlanForm({...planForm, note: e.target.value})}
                             className="w-full bg-stone-50 rounded-lg p-2 text-xs text-stone-600 outline-none resize-none focus:ring-1 focus:ring-yellow-200"
                             placeholder="写点关于这个任务的备注..."
                          />
                      </div>

                      {/* Mode Selector */}
                      <div>
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 block">计划模式</label>
                          <div className="grid grid-cols-3 gap-2">
                              {[
                                  { id: 'specific_days', label: '固定日' },
                                  { id: 'weekly_frequency', label: '每周频次' },
                                  { id: 'monthly_frequency', label: '每月频次' }
                              ].map(m => (
                                  <button
                                      key={m.id}
                                      onClick={() => setPlanForm({...planForm, mode: m.id as any})}
                                      className={`py-2 text-[10px] font-medium rounded border transition-all ${
                                          planForm.mode === m.id 
                                          ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
                                          : 'bg-white border-stone-100 text-stone-400'
                                      }`}
                                  >
                                      {m.label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Config Area */}
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                          {planForm.mode === 'specific_days' && (
                              <div className="flex justify-between">
                                  {WEEKDAYS.map((day, idx) => (
                                      <button
                                          key={idx}
                                          onClick={() => toggleDay(idx)}
                                          className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                                              planForm.days.includes(idx)
                                              ? 'bg-yellow-400 text-white shadow-sm'
                                              : 'bg-white text-stone-400 border border-stone-100'
                                          }`}
                                      >
                                          {day}
                                      </button>
                                  ))}
                              </div>
                          )}

                          {(planForm.mode === 'weekly_frequency' || planForm.mode === 'monthly_frequency') && (
                              <div className="flex items-center justify-between">
                                  <span className="text-sm text-stone-600">
                                      {planForm.mode === 'weekly_frequency' ? '每周' : '每月'}目标完成次数:
                                  </span>
                                  <div className="flex items-center gap-3">
                                      <button 
                                        onClick={() => setPlanForm(p => ({...p, targetCount: Math.max(1, p.targetCount - 1)}))}
                                        className="w-8 h-8 bg-white border rounded-full flex items-center justify-center text-stone-500"
                                      >-</button>
                                      <span className="text-lg font-mono w-4 text-center">{planForm.targetCount}</span>
                                      <button 
                                        onClick={() => setPlanForm(p => ({...p, targetCount: p.targetCount + 1}))}
                                        className="w-8 h-8 bg-white border rounded-full flex items-center justify-center text-stone-500"
                                      >+</button>
                                  </div>
                              </div>
                          )}
                      </div>

                      <button 
                          onClick={savePlan}
                          className="w-full py-3 bg-stone-800 text-white rounded-xl font-medium text-sm mt-4 hover:bg-stone-900 transition-transform active:scale-95"
                      >
                          保存设定
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
