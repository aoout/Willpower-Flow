import React, { useRef } from 'react';
import { AppState } from '../types';
import { ArrowLeft, Download, Upload, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { importAndSaveData } from '../services/storage';

interface SettingsProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ state, updateState }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `willpower-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    // Reset the value first to allow re-importing the same file if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importAndSaveData(text);
      
      if (result.success) {
        if (window.confirm("数据导入成功。点击确定刷新页面以应用更改。")) {
            window.location.reload();
        }
      } else {
        alert(`导入失败: ${result.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("读取文件时发生错误");
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-stone-50 p-6">
       <header className="mb-8 flex items-center gap-4">
        <Link to="/awareness" className="text-stone-400 hover:text-stone-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-light text-stone-800 tracking-tight">设置</h1>
      </header>

      {/* UI Settings Section */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">界面偏好</h2>
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
        <p className="mt-2 text-[10px] text-stone-400 px-2 leading-relaxed">
          开启此选项会将底部导航栏向上移动一段距离，以适应某些设备的手势操作区域。
        </p>
      </section>

      {/* Data Management Section */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">数据管理</h2>
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden divide-y divide-stone-50">
            
            <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                        <Download size={18} />
                    </div>
                    <div>
                        <span className="block text-stone-700 font-medium text-sm">导出备份</span>
                        <span className="block text-[10px] text-stone-400 mt-0.5">保存当前所有数据为 .json 文件</span>
                    </div>
                </div>
            </button>

            <button 
                onClick={handleImportClick}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                        <Upload size={18} />
                    </div>
                    <div>
                        <span className="block text-stone-700 font-medium text-sm">导入备份</span>
                        <span className="block text-[10px] text-stone-400 mt-0.5">从 .json 文件恢复数据 (会覆盖当前数据)</span>
                    </div>
                </div>
            </button>

            {/* Hidden Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json"
                className="hidden" 
            />
        </div>
        
        <div className="mt-3 flex gap-2 px-2">
            <AlertCircle size={14} className="text-stone-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-stone-400 leading-relaxed">
                导入数据将完全覆盖当前的记录，建议先导出当前数据作为备份。完成后页面将自动刷新。
            </p>
        </div>
      </section>
    </div>
  );
};