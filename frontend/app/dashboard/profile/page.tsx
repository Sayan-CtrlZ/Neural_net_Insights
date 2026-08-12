'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Settings, Shield, Bell, CreditCard, Key, Server, Lock, Eye, EyeOff, Loader2, Info, User, ArrowRight } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useGlobalState } from '../GlobalStateContext';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useGlobalState();
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  
  // Name update states
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  
  // Password flow states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isRecovery = searchParams?.get('recovery') === 'true';

  useEffect(() => {
    if (session?.user?.user_metadata?.full_name) {
      setNewName(session.user.user_metadata.full_name);
    }
  }, [session]);

  useEffect(() => {
    if (isRecovery) {
      setIsChangingPassword(true);
      setIsVerified(true);
      setMessage('Please enter your new password below.');
    }
  }, [isRecovery]);

  const handleUpdateName = async () => {
    setNameLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName }
      });
      if (error) throw error;
      setMessage('Name updated successfully! (Refresh to see changes globally)');
      setIsEditingName(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update name.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Re-authenticate to verify current password
      const { error } = await supabase.auth.signInWithPassword({ 
        email: session?.user?.email || '', 
        password: currentPassword 
      });
      if (error) throw error;
      setIsVerified(true);
    } catch (err: any) {
      setError('Incorrect current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(session?.user?.email || '', {
        redirectTo: `${window.location.origin}/dashboard/profile?recovery=true`
      });
      if (error) throw error;
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError('Failed to send reset instructions.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setMessage('Your password has been updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setIsChangingPassword(false);
      setIsVerified(false);
      
      if (isRecovery) {
        router.replace('/dashboard/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-white dark:bg-[#0a0a0a] text-black dark:text-white font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-100 dark:border-white/20 flex justify-between items-end bg-white shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-slate-900 dark:text-white">Hi, {userName}</h1>
          <p className="text-sm text-slate-500 dark:text-white/60">Manage your account security and preferences.</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50 dark:bg-[#121212]">
        <div className="lg:col-span-2 space-y-8">
          
          {isRecovery && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-4 rounded-2xl flex items-start gap-3 shadow-sm mb-8">
              <Info className="mt-0.5 shrink-0" size={18} />
              <div>
                <h3 className="text-sm font-bold">Password Recovery</h3>
                <p className="text-sm mt-1 opacity-90">You have successfully authenticated via a secure reset link. Please set your new password below.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl font-medium">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm p-3 rounded-xl font-medium">
              {message}
            </div>
          )}

          {/* Unified Profile Card */}
          <div className="bg-white border border-slate-100 dark:border-white/20 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="bg-slate-50 dark:bg-[#121212] px-5 py-3 flex items-center gap-2 border-b border-slate-100 dark:border-white/20">
              <User size={16} className="text-indigo-600"/>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Account Settings</h2>
            </div>
            
            {/* Personal Info Section */}
            <div className="p-6 border-b border-slate-100 dark:border-white/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-slate-500 dark:text-white/60">Full Name</label>
                    {!isEditingName && (
                      <button onClick={() => setIsEditingName(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">Edit</button>
                    )}
                  </div>
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="text" 
                        value={newName} 
                        onChange={(e) => setNewName(e.target.value)} 
                        className="block w-full px-3 py-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/20 rounded-lg text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        placeholder="Your Name"
                      />
                      <button onClick={handleUpdateName} disabled={nameLoading} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50">
                        {nameLoading ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
                      </button>
                      <button onClick={() => { setIsEditingName(false); setNewName(session?.user?.user_metadata?.full_name || ''); }} disabled={nameLoading} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-900 dark:text-white font-medium">{session?.user?.user_metadata?.full_name || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-500 dark:text-white/60 mb-1">Email Address</label>
                  <p className="text-slate-900 dark:text-white font-medium">{session?.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-white/60 mb-4">Security</h3>
              
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white/80 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:bg-[#121212] transition-all shadow-sm"
                >
                  Change Password
                </button>
              ) : (
                <div className="max-w-md bg-slate-50 dark:bg-[#121212] p-5 rounded-xl border border-slate-100 dark:border-white/20">
                  {!isVerified ? (
                    <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-white/80">Current Password</label>
                          <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                            Forgot current password?
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-white/40">
                            <Lock size={16} />
                          </div>
                          <input 
                            type={showCurrentPassword ? "text" : "password"}
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full pl-10 pr-10 py-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/20 rounded-lg text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-white/40 hover:text-indigo-600 transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          type="submit"
                          disabled={loading || !currentPassword}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setIsChangingPassword(false); setCurrentPassword(''); }}
                          className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/80 mb-1">New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-white/40">
                            <Lock size={16} />
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full pl-10 pr-10 py-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/20 rounded-lg text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-white/40 hover:text-indigo-600 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-white/80 mb-1">Confirm New Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-white/40">
                            <Lock size={16} />
                          </div>
                          <input 
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="block w-full pl-10 pr-10 py-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/20 rounded-lg text-sm text-slate-700 dark:text-white/80 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-white/40 hover:text-indigo-600 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          type="submit"
                          disabled={loading || !password || !confirmPassword}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Password'}
                        </button>
                        {!isRecovery && (
                          <button 
                            type="button"
                            onClick={() => { setIsChangingPassword(false); setIsVerified(false); setPassword(''); setConfirmPassword(''); }}
                            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
