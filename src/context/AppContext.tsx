import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Goal, DailyLogEntry, WeeklyReward, MonthlyReward, Milestone2027, AppSettings } from '../types';
import { loadStoredState, savePartialState, saveStoredState, resetToStarterDefaults } from '../services/storage';

interface AppContextType {
  goals: Goal[];
  dailyLogs: DailyLogEntry[];
  weeklyRewards: WeeklyReward[];
  monthlyRewards: MonthlyReward[];
  milestones: Milestone2027[];
  settings: AppSettings | null;
  isLoaded: boolean;
  
  // Mutators
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  recordExecution: (date: string, goalId: string, completed: boolean, failureReason?: string) => void;
  clearExecution: (date: string, goalId: string) => void;
  updateSettings: (settings: AppSettings) => void;
  saveWeeklyReward: (reward: WeeklyReward) => void;
  saveMonthlyReward: (reward: MonthlyReward) => void;
  saveMilestone: (milestone: Milestone2027) => void;
  deleteMilestone: (id: string) => void;
  importState: (data: any) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>([]);
  const [weeklyRewards, setWeeklyRewards] = useState<WeeklyReward[]>([]);
  const [monthlyRewards, setMonthlyRewards] = useState<MonthlyReward[]>([]);
  const [milestones, setMilestones] = useState<Milestone2027[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadStoredState();
    setGoals(loaded.goals);
    setDailyLogs(loaded.dailyLogs);
    setWeeklyRewards(loaded.weeklyRewards);
    setMonthlyRewards(loaded.monthlyRewards);
    setMilestones(loaded.milestones);
    setSettings(loaded.settings);
    setIsLoaded(true);
  }, []);

  const addGoal = useCallback((goal: Goal) => {
    setGoals(prev => {
      const updated = [...prev, goal];
      savePartialState({ goals: updated });
      return updated;
    });
  }, []);

  const updateGoal = useCallback((goal: Goal) => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === goal.id ? goal : g);
      savePartialState({ goals: updated });
      return updated;
    });
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals(prev => {
      const updated = prev.filter(g => g.id !== goalId);
      savePartialState({ goals: updated });
      return updated;
    });
  }, []);

  const recordExecution = useCallback((date: string, goalId: string, completed: boolean, failureReason?: string) => {
    setDailyLogs(prev => {
      const existingIdx = prev.findIndex(l => l.date === date && l.goalId === goalId);
      const newEntry: DailyLogEntry = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `log_${date}_${goalId}`,
        date,
        goalId,
        completed,
        failureReason: completed ? undefined : failureReason,
        timestamp: Date.now(),
      };
      
      const copy = [...prev];
      if (existingIdx >= 0) {
        copy[existingIdx] = newEntry;
      } else {
        copy.push(newEntry);
      }
      
      savePartialState({ dailyLogs: copy });
      return copy;
    });
  }, []);

  const clearExecution = useCallback((date: string, goalId: string) => {
    setDailyLogs(prev => {
      const updated = prev.filter(l => !(l.date === date && l.goalId === goalId));
      savePartialState({ dailyLogs: updated });
      return updated;
    });
  }, []);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    savePartialState({ settings: newSettings });
  }, []);

  const saveWeeklyReward = useCallback((reward: WeeklyReward) => {
    setWeeklyRewards(prev => {
      const existingIdx = prev.findIndex(r => r.id === reward.id || r.weekId === reward.weekId);
      const copy = [...prev];
      if (existingIdx >= 0) copy[existingIdx] = reward;
      else copy.push(reward);
      savePartialState({ weeklyRewards: copy });
      return copy;
    });
  }, []);

  const saveMonthlyReward = useCallback((reward: MonthlyReward) => {
    setMonthlyRewards(prev => {
      const existingIdx = prev.findIndex(r => r.id === reward.id || r.monthId === reward.monthId);
      const copy = [...prev];
      if (existingIdx >= 0) copy[existingIdx] = reward;
      else copy.push(reward);
      savePartialState({ monthlyRewards: copy });
      return copy;
    });
  }, []);

  const saveMilestone = useCallback((milestone: Milestone2027) => {
    setMilestones(prev => {
      const existingIdx = prev.findIndex(m => m.id === milestone.id);
      const copy = [...prev];
      if (existingIdx >= 0) copy[existingIdx] = milestone;
      else copy.push(milestone);
      savePartialState({ milestones: copy });
      return copy;
    });
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setMilestones(prev => {
      const updated = prev.filter(m => m.id !== id);
      savePartialState({ milestones: updated });
      return updated;
    });
  }, []);
  
  const importState = useCallback((data: any) => {
    saveStoredState(data); // Monolithic overwrite
    setGoals(data.goals || []);
    setDailyLogs(data.dailyLogs || []);
    setWeeklyRewards(data.weeklyRewards || []);
    setMonthlyRewards(data.monthlyRewards || []);
    setMilestones(data.milestones || []);
    setSettings(data.settings || null);
  }, []);
  
  const resetAllData = useCallback(() => {
    const fresh = resetToStarterDefaults();
    setGoals(fresh.goals);
    setDailyLogs(fresh.dailyLogs);
    setWeeklyRewards(fresh.weeklyRewards);
    setMonthlyRewards(fresh.monthlyRewards);
    setMilestones(fresh.milestones);
    setSettings(fresh.settings);
  }, []);

  return (
    <AppContext.Provider value={{
      goals, dailyLogs, weeklyRewards, monthlyRewards, milestones, settings, isLoaded,
      addGoal, updateGoal, deleteGoal, recordExecution, clearExecution,
      updateSettings, saveWeeklyReward, saveMonthlyReward, saveMilestone, deleteMilestone, importState, resetAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
