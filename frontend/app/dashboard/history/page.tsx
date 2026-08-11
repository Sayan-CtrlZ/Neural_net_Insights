'use client';
import React from 'react';
import { Activity, Clock, Zap, History, Trash2, Database } from 'lucide-react';
import { useGlobalState } from '../GlobalStateContext';

export default function HistoryPage() {
  const { runs } = useGlobalState();

  return (
    <div className="h-full w-full bg-white text-black font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-end bg-white shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900">Telemetry History</h1>
          <p className="text-sm text-slate-500">View past optimization runs and their best parameters.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-slate-50">
        <div className="border border-slate-100 bg-white shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History size={16} className="text-indigo-600"/>
              <h2 className="text-sm font-bold text-slate-800">Historical Runs</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100">
              {runs.length} RUNS
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {runs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 font-mono text-sm">
                <Database size={32} className="opacity-50 text-slate-300" />
                <p>NO_HISTORY_FOUND</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-5 py-3 border-r border-slate-100 font-semibold">Run ID</th>
                    <th className="px-5 py-3 border-r border-slate-100 font-semibold">Type</th>
                    <th className="px-5 py-3 border-r border-slate-100 font-semibold">Status</th>
                    <th className="px-5 py-3 border-r border-slate-100 font-semibold text-right">Best Score</th>
                    <th className="px-5 py-3 border-r border-slate-100 font-semibold text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((run, i) => (
                    <tr key={run.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 border-r border-slate-100 font-mono text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Activity size={14} className="text-indigo-500" />
                        {run.id}
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{run.type}</span>
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          run.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
                          run.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {run.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100 text-right font-mono font-bold text-slate-700">
                        {run.score}
                      </td>
                      <td className="px-5 py-4 border-r border-slate-100 text-right font-mono text-slate-500 flex items-center justify-end gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {run.time}
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
