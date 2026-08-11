'use client';
import React from 'react';
import { Database, UploadCloud, FileText, Search, Settings2, Trash2 } from 'lucide-react';

export default function DatasetsPage() {
  const dummyDatasets = [
    { id: '1', name: 'student_performance_dataset.csv', size: '2.4 MB', uploaded: '2 mins ago', rows: 1450 },
    { id: '2', name: 'housing_prices_boston.csv', size: '1.1 MB', uploaded: '1 day ago', rows: 506 },
    { id: '3', name: 'customer_churn_records.csv', size: '8.6 MB', uploaded: '3 days ago', rows: 10000 },
  ];

  return (
    <div className="h-full w-full bg-white text-black font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-200 flex justify-between items-end bg-[#FAFAFA] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900">Datasets</h1>
          <p className="text-sm text-slate-500">Manage, preview, and process your uploaded CSVs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search datasets..." 
              className="pl-9 pr-4 py-2 border border-slate-300 text-sm focus:outline-none focus:border-indigo-600 w-64"
            />
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
            <UploadCloud size={16} />
            UPLOAD NEW
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="border border-slate-200 bg-white shadow-md">
          <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={14}/>
              <h2 className="text-xs font-bold uppercase tracking-wider">Repository</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono opacity-80">
              {dummyDatasets.length} DATASETS
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-slate-200 text-xs font-bold uppercase text-slate-700">
                <tr>
                  <th className="px-5 py-3 border-r border-slate-200 w-10 text-center">#</th>
                  <th className="px-5 py-3 border-r border-slate-200">Filename</th>
                  <th className="px-5 py-3 border-r border-slate-200">Size</th>
                  <th className="px-5 py-3 border-r border-slate-200">Rows</th>
                  <th className="px-5 py-3 border-r border-slate-200">Uploaded</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dummyDatasets.map((ds, i) => (
                  <tr key={ds.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 border-r border-slate-200 text-slate-400 text-center bg-[#FAFAFA]">{i + 1}</td>
                    <td className="px-5 py-4 border-r border-slate-200 font-medium flex items-center gap-2">
                      <FileText size={16} className="text-indigo-600" />
                      {ds.name}
                    </td>
                    <td className="px-5 py-4 border-r border-slate-200 font-mono text-slate-600">{ds.size}</td>
                    <td className="px-5 py-4 border-r border-slate-200 font-mono text-slate-600">{ds.rows.toLocaleString()}</td>
                    <td className="px-5 py-4 border-r border-slate-200 text-slate-500">{ds.uploaded}</td>
                    <td className="px-5 py-4 flex items-center justify-center gap-3">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors" title="Process Data">
                        <Settings2 size={16} />
                      </button>
                      <button className="text-slate-400 hover:text-red-600 transition-colors" title="Delete Dataset">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
