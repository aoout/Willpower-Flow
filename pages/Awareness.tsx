import React from 'react';
import { AppState } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Battery, Zap } from 'lucide-react';

interface AwarenessProps {
  state: AppState;
}

export const Awareness: React.FC<AwarenessProps> = ({ state }) => {
  // Prepare data for chart (Last 7 entries)
  const chartData = state.history.slice(-7).map(h => ({
    date: h.date.slice(5), // MM-DD
    balance: h.finalBalance,
    consumed: h.totalCostConsumed,
    awakening: h.awakening
  }));

  const totalAwakenings = state.history.filter(h => h.awakening).length;
  const avgEfficiency = state.history.length > 0 
    ? Math.round(state.history.reduce((acc, h) => acc + h.tasksCompleted, 0) / state.history.length) 
    : 0;

  return (
    <div className="min-h-full flex flex-col bg-stone-50 p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-xl font-light text-stone-800 tracking-tight">自我觉察</h1>
        <p className="text-xs text-stone-400 mt-1">回顾你的意志力流动轨迹</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-stone-400">
            <Zap size={14} />
            <span className="text-[10px] uppercase tracking-wider font-bold">觉醒次数</span>
          </div>
          <span className="text-2xl font-light text-stone-800">{totalAwakenings}</span>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-stone-400">
            <Activity size={14} />
            <span className="text-[10px] uppercase tracking-wider font-bold">日均完成任务</span>
          </div>
          <span className="text-2xl font-light text-stone-800">{avgEfficiency}</span>
        </div>

        <div className="col-span-2 bg-stone-800 p-4 rounded-xl shadow-md text-stone-50 flex items-center justify-between">
            <div className="flex flex-col">
                 <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-1">当前基础上限</span>
                 <span className="text-3xl font-light">{state.baseMax} WP</span>
            </div>
            <Battery className="text-stone-500" size={32} />
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 mb-8 h-64">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">近7日结余</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#a8a29e' }} 
                dy={10}
            />
            <Tooltip 
                cursor={{ fill: '#f5f5f4' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="balance" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.balance < 0 ? '#ef4444' : '#57534e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-stone-300 text-xs italic">
            暂无历史数据，完成一次“新的一天”后可见。
        </div>
      )}

      {/* Recent Log */}
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">最近日记</h3>
      <div className="space-y-4">
        {state.history.slice().reverse().slice(0, 5).map((h, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-stone-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-stone-400">{h.date}</span>
                    <span className={`text-xs font-bold ${h.finalBalance < 0 ? 'text-red-500' : 'text-stone-300'}`}>
                        {h.finalBalance < 0 ? '觉醒' : `${h.finalBalance} 余`}
                    </span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">
                    {h.diary || <span className="text-stone-300 italic">无记录...</span>}
                </p>
            </div>
        ))}
      </div>
    </div>
  );
};