'use client';
import React from 'react';
import { Settings, Shield, Bell, CreditCard, Key, Server } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="h-full w-full bg-white text-black font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-end bg-white shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your workspace preferences and integrations.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50">
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 flex items-center gap-2 border-b border-slate-100">
              <Server size={16} className="text-indigo-600"/>
              <h2 className="text-sm font-bold text-slate-800">Environment Configuration</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Supabase API Key</label>
                <input 
                  type="password" 
                  defaultValue="eyJhbdGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <p className="text-xs text-slate-500 mt-2">Used to store persistent optimization telemetry.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Compute Backend URL</label>
                <input 
                  type="text" 
                  defaultValue="http://localhost:8000/api" 
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* Sidebar Settings Navigation */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/10">
            <Settings size={18} /> General
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <Key size={18} /> API Keys
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <Shield size={18} /> Security
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <Bell size={18} /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all">
            <CreditCard size={18} /> Billing
          </button>
        </div>

      </div>
      
    </div>
  );
}
