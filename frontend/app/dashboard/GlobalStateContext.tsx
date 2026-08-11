'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface GlobalStateContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  columns: string[];
  setColumns: (cols: string[]) => void;
  previewData: any[];
  setPreviewData: (data: any[]) => void;
  targetColumn: string;
  setTargetColumn: (col: string) => void;
  problemType: string;
  setProblemType: (type: string) => void;
  datasetId: string;
  setDatasetId: (id: string) => void;
  storagePath: string;
  setStoragePath: (path: string) => void;
  nTrials: number;
  setNTrials: (n: number) => void;
  runs: any[];
  setRuns: (runs: any[] | ((prev: any[]) => any[])) => void;
  chartData: any[];
  setChartData: (data: any[] | ((prev: any[]) => any[])) => void;
  activeRunId: string | null;
  setActiveRunId: (id: string | null) => void;
  activeRun: any;
  setActiveRun: (run: any) => void;
  isChartFullscreen: boolean;
  setIsChartFullscreen: (is: boolean) => void;
  previewLimit: number;
  setPreviewLimit: (limit: number) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (is: boolean) => void;
  session: Session | null | undefined;
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [problemType, setProblemType] = useState('classification');
  const [datasetId, setDatasetId] = useState('');
  const [storagePath, setStoragePath] = useState('');
  const [nTrials, setNTrials] = useState(15);
  const [runs, setRuns] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<any>(null);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const [previewLimit, setPreviewLimit] = useState<number>(15);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'PASSWORD_RECOVERY') {
        window.location.href = '/dashboard/profile?recovery=true';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user historical runs when session is active
  useEffect(() => {
    if (session) {
      supabase.from('runs').select('*').order('created_at', { ascending: false }).then(({ data, error }: any) => {
        if (!error && data) {
          // Map DB columns to our frontend state format
          const formattedRuns = data.map((r: any) => ({
            id: r.id,
            status: r.status,
            dataset: r.dataset_id, // Would need to join datasets table to get actual filename, but keep simple for now
            score: r.best_value ? r.best_value.toFixed(4) : '-',
            type: r.problem_type,
            error: r.error,
            params: r.best_params ? JSON.stringify(r.best_params) : ''
          }));
          setRuns(formattedRuns);
        }
      });
    } else {
      setRuns([]);
    }
  }, [session]);

  return (
    <GlobalStateContext.Provider
      value={{
        file, setFile,
        columns, setColumns,
        previewData, setPreviewData,
        targetColumn, setTargetColumn,
        problemType, setProblemType,
        datasetId, setDatasetId,
        storagePath, setStoragePath,
        nTrials, setNTrials,
        runs, setRuns,
        chartData, setChartData,
        activeRunId, setActiveRunId,
        activeRun, setActiveRun,
        isChartFullscreen, setIsChartFullscreen,
        previewLimit, setPreviewLimit,
        isSidebarCollapsed, setIsSidebarCollapsed,
        session
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}
