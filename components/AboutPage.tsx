
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, BookOpen, Sparkles, ArrowLeft } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-12 sm:py-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto space-y-16"
      >
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.4em] text-indigo-600 dark:text-indigo-400 hover:opacity-70 transition-opacity mb-8">
            <ArrowLeft size={12} /> Back to Home
          </Link>
          <h1 className="text-5xl sm:text-7xl font-serif font-black leading-tight">Divine Echo</h1>
          <p className="text-sm uppercase font-black tracking-[0.6em] text-slate-400">Temporal Wisdom & Visual Resonance</p>
        </div>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-serif italic text-indigo-600 dark:text-indigo-400">The Purpose</h2>
            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400 font-serif">
              Daily Divine Echo is a digital sanctuary designed to bridge the gap between ancient wisdom and modern life. 
              By reflecting on the "echoes" of history, we find patterns that resonate with our present moment, 
              offering a unique lens through which to view each day.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border dark:border-white/5 space-y-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                <Clock size={24} />
              </div>
              <h3 className="font-bold text-lg">Historical Nodes</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                We scan the archival depths of history to find significant events that occurred on this specific day of the year, across centuries of human experience.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border dark:border-white/5 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                <BookOpen size={24} />
              </div>
              <h3 className="font-bold text-lg">Sacred Resonance</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Each event is paired with a Bible verse, paraphrased by our AI to capture its core spiritual essence and apply it directly to the historical context.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border dark:border-white/5 space-y-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-lg">Visual Manifestation</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Using advanced generative models, we create unique cinematic artwork that visualizes the intersection of history and spirituality for your meditation.
              </p>
            </div>
          </div>

          <section className="p-12 bg-indigo-600 rounded-[3rem] text-white space-y-6 shadow-2xl">
            <h2 className="text-3xl font-serif italic">The Technology</h2>
            <p className="text-indigo-100 leading-relaxed">
              Divine Echo leverages the Gemini API to synthesize historical data, theological insights, and visual arts. 
              It calculates the precise day of the year to ensure every "echo" is temporally accurate, 
              creating a personalized experience for every observer.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Gemini 3 Pro</span>
              <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Temporal Logic</span>
              <span className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">Neural Art</span>
            </div>
          </section>
        </div>

        <div className="text-center pt-12">
          <Link to="/" className="px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black uppercase text-[11px] tracking-widest shadow-xl hover:scale-105 transition-transform inline-block">
            Begin Your Journey
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutPage;
