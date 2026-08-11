'use client';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { BrainCircuit, Database, Cpu, ChevronRight, BarChart3, Activity, UploadCloud, Target, Sparkles, ArrowRight } from 'lucide-react';

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-indigo-500 selection:text-white font-sans overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-[0.25]">
        <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-indigo-500/10 to-transparent blur-[100px] absolute top-[-20%] left-[-10%]" />
        <div className="w-[1200px] h-[1200px] rounded-full bg-gradient-to-bl from-violet-500/10 to-transparent blur-[120px] absolute bottom-[-30%] right-[-10%]" />
      </div>

      <nav className="border-b border-slate-100/50 px-8 py-5 flex justify-between items-center bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30 shadow-lg flex items-center justify-center text-white">
            <BrainCircuit size={18} />
          </div>
          <span className="font-bold tracking-tight text-lg text-slate-800">Neural Net Insights</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-8 text-sm font-semibold items-center"
        >
          <a href="#how-it-works" className="text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block">
            How it Works
          </a>
          <a href="#features" className="text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block">
            Features
          </a>
          <Link href="/login" className="text-slate-600 hover:text-indigo-600 transition-colors">
            Log in
          </Link>
          <Link href="/login" className="bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
            Get Started <ChevronRight size={16} />
          </Link>
        </motion.div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-8 pt-32 pb-40 md:pt-48 md:pb-56 flex flex-col items-center text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/20 to-violet-500/20 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none"></div>

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200/50 bg-indigo-50/50 backdrop-blur-md text-indigo-700 shadow-sm mb-8">
              <Sparkles size={14} className="text-indigo-500" />
              <span className="text-xs font-bold tracking-wide uppercase">Next-Gen AutoML Platform</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-8 leading-[1.05] text-slate-900 drop-shadow-sm">
              Automate Model Selection. <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x">Zero Configuration.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed">
              Upload your dataset, select a target, and let our distributed Bayesian engine find the optimal machine learning architecture for your specific problem space.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex gap-4">
              <Link 
                href="/login"
                className="bg-indigo-600 text-white px-8 py-4 rounded-full text-sm font-bold hover:scale-105 hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center gap-2 group"
              >
                Start Optimizing 
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="bg-white py-32 border-t border-slate-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="max-w-6xl mx-auto px-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-24"
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">How it works</h2>
              <p className="text-slate-500 mt-6 max-w-2xl mx-auto text-lg">Three simple steps to production-ready models.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-100 via-indigo-300 to-indigo-100 -translate-y-1/2 z-0"></div>

              {[
                { 
                  icon: <UploadCloud size={32} />, 
                  title: '1. Upload Data', 
                  desc: 'Securely upload your CSV dataset. We handle missing values, normalization, and automated preprocessing instantly.' 
                },
                { 
                  icon: <Target size={32} />, 
                  title: '2. Define Target', 
                  desc: 'Select the column you want to predict. We automatically detect if it is a classification or regression problem.' 
                },
                { 
                  icon: <Activity size={32} />, 
                  title: '3. Optimize', 
                  desc: 'Our Optuna engine spins up and tests hundreds of hyperparameters in parallel to find the absolute best model.' 
                }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.2, duration: 0.6, ease: "easeOut" }}
                  className="bg-white/80 backdrop-blur-xl border border-slate-200 p-10 rounded-3xl shadow-xl shadow-slate-200/50 relative z-10 hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg shadow-indigo-500/30">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight text-slate-900">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 relative bg-[#FAFAFA]">
          <div className="max-w-6xl mx-auto px-8 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">Enterprise Infrastructure</h2>
              <p className="text-slate-500 mt-6 max-w-2xl mx-auto text-lg">Built on top of robust open-source libraries, containerized for massive scale.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <BrainCircuit size={28} />, 
                  title: 'Algorithm Search', 
                  desc: 'Automatically tests across Logistic Regression, Random Forests, and XGBoost to find the global minima.' 
                },
                { 
                  icon: <Database size={28} />, 
                  title: 'Native Preprocessing', 
                  desc: 'Automatic imputation, scaling, and one-hot encoding handled directly in the ingestion layer.' 
                },
                { 
                  icon: <Cpu size={28} />, 
                  title: 'Bayesian Optimization', 
                  desc: 'Powered by TPE (Tree-structured Parzen Estimator) to intelligently navigate hyperparameter space.' 
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-slate-200/60 p-8 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 transition-transform group-hover:scale-150 duration-500"></div>
                  <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-8 pb-32 bg-[#FAFAFA]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-indigo-900/20"
          >
            {/* CTA Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] bg-indigo-600/30 blur-[100px] rounded-full mix-blend-screen"></div>
              <div className="absolute top-[20%] -right-[10%] w-[50%] h-[150%] bg-violet-600/30 blur-[100px] rounded-full mix-blend-screen"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">Ready to train better models?</h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-10 text-lg">Stop guessing hyperparameters. Join Neural Net Insights today and let our bayesian optimization engine do the heavy lifting.</p>
              <Link 
                href="/login"
                className="bg-white text-slate-900 px-10 py-4 rounded-full text-base font-bold hover:scale-105 shadow-xl shadow-white/10 hover:shadow-white/20 transition-all flex items-center gap-2 group"
              >
                Create Free Account
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
      
      <footer className="border-t border-slate-200 py-12 px-8 bg-white relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md shadow-sm"></div>
            <span className="font-bold text-slate-800 text-base tracking-tight">Neural Net Insights</span>
          </div>
          <div className="flex gap-6 mb-4 md:mb-0 font-medium">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
          </div>
          <p>&copy; {new Date().getFullYear()} NNI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
