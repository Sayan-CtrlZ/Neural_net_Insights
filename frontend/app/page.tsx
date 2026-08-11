'use client';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { BrainCircuit, Database, Cpu, ChevronRight, BarChart3, Activity } from 'lucide-react';

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black selection:bg-blue-600 selection:text-white font-sans overflow-hidden">
      
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex justify-center items-center opacity-[0.03]">
        <div className="w-[800px] h-[800px] rounded-full border border-black absolute animate-[spin_60s_linear_infinite]" />
        <div className="w-[1200px] h-[1200px] rounded-full border border-black absolute animate-[spin_90s_linear_infinite_reverse]" />
      </div>

      <nav className="border-b border-black/5 px-8 py-5 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-5 h-5 bg-black rounded-[4px] shadow-[0_0_15px_rgba(0,0,0,0.2)]"></div>
          <span className="font-bold tracking-tight text-lg">NEURAL_NET INSIGHTS</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-8 text-sm font-medium items-center"
        >
          <a href="#features" className="text-gray-500 hover:text-black transition-colors relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
          </a>
          <Link href="/dashboard" className="bg-black text-white px-5 py-2.5 rounded-full hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2">
            Dashboard <ChevronRight size={16} />
          </Link>
        </motion.div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-8 py-32 md:py-48 flex flex-col items-center text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 bg-white shadow-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-medium tracking-wide">Optuna v3 Engine Online</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-[5rem] font-semibold tracking-tighter mb-6 leading-[1.1]">
              Automate Model Selection. <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">Zero Configuration.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12 leading-relaxed">
              Upload your dataset, select a target, and let our distributed Bayesian engine find the optimal machine learning architecture for your specific problem space.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex gap-4">
              <Link 
                href="/dashboard"
                className="bg-black text-white px-8 py-4 rounded-full text-sm font-medium hover:scale-105 hover:bg-blue-600 hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 group"
              >
                Start Optimizing 
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={16} />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-black/5 bg-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30"></div>
          
          <div className="max-w-6xl mx-auto px-8 py-32 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Enterprise Grade Infrastructure</h2>
              <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Built on top of robust open-source libraries, containerized for scale.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <BrainCircuit size={24} />, 
                  title: 'Algorithm Search', 
                  desc: 'Automatically tests across Logistic Regression, Random Forests, and XGBoost to find the global minima.' 
                },
                { 
                  icon: <Database size={24} />, 
                  title: 'Native Preprocessing', 
                  desc: 'Automatic imputation, scaling, and one-hot encoding handled directly in the ingestion layer.' 
                },
                { 
                  icon: <Activity size={24} />, 
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
                  className="bg-[#FAFAFA] border border-black/5 p-8 rounded-3xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all group"
                >
                  <div className="w-12 h-12 bg-white border border-black/5 rounded-2xl flex items-center justify-center mb-6 text-black group-hover:text-blue-600 group-hover:scale-110 transition-all shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-black/5 py-12 px-8 bg-white relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-3 h-3 bg-gray-300 rounded-[2px]"></div>
            <span className="font-semibold text-gray-500">NEURAL_NET INSIGHTS</span>
          </div>
          <p>&copy; {new Date().getFullYear()} NNI Inc. Minimal & Modern.</p>
        </div>
      </footer>
    </div>
  );
}
