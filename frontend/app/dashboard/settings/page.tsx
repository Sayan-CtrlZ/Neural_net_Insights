'use client';
import React from 'react';
import { Settings, Shield, Bell, CreditCard, Key, Server } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="h-full w-full bg-white text-black font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-200 flex justify-between items-end bg-[#FAFAFA] shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your workspace preferences and integrations.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className="border border-slate-200 bg-white shadow-md">
            <div className="bg-indigo-600 text-white px-4 py-2 flex items-center gap-2">
              <Server size={14}/>
              <h2 className="text-xs font-bold uppercase tracking-wider">Environment Configuration</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-slate-700">Supabase API Key</label>
                <input 
                  type="password" 
                  defaultValue="eyJhbdGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 text-sm font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">Used to store persistent optimization telemetry.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-2 text-slate-700">Compute Backend URL</label>
                <input 
                  type="text" 
                  defaultValue="http://localhost:8000/api" 
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 text-sm font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button className="bg-indigo-600 text-white px-6 py-2 text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                  SAVE CHANGES
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* Sidebar Settings Navigation (Dummy) */}
        <div className="space-y-4">
          <div className="border border-slate-200 bg-[#FAFAFA] p-4 flex flex-col gap-2">
            <button className="flex items-center gap-3 p-3 text-sm font-bold bg-white border border-slate-200 text-indigo-700 shadow-sm">
              <Settings size={18} /> General
            </button>
            <button className="flex items-center gap-3 p-3 text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-200 hover:text-slate-900 border border-transparent transition-all">
              <Key size={18} /> API Keys
            </button>
            <button className="flex items-center gap-3 p-3 text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-200 hover:text-slate-900 border border-transparent transition-all">
              <Shield size={18} /> Security
            </button>
            <button className="flex items-center gap-3 p-3 text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-200 hover:text-slate-900 border border-transparent transition-all">
              <Bell size={18} /> Notifications
            </button>
            <button className="flex items-center gap-3 p-3 text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-200 hover:text-slate-900 border border-transparent transition-all">
              <CreditCard size={18} /> Billing
            </button>
          </div>
        </div>

      </div>
      
    </div>
  );
}
