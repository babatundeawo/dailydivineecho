
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { getDayOfYearInfo } from './utils/dateUtils.ts';
import { fetchDailyInspiration, generateInspirationalImage, fetchHistoricalRecommendations } from './services/geminiService.ts';
import { InspirationData, LoadingState, HistoricalRecommendation } from './types.ts';
import InspirationCard from './components/InspirationCard.tsx';

const HISTORY_KEY = 'divine_echo_history_v2';
const AUTHOR_KEY = 'divine_echo_author_name';
const DEFAULT_AUTHOR = "Babátúndé Awóyẹmí";

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ShimmerLoader: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-4 border-2 border-slate-200 dark:border-white/10 rounded-full animate-pulse-slow"></div>
      <div className="absolute inset-8 border-2 border-indigo-500/20 rounded-full animate-pulse"></div>
      <div className="w-4 h-4 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.8)] animate-float"></div>
    </div>
    <div className="space-y-4 text-center">
      <h2 className="text-4xl font-serif italic text-slate-800 dark:text-slate-100 animate-pulse">{text}</h2>
      <p className="text-[11px] uppercase tracking-[0.6em] text-slate-400 font-black">Syncing with Temporal Archons...</p>
    </div>
  </div>
);

const About: React.FC = () => (
  <div className="max-w-3xl w-full mx-auto py-12 px-6 animate-in slide-in-from-bottom-8 duration-700">
    <div className="p-10 sm:p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <h1 className="text-4xl font-serif font-bold mb-8 text-slate-900 dark:text-white">About Daily Divine Echo</h1>
      <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          <strong className="text-indigo-600 dark:text-indigo-400">Daily Divine Echo</strong> is a high-performance inspiration companion that bridges the gap between historical echoes and future resilience.
        </p>
        <p>
          Calculated for the year 2026, our engine identifies significant global shifts and synthesizes them into spellbinding narratives. This is not just AI content; it is a humanized reflection of our collective journey.
        </p>
        <p>
          Each "Echo" captures the essence of history, paired with hyper-realistic cinematic art and timeless wisdom to empower your daily walk.
        </p>
        <div className="pt-8 border-t border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/30 mb-4">Operational Flow</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">01</span>
              <span>Input your name and target any day in the year.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">02</span>
              <span>Extract a resonance thread from the universal archives.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">03</span>
              <span>Download your custom cinematic frame and deploy your narrative to the world.</span>
            </li>
          </ul>
        </div>
      </div>
      <Link to="/" className="inline-block mt-12 px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-xl shadow-indigo-600/30">Back to Interface</Link>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.SETUP);
  const [data, setData] = useState<InspirationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [authorName, setAuthorName] = useState<string>(localStorage.getItem(AUTHOR_KEY) || DEFAULT_AUTHOR);
  const [history, setHistory] = useState<InspirationData[]>([]);
  const [recommendations, setRecommendations] = useState<HistoricalRecommendation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) try { setHistory(JSON.parse(saved)); } catch (e) {}
  }, []);

  const saveToHistory = useCallback((newItem: InspirationData) => {
    setHistory(prev => {
      const idx = prev.findIndex(item => item.dateString === newItem.dateString && item.eventTitle === newItem.eventTitle);
      const updated = idx !== -1 ? [...prev.slice(0, idx), newItem, ...prev.slice(idx + 1)] : [newItem, ...prev].slice(0, 30);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteFromHistory = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  }, [history]);

  const dayInfo = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return getDayOfYearInfo(new Date(year, month - 1, day));
  }, [selectedDate]);

  const handleFetchRecommendations = useCallback(async () => {
    try {
      setError(null);
      setLoadingState(LoadingState.IDLE);
      setTimeout(async () => {
        setLoadingState(LoadingState.CHOOSING_EVENT);
        const recs = await fetchHistoricalRecommendations(dayInfo.dateString, 12);
        setRecommendations(recs);
      }, 150);
    } catch (err: any) {
      setError(err.message);
      setLoadingState(LoadingState.ERROR);
    }
  }, [dayInfo]);

  const handleSelectEvent = useCallback(async (event: HistoricalRecommendation) => {
    try {
      setError(null);
      setLoadingState(LoadingState.FETCHING_EVENT);
      const info = await fetchDailyInspiration({ 
        current: dayInfo.current, total: dayInfo.total, formatted: dayInfo.formatted, 
        dateString: dayInfo.dateString, userName: authorName, selectedEvent: event
      });
      setData(info);
      setLoadingState(LoadingState.GENERATING_IMAGE);
      const imageUrl = await generateInspirationalImage(info, "3:4");
      const completeData = { ...info, imageUrl };
      setData(completeData);
      setLoadingState(LoadingState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Archive link severed.");
      setLoadingState(LoadingState.ERROR);
    }
  }, [dayInfo, authorName]);

  const isLoading = loadingState === LoadingState.FETCHING_EVENT || loadingState === LoadingState.GENERATING_IMAGE;

  return (
    <div className="w-full flex flex-col items-center min-h-screen">
      {loadingState === LoadingState.SETUP && (
        <div className="max-w-xl w-full my-auto space-y-12 animate-in slide-in-from-bottom-16 duration-1000 pt-10 px-4">
          <div className="p-10 sm:p-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[4rem] shadow-2xl space-y-12 relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="text-center">
              <h1 className="text-5xl sm:text-6xl font-serif font-bold tracking-tighter text-slate-900 dark:text-white">Divine Echo</h1>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.6em] mt-6 font-black">2026 Resilience Hub</p>
              <div className="mt-10 flex flex-col items-center">
                <div className="px-6 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full flex items-center gap-6 transition-colors shadow-sm">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Temporal Index</span>
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{dayInfo.current} <span className="text-slate-200 dark:text-white/10">/</span> {dayInfo.total}</span>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-[0.4em] font-black ml-2">Observer Identity</label>
                <input type="text" value={authorName} onChange={(e) => { setAuthorName(e.target.value); localStorage.setItem(AUTHOR_KEY, e.target.value); }} className="w-full px-8 py-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 outline-none font-medium transition-all text-slate-900 dark:text-white text-lg" placeholder="Enter name..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-[0.4em] font-black ml-2">Target Dimension (Date)</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-8 py-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 outline-none font-medium transition-all text-slate-900 dark:text-white text-lg" />
              </div>
              <button onClick={handleFetchRecommendations} className="w-full py-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 group">
                <span className="group-hover:tracking-[0.6em] transition-all">Scan Archives</span>
              </button>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
              <Link to="/about" className="text-[10px] uppercase font-black tracking-[0.5em] text-slate-300 hover:text-indigo-600 transition-all">Platform Manifesto</Link>
            </div>
          </div>
          {history.length > 0 && (
            <div className="space-y-8 pb-32">
              <h3 className="text-center text-[11px] uppercase font-black tracking-[0.6em] text-slate-400">Personal Archive</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {history.map((item, idx) => (
                  <div key={idx} className="group relative flex items-center gap-5 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] hover:border-indigo-500/50 transition-all text-left shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 70}ms` }}>
                    <button onClick={() => { setData(item); setLoadingState(LoadingState.COMPLETED); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-1 flex items-center gap-5 min-w-0">
                      <div className="w-16 h-16 rounded-3xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-md bg-slate-100 dark:bg-white/5 shrink-0">
                        {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{item.eventTitle}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 tracking-widest uppercase font-black">{item.dateString}</p>
                      </div>
                    </button>
                    <button onClick={(e) => deleteFromHistory(e, idx)} className="p-4 text-slate-200 dark:text-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-90 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loadingState === LoadingState.CHOOSING_EVENT && (
        <div className="max-w-6xl w-full my-auto space-y-16 animate-in fade-in zoom-in-90 slide-in-from-bottom-32 duration-1000 pb-32 pt-10 px-4">
          <div className="text-center space-y-8">
            <h2 className="text-5xl sm:text-7xl font-serif font-bold text-slate-900 dark:text-white tracking-tighter">Archive Unveiled</h2>
            <div className="flex flex-col items-center gap-4">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.8em] font-black">Select a Resonance Thread</p>
              <div className="w-24 h-1.5 bg-indigo-600/40 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {recommendations.length > 0 ? recommendations.map((rec, idx) => (
              <button 
                key={rec.id} 
                onClick={() => handleSelectEvent(rec)} 
                className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[4rem] text-left hover:border-indigo-600 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] transition-all group active:scale-[0.98] flex flex-col h-full shadow-xl relative overflow-hidden animate-in slide-in-from-bottom-20 fade-in fill-mode-both"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 blur-[80px] pointer-events-none group-hover:bg-indigo-600/15 transition-colors" />
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-[1.1] pr-6">{rec.title}</h3>
                  <span className="text-[12px] font-black bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg border border-white/10 shrink-0">{rec.year}</span>
                </div>
                <p className="text-base text-slate-500 dark:text-slate-400 font-serif italic leading-relaxed mt-auto line-clamp-4 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{rec.description}</p>
              </button>
            )) : (
              <div className="col-span-full py-32 text-center space-y-6">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto shadow-xl" />
                <p className="text-xs uppercase font-black tracking-[0.5em] text-slate-400 animate-pulse">Syncing Universal Stream...</p>
              </div>
            )}
          </div>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-8 text-[11px] uppercase font-black text-slate-400 dark:text-white/10 hover:text-slate-900 dark:hover:text-white transition-all tracking-[0.8em] group">
            <span className="group-hover:tracking-[1em] transition-all">Reset Archival Link</span>
          </button>
        </div>
      )}

      {isLoading && (
        <div className="my-auto pt-20">
          <ShimmerLoader text={loadingState === LoadingState.FETCHING_EVENT ? 'Collating Wisdom' : 'Manifesting Vision'} />
        </div>
      )}

      {data && loadingState === LoadingState.COMPLETED && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-16 duration-1000 pb-32 pt-10 px-4">
          <InspirationCard 
            data={data} 
            showControls={true} 
            onUpdate={(u) => setData(prev => prev ? {...prev, ...u} : null)} 
            onSave={() => saveToHistory(data)}
          />
          <div className="mt-20 flex justify-center">
            <button onClick={() => { setData(null); setLoadingState(LoadingState.SETUP); }} className="px-14 py-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/10 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-full text-[11px] uppercase font-black tracking-[0.6em] transition-all shadow-md active:scale-95">Return to Archive</button>
          </div>
        </div>
      )}

      {loadingState === LoadingState.ERROR && (
        <div className="my-auto text-center p-16 bg-white dark:bg-slate-900 rounded-[4rem] border border-red-100 dark:border-red-500/20 max-w-lg shadow-3xl pt-20 mx-4 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-serif font-bold text-red-600 mb-6 tracking-tight">Sync Severed</h2>
          <p className="text-base text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">{error}</p>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-7 bg-red-600 hover:bg-red-700 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl shadow-red-600/30 active:scale-95">Reconnect Systems</button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen font-sans transition-colors duration-500">
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </HashRouter>
    </div>
  );
};

export default App;
