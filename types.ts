
export interface Task {
  id: string;
  title: string;
  cost: number;
  completed: boolean;
  type: 'normal' | 'template' | 'backlog' | 'filler';
}

export interface DayRecord {
  date: string;
  diary: string;
  baseMax: number;
  finalBalance: number; // remaining at end of day
  awakening: boolean; // if balance < 0
  tasksCompleted: number;
  totalCostConsumed: number;
  completedTaskTitles?: string[]; // List of task titles completed that day
}

export interface AppSettings {
  bottomNavOffset: boolean;
}

export interface AppState {
  // Config
  baseMax: number;
  settings: AppSettings;
  
  // Daily State
  lastActiveDate: string; // YYYY-MM-DD
  diaryContent: string;
  diaryAdjustment: number;
  
  // Tasks
  todayTasks: Task[];
  templates: Task[];
  backlog: Task[];
  
  // Phase
  phase: 'PLANNING' | 'EXECUTION';
  
  // History
  history: DayRecord[];
}

export const INITIAL_STATE: AppState = {
  baseMax: 100,
  settings: {
    bottomNavOffset: false,
  },
  lastActiveDate: new Date().toISOString().split('T')[0],
  diaryContent: '',
  diaryAdjustment: 0,
  todayTasks: [],
  templates: [
    { id: 't1', title: '晨间阅读', cost: 10, completed: false, type: 'template' },
    { id: 't2', title: '深蹲 50 次', cost: 15, completed: false, type: 'template' },
  ],
  backlog: [
    { id: 'b1', title: '整理桌面', cost: 5, completed: false, type: 'backlog' },
  ],
  phase: 'PLANNING',
  history: [],
};
