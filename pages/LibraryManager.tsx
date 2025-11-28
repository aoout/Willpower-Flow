import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import { AppState, Task } from '../types';

interface LibraryManagerProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const LibraryManager: React.FC<LibraryManagerProps> = ({ state, updateState }) => {
  const [activeTab, setActiveTab] = useState<'template' | 'backlog'>('template');
  const [inputValue, setInputValue] = useState('');

  const handleAddItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const match = inputValue.match(/^(.*?)(\d+)$/);
      let title = inputValue;
      let cost = 10;

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

      const newItem: Task = {
        id: uuidv4(),
        title,
        cost,
        completed: false,
        type: activeTab
      };

      if (activeTab === 'template') {
        updateState({ templates: [...state.templates, newItem] });
      } else {
        updateState({ backlog: [...state.backlog, newItem] });
      }
      setInputValue('');
    }
  };

  const removeItem = (id: string, list: 'template' | 'backlog') => {
    if (list === 'template') {
      updateState({ templates: state.templates.filter(t => t.id !== id) });
    } else {
      updateState({ backlog: state.backlog.filter(t => t.id !== id) });
    }
  };

  const list = activeTab === 'template' ? state.templates : state.backlog;
  const themeColor = activeTab === 'template' ? 'pink' : 'blue';

  return (
    <div className="min-h-full flex flex-col bg-stone-50 p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-xl font-light text-stone-800 tracking-tight">任务库配置</h1>
        <p className="text-xs text-stone-400 mt-1">管理你的常用模板和待办清单</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-stone-200 mb-6">
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

      {/* Input */}
      <div className="mb-6 relative group">
        <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none ${
           activeTab === 'template' ? 'text-pink-300' : 'text-blue-300'
        }`}>
          <Plus size={16} />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleAddItem}
          placeholder={activeTab === 'template' ? "输入模板任务 10" : "输入待办事项 20"}
          className={`w-full bg-white border rounded-lg pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-stone-300 ${
            activeTab === 'template' 
              ? 'border-pink-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-400' 
              : 'border-blue-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
          }`}
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {list.map(item => (
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
              onClick={() => removeItem(item.id, activeTab)}
              className="text-stone-200 hover:text-red-400 transition-colors p-2 -mr-2"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        
        {list.length === 0 && (
          <div className="text-center py-10 text-stone-300 text-xs italic">
            这里空空如也...
          </div>
        )}
      </div>
    </div>
  );
};