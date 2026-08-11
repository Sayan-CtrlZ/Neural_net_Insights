'use client';
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, UploadCloud, Radar, Zap, Award, AlertCircle, Loader2, Maximize2, X, PanelLeftClose, PanelRightClose, PanelLeft, PanelRight, ChevronLeft, ChevronRight, Table, Activity, CheckCircle2, Database, Trash2, BrainCircuit } from 'lucide-react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle, PanelImperativeHandle } from "react-resizable-panels";
import { useGlobalState } from './GlobalStateContext';
import { supabase } from '../../lib/supabaseClient';

export default function Dashboard() {
  const {
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
  } = useGlobalState();

  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const leftPanelRef = React.useRef<PanelImperativeHandle>(null);
  const rightPanelRef = React.useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    if (file) {
      Papa.parse(file, {
        header: true,
        preview: previewLimit === 0 ? undefined : previewLimit,
        complete: (results) => {
          setPreviewData(results.data);
        }
      });
    }
  }, [previewLimit, file]);

  const modelMap: Record<string, string> = {
    'linreg': 'Linear Regression',
    'logreg': 'Logistic Regression',
    'rf': 'Random Forest',
    'xgb': 'XGBoost',
    'Unknown': 'Unknown'
  };

  const modelColorMap: Record<string, string> = {
    'linreg': '#1D4ED8',
    'logreg': '#1D4ED8',
    'rf': '#047857',
    'xgb': '#C2410C',
    'Unknown': '#475569'
  };

  const modelLeaderboard = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const modelScores: Record<string, number> = {};
    chartData.forEach(t => {
      if (t.value !== null && t.model) {
        if (!modelScores[t.model] || t.value > modelScores[t.model]) {
          modelScores[t.model] = t.value;
        }
      }
    });
    return Object.entries(modelScores)
      .map(([model, score]) => ({ model, score }))
      .sort((a, b) => b.score - a.score);
  }, [chartData]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
          const res = await fetch(`${API_URL}/datasets/upload`, { 
            method: 'POST', 
            body: formData,
            headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
          });
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

    const res = await fetch(`${API_URL}/optimize`, { 
      method: 'POST', 
      body: formData,
      headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
    });
    const data = await res.json();
    const runObj = { id: data.run_id, status: 'running', dataset: file?.name, score: '-', error: null, params: '' };
    setActiveRun(runObj);
    setActiveRunId(data.run_id);
    pollStatus(data.run_id, runObj);
  };

  const pollStatus = async (runId: string, initialRunObj: any) => {
    let currentRunState = { ...initialRunObj };
    
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/optimize/${runId}/status`, {
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
        const data = await res.json();

        currentRunState = {
          ...currentRunState,
          status: data.status,
          score: data.best_value ? data.best_value.toFixed(4) : '-',
          params: data.best_params ? JSON.stringify(data.best_params) : '',
          error: data.error
        };

        setActiveRun(currentRunState);

        const histRes = await fetch(`${API_URL}/optimize/${runId}/history`, {
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
        const histData = await histRes.json();
        if (histData.trials && histData.trials.length > 0) setChartData(histData.trials);

        if (data.status === 'completed' || data.status === 'failed') {
          setRuns(prev => {
            if (prev.some(r => r.id === currentRunState.id)) return prev;
            return [currentRunState, ...prev];
          });
          setActiveRun(null);
          return; // Stop polling
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
      
      setTimeout(checkStatus, 3000);
    };

    setTimeout(checkStatus, 3000);
  };

  const loadRunIntoWorkspace = async (run: any) => {
    setActiveRunId(run.id);
    setActiveRun(run);
    
    try {
      const histRes = await fetch(`${API_URL}/optimize/${run.id}/history`, {
        headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      });
      const histData = await histRes.json();
      if (histData.trials && histData.trials.length > 0) {
        setChartData(histData.trials);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error("Failed to load run history:", err);
      setChartData([]);
    }
  };

  if (!isMounted) {
    return <div className="h-full w-full bg-white dark:bg-[#121212] flex items-center justify-center text-slate-400 dark:text-slate-400 dark:text-slate-500">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#121212] text-black font-sans">
      {/* Top Application Bar */}
      <div className="h-12 border-b border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded text-slate-500 dark:text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-200 transition-colors"
            title="Toggle Left Sidebar"
          >
            <PanelLeft size={18} />
          </button>
          <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-slate-100 ml-2 border-l border-slate-300 pl-4">
            <div className="w-7 h-7 shrink-0 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20 shadow-md flex items-center justify-center text-white">
              <BrainCircuit size={14} />
            </div>
            Neural Net Insights
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-500 border-r border-slate-300 pr-4">
            <span className="flex items-center gap-1.5"><Table size={14} /> Dataset Preview</span>
          </div>
          <button 
            onClick={() => {
              const panel = rightPanelRef.current;
              if (panel) panel.isCollapsed() ? panel.expand() : panel.collapse();
            }}
            className="p-1.5 rounded text-slate-500 dark:text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-200 transition-colors"
            title="Toggle Data Preview"
          >
            <PanelRight size={18} />
          </button>
        </div>
      </div>

      <PanelGroup orientation="horizontal" className="flex-1">

        {/* Left Pane: Config and Status */}
        <Panel panelRef={leftPanelRef} collapsible={true} collapsedSize={0} defaultSize={65} minSize={40} className="h-full flex flex-col overflow-y-auto custom-scrollbar">

          <header className="px-8 py-6 border-b border-slate-200 dark:border-[#333333] flex justify-between items-end bg-[#FAFAFA] dark:bg-[#121212] shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900 dark:text-slate-100">Optuna Engine</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500">Configure parameters and monitor telemetry.</p>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* Configuration Module */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#333333] rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-100/90 to-blue-50/60 dark:from-indigo-900/40 dark:to-blue-900/20 px-5 py-3 flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900/50">
              <HardDrive size={16} className="text-indigo-700" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Data Ingestion</h2>
            </div>

            {activeRun && activeRun.status === 'running' ? (
              <div className="p-8 h-[360px] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1a1a1a]">
                <div className="relative mb-6">
                   <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/50 border-t-indigo-600 rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Zap size={20} className="text-indigo-600 animate-pulse" />
                   </div>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">Optimization in Progress</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 font-mono mt-2">RUN_ID: {activeRun.id.split('-')[0]}</p>
                
                {activeRun.score !== '-' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 px-6 py-3 border border-slate-200 dark:border-[#333333] bg-white dark:bg-[#121212] shadow-sm rounded-xl flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Current Best</span>
                    <span className="text-indigo-600 font-mono font-bold text-xl">{activeRun.score}</span>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Upload Source</label>
                <label className="relative border-2 border-dashed border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1a1a1a] rounded-xl flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 dark:bg-indigo-900/20 transition-all cursor-pointer group h-24">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  <AnimatePresence mode="wait">
                    {isUploading ? (
                      <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-indigo-600" size={18} />
                        <span className="text-sm font-medium text-slate-600">Parsing...</span>
                      </motion.div>
                    ) : file ? (
                      <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <CheckCircle2 className="text-indigo-600" size={18} />
                        <span className="text-sm font-medium text-indigo-700 truncate max-w-[150px]">{file.name}</span>
                      </motion.div>
                    ) : (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600">
                        <UploadCloud size={18} />
                        <span className="text-sm font-medium">Select CSV</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-2.5">
                  <h3 className="text-[10px] font-bold text-indigo-900/60 dark:text-indigo-200/80 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity size={12}/> Enterprise Pipeline Active</h3>
                  <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                    <p><strong className="text-slate-900 dark:text-slate-100">Algorithm Search:</strong> Automatically evaluating Logistic Regression, Random Forest, and XGBoost.</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                    <p><strong className="text-slate-900 dark:text-slate-100">Native Preprocessing:</strong> Automatic imputation, scaling, and OHE handled at ingestion.</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                    <p><strong className="text-slate-900 dark:text-slate-100">Bayesian Optimization:</strong> TPE (Tree-structured Parzen Estimator) navigating hyperparameters.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Target Variable</label>
                  <select value={targetColumn} onChange={e => setTargetColumn(e.target.value)} disabled={columns.length === 0}
                    className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#333333] p-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:bg-[#121212] disabled:bg-slate-50 dark:disabled:bg-[#1a1a1a] transition-all">
                    <option value="">Select Target Column</option>
                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Problem Domain</label>
                  <div className="flex p-1 bg-slate-100 dark:bg-[#222222] rounded-xl">
                    <button onClick={() => setProblemType('classification')} className={`flex-1 p-2 rounded-lg text-sm font-semibold transition-all ${problemType === 'classification' ? 'bg-white dark:bg-[#121212] text-indigo-700 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200'}`}>
                      Classification
                    </button>
                    <button onClick={() => setProblemType('regression')} className={`flex-1 p-2 rounded-lg text-sm font-semibold transition-all ${problemType === 'regression' ? 'bg-white dark:bg-[#121212] text-indigo-700 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200'}`}>
                      Regression
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Optimization Trials</label>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md">{nTrials}</span>
                  </div>
                  <input
                    type="range"
                    min="1" max="50" step="1"
                    value={nTrials}
                    onChange={e => setNTrials(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-indigo-600"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Higher trials yield better accuracy but increase execution time.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 pb-6 flex justify-center">
              <button
                onClick={startRun}
                disabled={datasetId === '' || targetColumn === ''}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Zap size={18} /> Start Model Optimization
              </button>
            </div>
            </>
            )}
          </div>

          {/* Visualization Module */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#333333] rounded-2xl shadow-sm overflow-hidden relative">
            <div className="bg-gradient-to-r from-violet-100/90 to-fuchsia-50/60 dark:from-violet-900/40 dark:to-fuchsia-900/20 px-5 py-3 flex items-center justify-between border-b border-violet-100/50 dark:border-violet-900/50">
              <div className="flex items-center gap-2">
                <Radar size={16} className="text-violet-700" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Telemetry</h2>
              </div>
              <button 
                onClick={() => setIsChartFullscreen(true)}
                className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-colors p-1"
                title="View Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="flex flex-col lg:flex-row border-b border-gray-100 min-h-[350px]">
              <div className="flex-1 p-6 relative bg-white dark:bg-[#121212] border-r border-slate-100 dark:border-[#2a2a2a] flex flex-col justify-center">
                {chartData.length === 0 ? (
                  <div className="flex flex-col items-center text-gray-400 gap-2 font-mono text-sm">
                    <Activity size={24} className="opacity-50" />
                    <p>AWAITING_DATA</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-500 mb-2 px-4 shrink-0">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#1D4ED8]"></span> Linear/Logistic</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#047857]"></span> Random Forest</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#C2410C]"></span> XGBoost</div>
                    </div>
                    <div className="w-full flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                      <div style={{ minWidth: `${Math.max(100, chartData.length * 6)}%`, height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="number" 
                            tick={{ fontSize: 12, fill: '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'TRIAL NUMBER', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }}
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            tickCount={10}
                            tick={{ fontSize: 12, fill: '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'SCORE', angle: -90, position: 'insideLeft', offset: -10, fontSize: 10, fontWeight: 'bold', fill: '#6B7280' }}
                          />
                          <Tooltip
                            content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-[#121212] border border-slate-100 dark:border-[#2a2a2a] p-3 rounded-xl shadow-lg">
                                    <p className="font-bold text-[10px] text-slate-500 dark:text-slate-500 mb-1">Trial {label}</p>
                                    <p className="text-slate-800 dark:text-slate-100 font-bold text-sm mb-1">{modelMap[data.model] || data.model}</p>
                                    <p className="text-indigo-600 font-mono font-bold text-xs">Score: {Number(data.value).toFixed(4)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#94A3B8"
                            strokeWidth={2}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              const fill = modelColorMap[payload.model] || modelColorMap['Unknown'];
                              return <circle key={`dot-${payload.number}`} cx={cx} cy={cy} r={4} fill={fill} stroke="#fff" strokeWidth={1.5} />;
                            }}
                            activeDot={(props: any) => {
                              const { cx, cy, payload } = props;
                              const fill = modelColorMap[payload.model] || modelColorMap['Unknown'];
                              return <circle key={`active-dot-${payload.number}`} cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />;
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                )}
              </div>
              
              {/* Leaderboard Panel */}
              <div className="w-full lg:w-72 bg-slate-50 dark:bg-[#1a1a1a] flex flex-col border-t lg:border-t-0 border-slate-100 dark:border-[#2a2a2a] overflow-hidden shrink-0">
                <div className="p-4 border-b border-slate-100 dark:border-[#2a2a2a] bg-white dark:bg-[#121212]">
                  <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Activity size={12}/> Model Leaderboard</h3>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-xs font-mono">NO_MODELS</div>
                  ) : (
                    <>
                      {modelLeaderboard.map((item, index) => (
                        <div key={item.model} className={`p-3 rounded-xl border ${index === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200' : 'bg-white dark:bg-[#121212] border-slate-200 dark:border-[#333333] shadow-sm'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-[#222222] text-slate-500 dark:text-slate-400 dark:text-slate-500'}`}>
                              #{index + 1}
                            </div>
                            <span className={`font-bold text-xs ${index === 0 ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}>
                              {modelMap[item.model] || item.model}
                            </span>
                          </div>
                          <p className={`text-[10px] font-mono pl-7 ${index === 0 ? 'text-indigo-600 dark:text-indigo-300 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            Score: {item.score.toFixed(4)}
                          </p>
                        </div>
                      ))}
                      
                      {modelLeaderboard.length > 0 && (
                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200/80 text-[10px] leading-relaxed">
                          <strong className="block mb-1 text-emerald-900 dark:text-emerald-300">Recommendation:</strong> 
                          The <strong>{modelMap[modelLeaderboard[0].model] || modelLeaderboard[0].model}</strong> architecture achieved the highest score. Use its exact hyperparameters from the registry below for production deployment.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
              {activeRun && (
                <div className="border-t border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a]/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                        <Activity size={16} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 font-bold mb-0.5">CURRENT RUN</div>
                        <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{activeRun.id}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500 font-bold mb-0.5 uppercase">Dataset</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{activeRun.dataset}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500 font-bold mb-0.5 uppercase">Score</div>
                        <div className="text-xs font-mono font-bold text-indigo-600">{activeRun.score || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-500 font-bold mb-0.5 uppercase">Status</div>
                        <div>
                          {activeRun.status === 'running' ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 text-xs border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/20 rounded-full px-2 py-0.5">
                              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
                              Running
                            </span>
                          ) : activeRun.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-full px-2 py-0.5 text-xs" title={activeRun.error}>
                              <AlertCircle size={10} /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-full px-2 py-0.5 text-xs">
                              <CheckCircle2 size={10} /> Done
                            </span>
                          )}
                        </div>
                      </div>
                      {activeRun.error && (
                        <div className="text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/50 max-w-[300px] truncate font-semibold" title={activeRun.error}>
                          Error: {activeRun.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

        </div>
      </Panel>

      {/* Resize Handle */}
      <PanelResizeHandle className="w-1.5 bg-slate-200 hover:bg-indigo-500 cursor-col-resize transition-colors shrink-0 z-10" />

      {/* Right Pane: Data Preview */}
      <Panel panelRef={rightPanelRef} collapsible={true} collapsedSize={0} defaultSize={35} minSize={20} className="h-full bg-white dark:bg-[#121212] flex flex-col border-l border-slate-200 dark:border-[#333333]">
        <header className="px-6 py-4 border-b border-slate-200 dark:border-[#333333] flex justify-between items-center bg-slate-50 dark:bg-[#1a1a1a] shrink-0">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Table size={16} className="text-indigo-600" />
              Data Preview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Rows:</label>
            <select 
              value={previewLimit} 
              onChange={(e) => setPreviewLimit(Number(e.target.value))}
              className="bg-white dark:bg-[#121212] border border-slate-300 text-xs font-bold text-slate-700 dark:text-slate-200 rounded p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={100}>100</option>
              <option value={0}>All</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-white dark:bg-[#121212]">
          {previewData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3 font-mono text-sm">
              <Database size={24} className="opacity-50 text-slate-300" />
              <p>NO_DATA_MOUNTED</p>
            </div>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-xs text-left border-separate border-spacing-0">
                <thead className="bg-slate-100 dark:bg-[#222222] text-slate-600 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-3 py-2 border-r border-b border-slate-300 w-12 text-center font-bold sticky left-0 z-30 bg-slate-200">#</th>
                    {columns.map(col => (
                      <th key={col} className="px-4 py-2 border-r border-b border-slate-300 font-bold whitespace-nowrap bg-slate-100 dark:bg-[#222222]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-700 dark:text-slate-200">
                  {previewData.map((row, i) => (
                    <tr key={i} className="hover:bg-indigo-50 dark:bg-indigo-900/20 transition-colors group">
                      <td className="px-3 py-1.5 border-r border-b border-slate-300 text-slate-500 dark:text-slate-500 text-center bg-slate-100 dark:bg-[#222222] font-bold sticky left-0 z-10 group-hover:bg-indigo-100 group-hover:text-indigo-800 transition-colors">
                        {i + 1}
                      </td>
                      {columns.map(col => (
                        <td key={col} className="px-4 py-1.5 border-r border-b border-slate-200 dark:border-[#333333] whitespace-nowrap bg-white dark:bg-[#121212] group-hover:bg-indigo-50 dark:bg-indigo-900/20/50 transition-colors">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      {/* Fullscreen Chart Modal */}
      <AnimatePresence>
        {isChartFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#121212] w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-[#333333]"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2a2a2a] flex items-center justify-between bg-slate-50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Telemetry: Fullscreen View</h2>
                </div>
                <button 
                  onClick={() => setIsChartFullscreen(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors p-1 bg-white dark:bg-[#121212] rounded-full border border-slate-200 dark:border-[#333333] shadow-sm hover:shadow-md"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-8 bg-white dark:bg-[#121212] relative">
                {chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3 font-mono text-sm">
                    <Activity size={32} className="opacity-50" />
                    <p>AWAITING_DATA</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-500 mb-4 shrink-0">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span> Linear/Logistic Regression</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#047857]"></span> Random Forest</div>
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C2410C]"></span> XGBoost</div>
                    </div>
                    <div className="w-full flex-1 overflow-hidden">
                      <div style={{ width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="number" 
                            tick={{ fontSize: 14, fill: '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'TRIAL NUMBER', position: 'insideBottom', offset: -15, fontSize: 12, fontWeight: 'bold', fill: '#6B7280' }}
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            tickCount={15}
                            tick={{ fontSize: 12, fill: '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'SCORE', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12, fontWeight: 'bold', fill: '#6B7280' }}
                          />
                          <Tooltip
                            content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-[#121212] border border-slate-100 dark:border-[#2a2a2a] p-4 rounded-xl shadow-xl">
                                    <p className="font-bold text-xs text-slate-500 dark:text-slate-500 mb-2">Trial {label}</p>
                                    <p className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-1">{modelMap[data.model] || data.model}</p>
                                    <p className="text-indigo-600 font-mono font-bold text-sm">Score: {Number(data.value).toFixed(4)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#94A3B8"
                            strokeWidth={3}
                            dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              const fill = modelColorMap[payload.model] || modelColorMap['Unknown'];
                              return <circle key={`fs-dot-${payload.number}`} cx={cx} cy={cy} r={5} fill={fill} stroke="#fff" strokeWidth={2} />;
                            }}
                            activeDot={(props: any) => {
                              const { cx, cy, payload } = props;
                              const fill = modelColorMap[payload.model] || modelColorMap['Unknown'];
                              return <circle key={`fs-active-dot-${payload.number}`} cx={cx} cy={cy} r={8} fill={fill} stroke="#fff" strokeWidth={3} />;
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </PanelGroup>
    </div>
  );
}
