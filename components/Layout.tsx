
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Library, BarChart2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  bottomNavOffset?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, bottomNavOffset = false }) => {
  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden relative">
      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        {children}
      </main>
      
      <nav className={`h-16 border-t border-stone-100 flex items-center justify-around bg-white/95 backdrop-blur-sm z-[100] shrink-0 relative transition-all duration-300 ${bottomNavOffset ? 'mb-16' : ''}`}>
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
              isActive ? 'text-stone-800 scale-105' : 'text-stone-300 hover:text-stone-500'
            }`
          }
        >
          <LayoutDashboard size={20} strokeWidth={1.5} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">分配</span>
        </NavLink>
        
        <NavLink 
          to="/library" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
              isActive ? 'text-stone-800 scale-105' : 'text-stone-300 hover:text-stone-500'
            }`
          }
        >
          <Library size={20} strokeWidth={1.5} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">任务库</span>
        </NavLink>
        
        <NavLink 
          to="/awareness" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
              isActive ? 'text-stone-800 scale-105' : 'text-stone-300 hover:text-stone-500'
            }`
          }
        >
          <BarChart2 size={20} strokeWidth={1.5} />
          <span className="text-[10px] mt-1 font-medium tracking-wide">觉察</span>
        </NavLink>
      </nav>
    </div>
  );
};
