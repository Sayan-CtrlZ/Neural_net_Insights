'use client';
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { HardDrive, UploadCloud, Radar, Zap, Award, AlertCircle, Loader2, Maximize2, X, XCircle, PanelLeftClose, PanelRightClose, PanelLeft, PanelRight, ChevronLeft, ChevronRight, Table, Activity, CheckCircle2, Database, Trash2, BrainCircuit, PlusCircle, Save, Download } from 'lucide-react';
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const [headerHeight, setHeaderHeight] = useState<number>(32);

  const handleColResizeStart = (e: React.MouseEvent, colName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colName] || (colName === '__index' ? 50 : 120);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      setColWidths((prev: Record<string, number>) => ({
        ...prev,
        [colName]: Math.max(colName === '__index' ? 35 : 50, startWidth + dx)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRowResizeStart = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = rowHeights[rowIndex] || 28;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dy = moveEvent.clientY - startY;
      setRowHeights((prev: Record<number, number>) => ({
        ...prev,
        [rowIndex]: Math.max(20, startHeight + dy)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleHeaderRowResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = headerHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dy = moveEvent.clientY - startY;
      setHeaderHeight(Math.max(24, startHeight + dy));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const totalTableWidth = React.useMemo(() => {
    const idxWidth = colWidths['__index'] || 50;
    const colsWidth = columns.reduce((acc, col) => acc + (colWidths[col] || 120), 0);
    return idxWidth + colsWidth;
  }, [columns, colWidths]);

  const leftPanelRef = React.useRef<PanelImperativeHandle>(null);
  const rightPanelRef = React.useRef<PanelImperativeHandle>(null);
  const pollingActiveRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (file && (typeof File !== 'undefined' && file instanceof File)) {
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Send heartbeat pings while optimization is running
  useEffect(() => {
    if (!activeRun?.id || activeRun.id === 'Starting...' || activeRun.status !== 'running') {
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_URL}/optimize/${activeRun.id}/heartbeat`, {
          method: 'POST',
          headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
        });
      } catch (err) {
        console.error("Heartbeat ping failed:", err);
      }
    };

    // Send immediately
    sendHeartbeat();

    // Set interval to send every 3 seconds
    const interval = setInterval(sendHeartbeat, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [activeRun?.id, activeRun?.status, API_URL, session]);

  // Resume polling on mount if an optimization run is currently running
  useEffect(() => {
    if (activeRun && activeRun.id && activeRun.id !== 'Starting...' && activeRun.status === 'running') {
      pollStatus(activeRun.id, activeRun);
    }
  }, [activeRun?.id, activeRun?.status]);

  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [isTelemetryLoading, setIsTelemetryLoading] = useState(false);

  useEffect(() => {
    const fetchRunHistoryAndDataset = async () => {
      if (!activeRun?.id || activeRun.id === 'Starting...') return;
      
      // If we already have chart data loaded for this active run, skip re-fetching to prevent flashing/disappearing
      if (chartData && chartData.length > 0 && activeRun.status !== 'running') {
        return;
      }
      
      // If the active run is currently running, the polling is already handled.
      // But if it is completed or failed, we restore its telemetry.
      if (activeRun.status !== 'running') {
        setIsTelemetryLoading(true);
        // Clear previous dataset state since historical runs do not keep or load datasets
        setFile(null);
        setColumns([]);
        setPreviewData([]);
        setDatasetId('');
        
        try {
          // 1. Fetch Optuna trial history
          const histRes = await fetch(`${API_URL}/optimize/${activeRun.id}/history`, {
            headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
          });
          const histData = await histRes.json();
          if (histData.trials && histData.trials.length > 0) {
            setChartData(histData.trials);
          } else {
            setChartData([]);
          }

          // 2. Fetch run configuration details from Supabase
          const { data: runData, error: runError } = await supabase
            .from('runs')
            .select('*')
            .eq('id', activeRun.id)
            .single();

          if (!runError && runData) {
            setTargetColumn(runData.target_column || '');
            setProblemType(runData.problem_type || 'classification');
            setShowConfigPanel(false);
          }
        } catch (err) {
          console.error("Failed to restore workspace session:", err);
        } finally {
          setIsTelemetryLoading(false);
        }
      }
    };

    fetchRunHistoryAndDataset();
  }, [activeRun?.id, session?.access_token, previewLimit]);

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
      const targetValues = previewData
        .map(row => row[targetColumn])
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '');

      const isContinuous = targetValues.some(v => {
        const num = Number(v);
        return !isNaN(num) && !Number.isInteger(num);
      });

      const isCategoricalStr = targetValues.some(v => isNaN(Number(v)));

      // Check if it's a high-cardinality integer column (likely a regression target, not classification)
      const uniqueIntValues = new Set(targetValues.filter(v => {
        const num = Number(v);
        return !isNaN(num) && Number.isInteger(num);
      }));
      const isHighCardinalityInt = uniqueIntValues.size > 20;

      if (problemType === 'classification' && isContinuous) {
        alert("Validation Error: The target column contains continuous numerical data (decimals).\n\nClassification requires discrete categories (like classes or 0/1). Please change the Problem Domain to 'Regression'.");
        return;
      }

      if (problemType === 'classification' && isHighCardinalityInt && !isCategoricalStr) {
        const proceed = window.confirm(
          `Warning: The target column "${targetColumn}" has ${uniqueIntValues.size} unique integer values in the preview.\n\nThis looks like a continuous numerical column (e.g. price, area, count) — Classification may fail or give poor results.\n\nDo you want to switch to Regression instead? Click OK to switch, Cancel to continue with Classification.`
        );
        if (proceed) {
          setProblemType('regression');
          return;
        }
      }

      if (problemType === 'regression' && isCategoricalStr) {
        alert("Validation Error: The target column contains text/categorical data.\n\nRegression requires numerical data to predict. Please change the Problem Domain to 'Classification'.");
        return;
      }
    }

    // Set optimistic running state
    const optimisticRunObj = { 
      id: 'Starting...', 
      status: 'running', 
      dataset: file?.name || 'Dataset', 
      score: '-', 
      error: null, 
      params: '',
      n_trials: nTrials 
    };
    setActiveRun(optimisticRunObj);
    setChartData([]);
    setShowConfigPanel(false);

    try {
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
      
      const runObj = { 
        id: data.run_id, 
        status: 'running', 
        dataset: file?.name, 
        score: '-', 
        error: null, 
        params: '',
        n_trials: nTrials 
      };
      
      // Update with true run ID and start polling
      setActiveRun(runObj);
      setActiveRunId(data.run_id);
      pollStatus(data.run_id, runObj);
    } catch (err) {
      console.error(err);
      setActiveRun(null);
      alert('Failed to start model optimization. Is the backend running?');
    }
  };

  const pollStatus = async (runId: string, initialRunObj: any) => {
    if (pollingActiveRef.current === runId) return;
    pollingActiveRef.current = runId;
    
    let currentRunState = { ...initialRunObj };
    
    const checkStatus = async () => {
      if (pollingActiveRef.current !== runId) return;
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

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          setRuns(prev => {
            if (prev.some(r => r.id === currentRunState.id)) return prev;
            return [currentRunState, ...prev];
          });
          setActiveRun(null);
          pollingActiveRef.current = null;
          return; // Stop polling
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
      
      if (pollingActiveRef.current === runId) {
        setTimeout(checkStatus, 3000);
      }
    };

    setTimeout(checkStatus, 3000);
  };

  const handleCancelRun = async (runId: string) => {
    if (!runId || runId === 'Starting...') return;
    try {
      const res = await fetch(`${API_URL}/optimize/${runId}/cancel`, {
        method: 'POST',
        headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      });
      if (res.ok) {
        setActiveRun((prev: any) => prev ? { ...prev, status: 'failed', error: 'Cancelled by user' } : null);
      }
    } catch (err) {
      console.error("Failed to cancel run:", err);
    }
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

  const handleRunNewModel = () => {
    setFile(null);
    setColumns([]);
    setPreviewData([]);
    setTargetColumn('');
    setProblemType('classification');
    setDatasetId('');
    setStoragePath('');
    setChartData([]);
    setActiveRunId(null);
    setActiveRun(null);
    setShowConfigPanel(true);
  };

  const saveCurrentReport = () => {
    if (!activeRun) {
      alert("No active optimization run to generate a report for.");
      return;
    }

    const bestTrial = chartData.reduce((best, trial) => {
      if (!best) return trial;
      return trial.value > best.value ? trial : best;
    }, null as any);

    const reportContent = `# Neural Net Insights - Optimization Report
==========================================

## Run Overview
- **Run ID**: ${activeRun.id}
- **Status**: ${activeRun.status || 'completed'}
- **Target Column**: ${targetColumn || 'N/A'}
- **Problem Type**: ${problemType || 'N/A'}
- **Total Trials**: ${chartData.length}

## Best Performing Model
- **Model Type**: ${activeRun.model || (bestTrial ? bestTrial.model : 'N/A')}
- **Best Value (Metric Score)**: ${activeRun.score !== '-' ? activeRun.score : (bestTrial ? bestTrial.value.toFixed(4) : 'N/A')}
- **Optimal Hyperparameters**:
\`\`\`json
${activeRun.params ? JSON.stringify(JSON.parse(activeRun.params), null, 2) : (bestTrial?.params ? JSON.stringify(bestTrial.params, null, 2) : '{}')}
\`\`\`

## Optimization Trial History
${chartData.map((t, idx) => `Trial ${idx + 1}: Model = ${t.model || 'N/A'}, Score = ${t.value !== undefined && t.value !== null ? t.value.toFixed(4) : 'N/A'}`).join('\n')}

Generated on ${new Date().toLocaleString()} by Neural Net Insights.
`;

    const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optuna_report_${activeRun.id.split('-')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportChartAsPng = () => {
    const svgElement = document.querySelector('.recharts-wrapper svg');
    if (!svgElement) {
      alert("Chart not found. Please make sure the telemetry chart is rendered.");
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svgElement);
    let fullSvgString = svgString;
    if (!svgString.includes('xmlns=')) {
      fullSvgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([fullSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 800;
      const context = canvas.getContext('2d');
      if (context) {
        const isDark = document.documentElement.classList.contains('dark');
        context.fillStyle = isDark ? '#111111' : '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.drawImage(image, 50, 50, canvas.width - 100, canvas.height - 100);
        
        context.fillStyle = isDark ? '#ffffff' : '#0f172a';
        context.font = 'bold 24px sans-serif';
        context.fillText('Neural Net Insights - Optuna Optimization Telemetry', 50, 45);
        
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `neural_net_telemetry_${activeRunId || 'run'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  if (!isMounted) {
    return <div className="h-full w-full bg-white dark:bg-[#121212] flex items-center justify-center text-slate-400 dark:text-white/60 dark:text-white/40">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-[#121212] text-black font-sans">
      {/* Top Application Bar */}
      <div className="h-12 border-b border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded text-slate-500 dark:text-white/40 hover:bg-slate-200 hover:text-slate-700 dark:text-white/80 transition-colors"
            title="Toggle Left Sidebar"
          >
            <PanelLeft size={18} />
          </button>
          <div className="flex items-center gap-2 ml-2 border-l border-slate-200 dark:border-white/10 pl-4">
            <span className="text-sm font-semibold text-slate-700 dark:text-white/80">
              Hi, {session?.user?.user_metadata?.full_name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there'} 👋
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-white/40 border-r border-slate-300 pr-4">
            <span className="flex items-center gap-1.5"><Table size={14} /> Dataset Preview</span>
          </div>
          <button 
            onClick={() => {
              const panel = rightPanelRef.current;
              if (panel) panel.isCollapsed() ? panel.expand() : panel.collapse();
            }}
            className="p-1.5 rounded text-slate-500 dark:text-white/40 hover:bg-slate-200 hover:text-slate-700 dark:text-white/80 transition-colors"
            title="Toggle Data Preview"
          >
            <PanelRight size={18} />
          </button>
        </div>
      </div>

      <PanelGroup orientation="horizontal" className="flex-1">

        {/* Left Pane: Config and Status */}
        <Panel panelRef={leftPanelRef} collapsible={true} collapsedSize={0} defaultSize={65} minSize={40} className="h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          <header className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-end bg-white dark:bg-[#0d0d0d] shrink-0">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-800 dark:text-white">Optuna Engine</h1>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">Configure parameters and monitor telemetry.</p>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* Configuration Module */}
          {showConfigPanel && (
            <div className="bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#171717]">
                <HardDrive size={13} className="text-slate-400 dark:text-white/40" />
                <h2 className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">Data Ingestion</h2>
              </div>

              {activeRun && activeRun.status === 'running' ? (
                <div className="p-8 min-h-[360px] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1a1a1a]/40 rounded-b-xl border-t border-slate-100 dark:border-white/10">
                  <div className="relative mb-6">
                     <div className="w-16 h-16 border-4 border-indigo-100 dark:border-white/10 border-t-indigo-600 rounded-full animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <Zap size={20} className="text-indigo-600 animate-pulse" />
                     </div>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">Optimization in Progress</h3>
                  <p className="text-xs text-slate-400 dark:text-white/40 font-mono mt-1 mb-6">RUN_ID: {activeRun.id.split('-')[0]}</p>
                  
                  {/* Real-time Trial Progress */}
                  <div className="w-72 max-w-full space-y-4">
                    <div className="bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/10 p-4 rounded-xl shadow-sm">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-white/50 mb-2">
                        <span className="font-mono uppercase tracking-wider">Trial Progress</span>
                        <span className="text-indigo-600 font-bold font-mono">
                          {Math.min(chartData.length + 1, activeRun.n_trials || nTrials)} / {activeRun.n_trials || nTrials}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden mb-3">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, ((chartData.length) / (activeRun.n_trials || nTrials)) * 100)}%` }}
                        />
                      </div>
                      
                      {chartData.length > 0 ? (
                        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-white/30 font-semibold border-t border-slate-100 dark:border-white/5 pt-2">
                          <span>LATEST MODEL:</span>
                          <span className="text-slate-600 dark:text-white/60 uppercase font-mono">{chartData[chartData.length - 1]?.model}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-center text-slate-400 dark:text-white/30 font-semibold border-t border-slate-100 dark:border-white/5 pt-2">
                          INITIALIZING_TRIAL_1
                        </div>
                      )}
                    </div>

                    {activeRun.score !== '-' && (
                      <div className="flex items-center justify-between bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/10 px-4 py-3 rounded-xl shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Current Best</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-base">{activeRun.score}</span>
                      </div>
                    )}

                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => handleCancelRun(activeRun.id)}
                        disabled={activeRun.id === 'Starting...'}
                        className="text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 border border-red-200/60 dark:border-red-950/60 bg-white hover:bg-red-50 dark:bg-[#121212] dark:hover:bg-red-950/20 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle size={14} /> Stop Optimization
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">Upload Source</label>
                  <label className="relative border-2 border-dashed border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-[#1a1a1a] rounded-xl flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 dark:bg-white/10 transition-all cursor-pointer group h-24">
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
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-slate-400 dark:text-white/40 group-hover:text-indigo-600">
                          <UploadCloud size={18} />
                          <span className="text-sm font-medium">Select CSV</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </label>
                  
                  <div className="mt-6 p-4 bg-indigo-50 dark:bg-white/10 border border-indigo-100 dark:border-white/20 rounded-xl space-y-2.5">
                    <h3 className="text-[10px] font-bold text-indigo-900/60 dark:text-white/80 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Activity size={12}/> Enterprise Pipeline Active</h3>
                    <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-white/80">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                      <p><strong className="text-slate-900 dark:text-white">Algorithm Search:</strong> Automatically evaluating Logistic Regression, Random Forest, and XGBoost.</p>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-white/80">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                      <p><strong className="text-slate-900 dark:text-white">Native Preprocessing:</strong> Automatic imputation, scaling, and OHE handled at ingestion.</p>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-white/80">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                      <p><strong className="text-slate-900 dark:text-white">Bayesian Optimization:</strong> TPE (Tree-structured Parzen Estimator) navigating hyperparameters.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">Target Variable</label>
                    <select value={targetColumn} onChange={e => setTargetColumn(e.target.value)} disabled={columns.length === 0}
                      className="w-full bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/20 p-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-white/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:bg-[#121212] disabled:bg-slate-50 dark:disabled:bg-[#1a1a1a] transition-all">
                      <option value="">Select Target Column</option>
                      {columns.map(col => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-white/80 mb-2">Problem Domain</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-[#222222] rounded-xl">
                      <button onClick={() => setProblemType('classification')} className={`flex-1 p-2 rounded-lg text-sm font-semibold transition-all ${problemType === 'classification' ? 'bg-white dark:bg-[#121212] text-indigo-700 shadow-sm' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:text-white/80'}`}>
                        Classification
                      </button>
                      <button onClick={() => setProblemType('regression')} className={`flex-1 p-2 rounded-lg text-sm font-semibold transition-all ${problemType === 'regression' ? 'bg-white dark:bg-[#121212] text-indigo-700 shadow-sm' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:text-white/80'}`}>
                        Regression
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-white/80">Optimization Trials</label>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-white/10 px-2.5 py-1 rounded-md">{nTrials}</span>
                    </div>
                    <input
                      type="range"
                      min="1" max="50" step="1"
                      value={nTrials}
                      onChange={e => setNTrials(parseInt(e.target.value))}
                      className="w-full cursor-pointer accent-indigo-600"
                    />
                    <p className="text-xs text-slate-500 dark:text-white/40 mt-2">Higher trials yield better accuracy but increase execution time.</p>
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
          )}

          {/* Visualization Module */}
          <div className="bg-white dark:bg-[#111111] border border-slate-100 dark:border-white/10 rounded-xl overflow-hidden relative">
            {isTelemetryLoading && (
              <div className="absolute inset-0 bg-white/85 dark:bg-[#111111]/85 backdrop-blur-md z-40 flex flex-col items-center justify-center transition-all duration-300">
                <div className="relative mb-4">
                  <div className="w-12 h-12 border-4 border-indigo-100 dark:border-white/10 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database size={16} className="text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">Restoring Workspace Telemetry</h3>
                <p className="text-xs text-slate-400 dark:text-white/40 font-mono mt-1 animate-pulse">LOADING_HISTORICAL_RUN_TRIAL_DATA...</p>
              </div>
            )}
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#171717]">
              <div className="flex items-center gap-2">
                <Radar size={13} className="text-slate-400 dark:text-white/40" />
                <h2 className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">Telemetry</h2>
              </div>
              <div className="flex items-center gap-2">
                {(!showConfigPanel || activeRun) && (
                  <>
                    <button 
                      onClick={() => setShowConfigPanel(prev => !prev)}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-white/5 px-2.5 py-1 rounded transition-colors"
                      title={showConfigPanel ? "Hide parameters" : "Show parameters"}
                    >
                      <HardDrive size={11} /> {showConfigPanel ? 'Hide Config' : 'Show Config'}
                    </button>
                    {activeRun?.status !== 'running' && (
                      <button 
                        onClick={handleRunNewModel}
                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-white/5 px-2.5 py-1 rounded transition-colors"
                        title="Start a new model optimization run"
                      >
                        <PlusCircle size={11} /> Run New Model
                      </button>
                    )}
                    {activeRun && activeRun.id !== 'Starting...' && activeRun.status !== 'running' && (
                      <button 
                        onClick={saveCurrentReport}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-white/60 hover:bg-slate-200/50 dark:hover:bg-white/5 px-2.5 py-1 rounded transition-colors"
                        title="Download Markdown summary report"
                      >
                        <Save size={11} /> Save Report
                      </button>
                    )}
                    {chartData.length > 0 && (
                      <button 
                        onClick={exportChartAsPng}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-white/60 hover:bg-slate-200/50 dark:hover:bg-white/5 px-2.5 py-1 rounded transition-colors"
                        title="Export telemetry graph as PNG"
                      >
                        <Download size={11} /> Export Graph
                      </button>
                    )}
                  </>
                )}
                <button 
                  onClick={() => setIsChartFullscreen(true)}
                  className="text-slate-300 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/70 transition-colors p-1"
                  title="View Fullscreen"
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row border-b border-gray-100 min-h-[350px]">
              <div className="flex-1 p-6 relative bg-white dark:bg-[#121212] border-r border-slate-100 dark:border-white/20 flex flex-col justify-center">
                {chartData.length === 0 ? (
                  <div className="flex flex-col items-center text-gray-400 gap-2 font-mono text-sm">
                    <Activity size={24} className="opacity-50" />
                    <p>AWAITING_DATA</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-white/40 mb-2 px-4 shrink-0">
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
                            tick={{ fontSize: 12, fill: isDark ? '#e2e8f0' : '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'TRIAL NUMBER', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold', fill: isDark ? '#9CA3AF' : '#6B7280' }}
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            tickCount={10}
                            tick={{ fontSize: 12, fill: isDark ? '#e2e8f0' : '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'SCORE', angle: -90, position: 'insideLeft', offset: -10, fontSize: 10, fontWeight: 'bold', fill: isDark ? '#9CA3AF' : '#6B7280' }}
                          />
                          <Tooltip
                            content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-[#121212] border border-slate-100 dark:border-white/20 p-3 rounded-xl shadow-lg">
                                    <p className="font-bold text-[10px] text-slate-500 dark:text-white/40 mb-1">Trial {label}</p>
                                    <p className="text-slate-800 dark:text-white font-bold text-sm mb-1">{modelMap[data.model] || data.model}</p>
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
              <div className="w-full lg:w-64 bg-slate-50/50 dark:bg-[#111111] flex flex-col border-t lg:border-t-0 border-slate-100 dark:border-white/10 overflow-hidden shrink-0">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-[#171717]">
                  <h3 className="text-[10px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider flex items-center gap-1.5"><Activity size={11}/> Leaderboard</h3>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-white/40 text-xs font-mono">NO_MODELS</div>
                  ) : (
                    <>
                      {modelLeaderboard.map((item, index) => (
                        <div key={item.model} className={`p-3 rounded-xl border ${index === 0 ? 'bg-indigo-50 dark:bg-white/10 border-indigo-200' : 'bg-white dark:bg-[#121212] border-slate-200 dark:border-white/20 shadow-sm'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-[#222222] text-slate-500 dark:text-white/60 dark:text-white/40'}`}>
                              #{index + 1}
                            </div>
                            <span className={`font-bold text-xs ${index === 0 ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-white/80'}`}>
                              {modelMap[item.model] || item.model}
                            </span>
                          </div>
                          <p className={`text-[10px] font-mono pl-7 ${index === 0 ? 'text-indigo-600 dark:text-white/90 font-bold' : 'text-slate-500 dark:text-white/60'}`}>
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
                <div className="border-t border-slate-100 dark:border-white/20 bg-slate-50 dark:bg-[#1a1a1a]/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                        <Activity size={16} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-white/40 font-bold mb-0.5">CURRENT RUN</div>
                        <div className="text-sm font-mono font-bold text-slate-800 dark:text-white">{activeRun.id}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-white/40 font-bold mb-0.5 uppercase">Dataset</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-white/80">{activeRun.dataset}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-white/40 font-bold mb-0.5 uppercase">Score</div>
                        <div className="text-xs font-mono font-bold text-indigo-600">{activeRun.score || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-white/40 font-bold mb-0.5 uppercase">Status</div>
                        <div>
                          {activeRun.status === 'running' ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 text-xs border border-indigo-100 dark:border-white/20 bg-indigo-50 dark:bg-white/10 rounded-full px-2 py-0.5">
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
      <PanelResizeHandle className="w-px bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/20 cursor-col-resize transition-colors shrink-0" />

      {/* Right Pane: Data Preview */}
      <Panel panelRef={rightPanelRef} collapsible={true} collapsedSize={0} defaultSize={35} minSize={20} className="h-full bg-white dark:bg-[#0d0d0d] flex flex-col border-l border-slate-100 dark:border-white/10">
        <header className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/80 dark:bg-[#171717] shrink-0">
          <div>
            <h1 className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Table size={11} className="text-slate-400 dark:text-white/40" />
              Data Preview
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60 dark:text-white/40">Rows:</label>
            <select 
              value={previewLimit} 
              onChange={(e) => setPreviewLimit(Number(e.target.value))}
              className="bg-white dark:bg-[#121212] border border-slate-300 text-xs font-bold text-slate-700 dark:text-white/80 rounded p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={100}>100</option>
              <option value={0}>All</option>
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-white dark:bg-[#121212] excel-scrollbar relative">
          {isTelemetryLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/40 gap-3 font-mono text-sm">
              <div className="w-8 h-8 border-4 border-indigo-100 dark:border-white/10 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="animate-pulse">LOADING_DATASET_PREVIEW...</p>
            </div>
          ) : previewData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/40 gap-3 font-mono text-sm">
              <Database size={24} className="opacity-50 text-slate-300" />
              <p>NO_DATA_MOUNTED</p>
            </div>
          ) : (
            <div className="inline-block min-w-full align-middle">
              <table style={{ width: totalTableWidth }} className="table-fixed min-w-full text-xs text-left border-separate border-spacing-0">
                <thead className="bg-slate-50 dark:bg-[#171717] text-slate-500 dark:text-white/40 sticky top-0 z-20">
                  <tr style={{ height: headerHeight }}>
                    <th 
                      style={{ 
                        width: colWidths['__index'] || 50, 
                        minWidth: colWidths['__index'] || 50, 
                        maxWidth: colWidths['__index'] || 50,
                        position: 'relative' 
                      }} 
                      className="px-3 py-2 border-r border-b border-slate-100 dark:border-white/10 text-center text-[10px] font-semibold sticky left-0 z-30 bg-slate-100 dark:bg-[#1a1a1a]"
                    >
                      1
                      {/* Column Resize Handle */}
                      <div 
                        onMouseDown={(e) => handleColResizeStart(e, '__index')}
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-600 z-30 select-none"
                      />
                      {/* Row Resize Handle for Header */}
                      <div 
                        onMouseDown={handleHeaderRowResizeStart}
                        className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-indigo-500/50 active:bg-indigo-600 z-30 select-none"
                      />
                    </th>
                    {columns.map(col => (
                      <th 
                        key={col} 
                        style={{ 
                          width: colWidths[col] || 120, 
                          minWidth: colWidths[col] || 120, 
                          maxWidth: colWidths[col] || 120,
                          position: 'relative' 
                        }} 
                        className="px-3 py-2 border-r border-b border-slate-100 dark:border-white/10 text-[10px] font-semibold tracking-wider whitespace-nowrap overflow-hidden text-ellipsis bg-slate-50 dark:bg-[#171717]"
                      >
                        {col}
                        {/* Column Resize Handle */}
                        <div 
                          onMouseDown={(e) => handleColResizeStart(e, col)}
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-600 z-30 select-none"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono text-slate-700 dark:text-white/80">
                  {previewData.map((row, i) => (
                    <tr key={i} style={{ height: rowHeights[i] || 28 }} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                      <td 
                        style={{ 
                          width: colWidths['__index'] || 50, 
                          minWidth: colWidths['__index'] || 50, 
                          maxWidth: colWidths['__index'] || 50,
                          position: 'relative'
                        }} 
                        className="px-3 py-1 border-r border-b border-slate-100 dark:border-white/10 text-slate-400 dark:text-white/30 text-center text-[10px] font-mono sticky left-0 z-10 bg-white dark:bg-[#0d0d0d] group-hover:bg-slate-50 dark:group-hover:bg-[#171717] transition-colors"
                      >
                        {i + 2}
                        {/* Row Resize Handle */}
                        <div 
                          onMouseDown={(e) => handleRowResizeStart(e, i)}
                          className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-indigo-500/50 active:bg-indigo-600 z-30 select-none"
                        />
                      </td>
                      {columns.map(col => (
                        <td 
                          key={col} 
                          style={{ 
                            width: colWidths[col] || 120, 
                            minWidth: colWidths[col] || 120, 
                            maxWidth: colWidths[col] || 120 
                          }} 
                          className="px-3 py-1 border-r border-b border-slate-100 dark:border-white/10 whitespace-nowrap overflow-hidden text-ellipsis text-slate-600 dark:text-white/70 text-xs font-mono bg-white dark:bg-[#0d0d0d] group-hover:bg-slate-50 dark:group-hover:bg-[#171717] transition-colors"
                        >
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
              className="bg-white dark:bg-[#121212] w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-white/20"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/20 flex items-center justify-between bg-slate-50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Telemetry: Fullscreen View</h2>
                </div>
                <button 
                  onClick={() => setIsChartFullscreen(false)}
                  className="text-slate-400 dark:text-white/40 hover:text-red-500 transition-colors p-1 bg-white dark:bg-[#121212] rounded-full border border-slate-200 dark:border-white/20 shadow-sm hover:shadow-md"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-8 bg-white dark:bg-[#121212] relative">
                {chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/40 gap-3 font-mono text-sm">
                    <Activity size={32} className="opacity-50" />
                    <p>AWAITING_DATA</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-500 dark:text-white/40 mb-4 shrink-0">
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
                            tick={{ fontSize: 14, fill: isDark ? '#e2e8f0' : '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'TRIAL NUMBER', position: 'insideBottom', offset: -15, fontSize: 12, fontWeight: 'bold', fill: isDark ? '#9CA3AF' : '#6B7280' }}
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            tickCount={15}
                            tick={{ fontSize: 12, fill: isDark ? '#e2e8f0' : '#000', fontWeight: 'bold' }} 
                            axisLine={false} tickLine={false} 
                            label={{ value: 'SCORE', angle: -90, position: 'insideLeft', offset: -15, fontSize: 12, fontWeight: 'bold', fill: isDark ? '#9CA3AF' : '#6B7280' }}
                          />
                          <Tooltip
                            content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-[#121212] border border-slate-100 dark:border-white/20 p-4 rounded-xl shadow-xl">
                                    <p className="font-bold text-xs text-slate-500 dark:text-white/40 mb-2">Trial {label}</p>
                                    <p className="text-slate-800 dark:text-white font-bold text-lg mb-1">{modelMap[data.model] || data.model}</p>
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
