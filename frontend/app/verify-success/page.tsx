'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, BrainCircuit, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function VerifySuccessPage() {
  const router = useRouter();
  const [sessionEstablished, setSessionEstablished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for the auth state change that happens when Supabase
    // processes the token from the URL hash fragment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setSessionEstablished(true);
        setLoading(false);
      }
    });

    // Also check if a session is already established
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionEstablished(true);
        setLoading(false);
      } else {
        // Give the hash-fragment a moment to be processed
        setTimeout(() => setLoading(false), 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#000000] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30 shadow-xl flex items-center justify-center text-white">
            <BrainCircuit size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#121212] py-10 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-3xl sm:px-10 border border-slate-100 dark:border-white/20 text-center">
          
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 size={32} className="text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-white/60">Verifying your account...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="flex flex-col items-center"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 size={40} className="text-emerald-500" />
              </motion.div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-slate-500 dark:text-white/60 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                {sessionEstablished
                  ? "Your account has been confirmed. You're all set to start using Neural Net Insights."
                  : "Your email has been confirmed. Sign in to access your dashboard."
                }
              </p>

              {sessionEstablished ? (
                <Link
                  href="/dashboard"
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none transition-all"
                >
                  Go to Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none transition-all"
                >
                  Sign In <ArrowRight size={16} />
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
