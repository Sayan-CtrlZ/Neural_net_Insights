'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Clock, Zap, History, Trash2, Database, Play } from 'lucide-react';
import { useGlobalState } from '../GlobalStateContext';
import { supabase } from '../../../lib/supabaseClient';

export default function HistoryPage() {
  const { runs, setRuns, setActiveRunId, setActiveRun, setChartData, activeRunId, session } = useGlobalState();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const deleteRun = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('runs').delete().eq('id', runId);
      if (!error) {
        setRuns(prev => prev.filter(r => r.id !== runId));
        if (activeRunId === runId) {
          setActiveRun(null);
          setActiveRunId(null);
          setChartData([]);
        }
      } else {
        console.error("Delete error:", error);
      }
    } catch (err) {
      console.error("Failed to delete run:", err);
    }
  };

  const loadRunIntoWorkspace = (run: any) => {
    setChartData([]);
    setActiveRunId(run.id);
    setActiveRun(run);
    router.push('/dashboard');
  };

  return (
    <div className="h-full w-full bg-white dark:bg-[#121212] text-black font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-100 dark:border-white/20 flex justify-between items-end bg-white dark:bg-[#121212] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900 dark:text-white">Telemetry History</h1>
          <p className="text-sm text-slate-500 dark:text-white/60">View past optimization runs and load them into your workspace.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-slate-50 dark:bg-[#1a1a1a]">
        <div className="border border-slate-100 dark:border-white/20 bg-white dark:bg-[#121212] shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-slate-50 dark:bg-[#1a1a1a] px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/20">
            <div className="flex items-center gap-2">
              <History size={16} className="text-indigo-600"/>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Historical Runs</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500 dark:text-white/40 bg-white dark:bg-[#121212] px-2 py-1 rounded-md border border-slate-100 dark:border-white/20">
              {runs.length} RUNS
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {runs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-white/40 gap-3 font-mono text-sm">
                <Database size={32} className="opacity-50 text-slate-300" />
                <p>NO_HISTORY_FOUND</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-100 dark:border-white/20 text-xs font-semibold text-slate-500 dark:text-white/60">
                  <tr>
                    <th className="px-5 py-3 border-r border-slate-100 dark:border-white/20 font-semibold">Run ID</th>
                    <th className="px-5 py-3 border-r border-slate-100 dark:border-white/20 font-semibold">Type</th>
                    <th className="px-5 py-3 border-r border-slate-100 dark:border-white/20 font-semibold">Status</th>
                    <th className="px-5 py-3 border-r border-slate-100 dark:border-white/20 font-semibold text-right">Best Score</th>
                    <th className="px-5 py-3 border-r border-slate-100 dark:border-white/20 font-semibold text-right">Duration</th>
                    <th className="px-5 py-3 font-semibold text-center w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
                  {runs.map((run, i) => (
                    <tr key={run.id} className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors group">
                      <td className="px-5 py-4 border-r border-slate-100 dark:border-white/20 font-mono text-xs font-bold text-slate-700 dark:text-white/80 flex items-center gap-2">
                        <Activity size={14} className="text-indigo-500" />
                        {run.id}
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100 dark:border-white/20">
                        <span className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">{run.type}</span>
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100 dark:border-white/20">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          run.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 
                          run.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 text-red-700' : 'bg-indigo-50 dark:bg-white/10 text-indigo-700'
                        }`}>
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100 dark:border-white/20 text-right font-mono font-bold text-slate-700 dark:text-white/80">
                        {run.score}
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100 dark:border-white/20 text-right font-mono text-slate-500 dark:text-white/40 flex items-center justify-end gap-1.5">
                        <Clock size={12} className="text-slate-400 dark:text-white/60" />
                        {run.time}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {run.status === 'completed' && (
                            <button 
                              onClick={() => loadRunIntoWorkspace(run)}
                              className="p-1.5 bg-indigo-50 dark:bg-white/10 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition-colors"
                              title="Load in Workspace"
                            >
                              <Play size={14} className="fill-current" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => deleteRun(e, run.id)}
                            className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
                            title="Delete Run"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
