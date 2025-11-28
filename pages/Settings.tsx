
import React, { useRef } from 'react';
import { AppState } from '../types';
import { ArrowLeft, Download, Upload, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SettingsProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ state, updateState }) => {
  // Use optional chaining and default to false for safety
  const isOffset = state.settings?.bottomNavOffset ?? false;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleOffset = () => {
    updateState({
      settings: {
        ...state.settings,
        bottomNavOffset: !isOffset
      }
    });
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `willpower-flow-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('导出失败，请重试');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') return;
        
        const json = JSON.parse(result);
        
        // Basic validation: check for key properties
        // We look for properties that are unlikely to be in a random JSON file
        if (
            json && 
            typeof json === 'object' && 
            'baseMax' in json && 
            'history' in json && 
            Array.isArray(json.templates)
        ) {
          if (window.confirm('确定要导入数据吗？这将完全覆盖当前的日记、任务库和意志力状态。\n\n建议先导出备份。')) {
            updateState(json);
            alert('数据导入成功！');
          }
        } else {
          alert('文件格式错误：未找到有效的 Willpower Flow 数据。');
        }
      } catch (err) {
        console.error('Import parse error', err);
        alert('读取文件失败，请确保文件是有效的 JSON 格式。');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
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
      <section>
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">数据管理</h2>
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden divide-y divide-stone-100">
            <button
                onClick={handleExport}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 active:bg-stone-100 transition-colors text-left group"
            >
                <div className="flex flex-col">
                    <span className="text-stone-700 font-medium text-sm group-hover:text-stone-900">导出数据备份 (.json)</span>
                </div>
                <Download size={18} className="text-stone-300 group-hover:text-stone-500" />
            </button>

            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 active:bg-stone-100 transition-colors text-left group"
            >
                <div className="flex flex-col">
                    <span className="text-stone-700 font-medium text-sm group-hover:text-stone-900">导入数据恢复</span>
                </div>
                <Upload size={18} className="text-stone-300 group-hover:text-stone-500" />
            </button>
        </div>
        <p className="mt-2 text-[10px] text-stone-400 px-2 leading-relaxed">
            导出包含：每日日记、完成任务统计、任务库模板以及当前的意志力状态。
        </p>
      </section>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};
