import React, { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { LibraryManager } from './pages/LibraryManager';
import { Awareness } from './pages/Awareness';
import { AppState, INITIAL_STATE } from './types';
import { loadState, saveState } from './services/storage';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    const loadedState = loadState();
    
    // Check if it's a new calendar day naturally (in case user refreshes next day)
    // However, the prompt implies "New Day" button is the trigger for logic.
    // We'll stick to manual trigger, but update today's date context if needed.
    // For now, just load the raw state.
    
    setState(loadedState);
    setLoaded(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (loaded) {
      saveState(state);
    }
  }, [state, loaded]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  if (!loaded) return null;

  return (
    <MemoryRouter>
      <Layout>
        <Routes>
          <Route 
            path="/" 
            element={<Home state={state} updateState={updateState} />} 
          />
          <Route 
            path="/library" 
            element={<LibraryManager state={state} updateState={updateState} />} 
          />
          <Route 
            path="/awareness" 
            element={<Awareness state={state} />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
};

export default App;