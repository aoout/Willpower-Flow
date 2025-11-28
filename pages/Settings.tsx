
import React from 'react';
import { AppState } from '../types';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SettingsProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ state, updateState }) => {
  // Use optional chaining and default to false for safety
  const isOffset = state.settings?.bottomNavOffset ?? false;

  const toggleOffset = () => {
    updateState({
      settings: {
        ...state.settings,
        bottomNavOffset: !isOffset
      }
    });
  };

  return (
    <div className="min-h-full flex flex-col bg-stone-50 p-6">
       <header className="mb-8 flex items-center gap-4">
        <Link to="/awareness" className="text-stone-400 hover:text-stone-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-light text-stone-800 tracking-tight">设置</h1>
      </header>

      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
        <div 
          onClick={toggleOffset}
          className="flex items-center justify-between p-4 cursor-pointer active:bg-stone-50 transition-colors"
        >
          <span className="text-stone-700 font-medium text-sm">底部菜单栏上移</span>
          
          {/* Toggle Switch */}
          <div className={`w-10 h-6 rounded-full transition-colors relative ${isOffset ? 'bg-stone-800' : 'bg-stone-200'}`}>
            <div 
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${isOffset ? 'translate-x-4' : 'translate-x-0'}`} 
            />
          </div>
        </div>
      </div>
      
      <p className="mt-4 text-[10px] text-stone-400 px-2 leading-relaxed">
        开启此选项会将底部导航栏向上移动一段距离，以适应某些设备的手势操作区域或个人使用习惯。
      </p>
    </div>
  );
};
