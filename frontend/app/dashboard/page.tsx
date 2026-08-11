'use client';
import React, { useState } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, UploadCloud, Activity, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [problemType, setProblemType] = useState('classification');
  const [datasetId, setDatasetId] = useState('');
  const [storagePath, setStoragePath] = useState('');
  const [nTrials, setNTrials] = useState(15);
  const [isUploading, setIsUploading] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  const API_URL = 'http://localhost:8000/api';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setIsUploading(true);

    Papa.parse(selectedFile, {
      header: true,
      preview: 15,
      complete: async (results) => {
        if (results.meta.fields) setColumns(results.meta.fields);
        setPreviewData(results.data);

        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const res = await fetch(`${API_URL}/datasets/upload`, { method: 'POST', body: formData });
          const data = await res.json();
          setDatasetId(data.dataset_id);
          setStoragePath(data.storage_path);
        } catch (err) {
          console.error(err);
          alert('Upload failed. Is the backend running?');
        } finally {
          setIsUploading(false);
        }
      }
    });
  };

  const startRun = async () => {
    if (!datasetId || !targetColumn) return;

    // PRE-FLIGHT VALIDATION
    if (previewData.length > 0) {
      const isContinuous = previewData.some(row => {
        const val = row[targetColumn];
        if (val === undefined || val === null || val.trim() === '') return false;
        const num = Number(val);
        return !isNaN(num) && !Number.isInteger(num);
      });

      const isCategoricalStr = previewData.some(row => {
        const val = row[targetColumn];
        if (val === undefined || val === null || val.trim() === '') return false;
        return isNaN(Number(val));
      });

      if (problemType === 'classification' && isContinuous) {
        alert("Validation Error: The target column contains continuous numerical data (decimals).\n\nClassification requires discrete categories (like classes or 0/1). Please change the Problem Domain to 'Regression'.");
        return;
      }

      if (problemType === 'regression' && isCategoricalStr) {
        alert("Validation Error: The target column contains text/categorical data.\n\nRegression requires numerical data to predict. Please change the Problem Domain to 'Classification'.");
        return;
      }
    }

    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('problem_type', problemType);
    formData.append('target_column', targetColumn);
    formData.append('storage_path', storagePath);
    formData.append('n_trials', nTrials.toString());

    const res = await fetch(`${API_URL}/optimize`, { method: 'POST', body: formData });
    const data = await res.json();
    setRuns([{ id: data.run_id, status: 'running', dataset: file?.name, score: '-', error: null }, ...runs]);
    setActiveRunId(data.run_id);
    pollStatus(data.run_id);
  };

  const pollStatus = async (runId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/optimize/${runId}/status`);
      const data = await res.json();

      setRuns(current => current.map(r => {
        if (r.id === runId) {
          return {
            ...r,
            status: data.status,
            score: data.best_value ? data.best_value.toFixed(4) : '-',
            params: data.best_params ? JSON.stringify(data.best_params) : '',
            error: data.error
          };
        }
        return r;
      }));

      if (activeRunId === runId || !activeRunId) {
        const histRes = await fetch(`${API_URL}/optimize/${runId}/history`);
        const histData = await histRes.json();
        if (histData.trials && histData.trials.length > 0) setChartData(histData.trials);
      }

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval);
      }
    }, 3000);
  };

  return (
    <PanelGroup orientation="horizontal" className="h-full w-full bg-white text-black font-sans">

      {/* Left Pane: Config and Status */}
      <Panel defaultSize={65} minSize={40} className="h-full flex flex-col overflow-y-auto custom-scrollbar">

        <header className="px-8 py-6 border-b border-slate-200 flex justify-between items-end bg-[#FAFAFA] shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900">Optuna Engine</h1>
            <p className="text-sm text-slate-500">Configure parameters and monitor telemetry.</p>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* Configuration Module */}
          <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white px-4 py-2 flex items-center gap-2">
              <Database size={14} />
              <h2 className="text-xs font-bold uppercase tracking-wider">Module 01: Ingestion</h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Upload Source</label>
                <label className="relative border-2 border-dashed border-gray-300 bg-[#FAFAFA] flex flex-col items-center justify-center hover:border-black transition-colors cursor-pointer group h-24">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  <AnimatePresence mode="wait">
                    {isUploading ? (
                      <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-black" size={18} />
                        <span className="text-sm font-semibold">Parsing...</span>
                      </motion.div>
                    ) : file ? (
                      <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <CheckCircle2 className="text-black" size={18} />
                        <span className="text-sm font-semibold truncate max-w-[150px]">{file.name}</span>
                      </motion.div>
                    ) : (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-gray-500 group-hover:text-black">
                        <UploadCloud size={18} />
                        <span className="text-sm font-semibold">Select CSV</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Target Variable</label>
                  <select value={targetColumn} onChange={e => setTargetColumn(e.target.value)} disabled={columns.length === 0}
                    className="w-full bg-white border border-gray-300 p-2.5 text-sm font-medium focus:outline-none focus:border-black focus:ring-1 focus:ring-black rounded-none disabled:opacity-50 disabled:bg-gray-50">
                    <option value="">[ Select Column ]</option>
                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Domain</label>
                  <div className="flex border border-gray-300">
                    <button onClick={() => setProblemType('classification')} className={`flex-1 p-2 text-sm font-semibold transition-colors ${problemType === 'classification' ? 'bg-black text-white' : 'bg-[#FAFAFA] text-gray-500 hover:text-black'}`}>
                      CLASS
                    </button>
                    <div className="w-px bg-gray-300"></div>
                    <button onClick={() => setProblemType('regression')} className={`flex-1 p-2 text-sm font-semibold transition-colors ${problemType === 'regression' ? 'bg-black text-white' : 'bg-[#FAFAFA] text-gray-500 hover:text-black'}`}>
                      REGRESS
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase">Optimization Trials</label>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 border border-gray-300">{nTrials}</span>
                  </div>
                  <input
                    type="range"
                    min="1" max="50" step="1"
                    value={nTrials}
                    onChange={e => setNTrials(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-black"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 uppercase">Higher = Better accuracy, Slower execution</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-black bg-[#FAFAFA] flex justify-end">
              <button
                onClick={startRun}
                disabled={datasetId === '' || targetColumn === ''}
                className="bg-black text-white px-6 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(200,200,200,1)] disabled:shadow-none"
              >
                <Zap size={14} /> INITIALIZE RUN
              </button>
            </div>
          </div>

          {/* Visualization Module */}
          <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white px-4 py-2 flex items-center gap-2">
              <Activity size={14} />
              <h2 className="text-xs font-bold uppercase tracking-wider">Module 02: Telemetry</h2>
            </div>
            <div className="p-6 h-[350px] bg-white flex flex-col items-center justify-center relative border-b border-gray-100">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center text-gray-400 gap-2 font-mono text-sm">
                  <Activity size={24} className="opacity-50" />
                  <p>AWAITING_DATA</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="number" tick={{ fontSize: 12, fill: '#000', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#000', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#4F46E5' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#4F46E5', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#fff', stroke: '#4F46E5', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Logs Module */}
          <div className="border border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white px-4 py-2 flex items-center gap-2">
              <Database size={14} />
              <h2 className="text-xs font-bold uppercase tracking-wider">Module 03: Registry</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-[#FAFAFA] border-b border-black text-xs font-bold uppercase">
                  <tr>
                    <th className="px-5 py-3 border-r border-gray-200">Dataset</th>
                    <th className="px-5 py-3 border-r border-gray-200">Status</th>
                    <th className="px-5 py-3 border-r border-gray-200">R² / Accuracy</th>
                    <th className="px-5 py-3">Architecture & Hyperparams</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {runs.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-500 font-mono text-xs">NO_ENTRIES</td></tr>
                    ) : runs.map((run, i) => (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={run.id || i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 border-r border-gray-200 font-medium">
                          {run.dataset}
                          {run.error && (
                            <div className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={run.error}>
                              ERR: {run.error}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 border-r border-gray-200">
                          {run.status === 'running' ? (
                            <span className="inline-flex items-center gap-2 font-bold text-black text-xs border border-black px-2 py-0.5">
                              <span className="w-1.5 h-1.5 bg-black animate-pulse"></span>
                              RUNNING
                            </span>
                          ) : run.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-white bg-black px-2 py-0.5 text-xs" title={run.error}>
                              <AlertCircle size={10} /> FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-600 bg-gray-100 px-2 py-0.5 text-xs border border-gray-300">
                              <CheckCircle2 size={10} /> DONE
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 border-r border-gray-200 font-mono font-bold text-blue-600">{run.score}</td>
                        <td className="px-5 py-3 text-xs text-gray-600 font-mono">
                          {(() => {
                            if (!run.params) return '-';
                            try {
                              const p = JSON.parse(run.params);
                              const modelMap: Record<string, string> = {
                                'linreg': 'Linear Regression',
                                'logreg': 'Logistic Regression',
                                'rf': 'Random Forest',
                                'xgb': 'XGBoost'
                              };
                              const name = modelMap[p.model] || p.model;
                              const others = Object.entries(p).filter(([k]) => k !== 'model').map(([k, v]) => `${k}=${typeof v === 'number' ? v.toPrecision(3) : v}`).join(', ');
                              return (
                                <div>
                                  <span className="font-bold text-black block">{name}</span>
                                  {others && <span className="text-[10px] text-gray-500 truncate max-w-[250px] block">{others}</span>}
                                </div>
                              );
                            } catch { return run.params; }
                          })()}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </Panel>

      {/* Resize Handle */}
      <PanelResizeHandle className="w-1.5 bg-black hover:bg-blue-600 cursor-col-resize transition-colors shrink-0 z-10" />

      {/* Right Pane: Data Preview */}
      <Panel defaultSize={35} minSize={20} className="h-full bg-white flex flex-col">
        <header className="px-6 py-6 border-b border-black flex justify-between items-end bg-[#FAFAFA] shrink-0">
          <div>
            <h1 className="text-lg font-bold tracking-tight mb-1">Data Preview</h1>
            <p className="text-xs text-gray-500 font-mono">HEAD -n 15</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-white custom-scrollbar p-4">
          {previewData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 font-mono text-sm">
              <Database size={24} className="opacity-50" />
              <p>NO_DATA_MOUNTED</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse border border-black">
              <thead className="bg-[#FAFAFA] border-b border-black">
                <tr>
                  <th className="px-3 py-2 border-r border-black w-10 text-center font-bold">#</th>
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2 border-r border-black font-bold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono">
                {previewData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-r border-black text-gray-400 text-center bg-[#FAFAFA]">{i + 1}</td>
                    {columns.map(col => (
                      <td key={col} className="px-3 py-2 border-r border-gray-200 whitespace-nowrap truncate max-w-[150px]">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>

    </PanelGroup>
  );
}
