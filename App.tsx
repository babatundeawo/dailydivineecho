
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { getDayOfYearInfo } from './utils/dateUtils.ts';
import { fetchDailyInspiration, generateInspirationalImage, fetchHistoricalRecommendations } from './services/geminiService.ts';
import { InspirationData, LoadingState, HistoricalRecommendation } from './types.ts';
import InspirationCard from './components/InspirationCard.tsx';

const HISTORY_KEY = 'divine_echo_history_v2';
const AUTHOR_KEY = 'divine_echo_author_name';
const DEFAULT_AUTHOR = "Babátúndé Awóyẹmí";

const ShimmerLoader: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Outer spinning ring */}
      <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
      
      {/* Pulsing inner rings */}
      <div className="absolute inset-4 border-2 border-slate-200 dark:border-white/10 rounded-full animate-pulse-slow"></div>
      <div className="absolute inset-8 border-2 border-indigo-500/20 rounded-full animate-pulse"></div>
      
      {/* Floating center dot */}
      <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.8)] animate-float"></div>
    </div>
    <div className="space-y-4 text-center">
      <h2 className="text-3xl font-serif italic text-slate-800 dark:text-slate-100 animate-pulse">{text}</h2>
      <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-black animate-shimmer">Aligning temporal frequencies...</p>
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
          <strong className="text-indigo-600 dark:text-indigo-400">Daily Divine Echo</strong> is an inspirational companion designed to connect our present steps with the monumental echoes of history.
        </p>
        <p>
          Every day carries a legacy. Our platform calculates your position in the year 2026, scans through significant world-changing events, and weaves them into a human-centered narrative for the modern professional.
        </p>
        <p>
          Infused with a touch of Nigerian warmth and rhythmic storytelling, each "Echo" pairs a historical moment with biblical wisdom and AI-generated cinematic art to fuel your resilience and growth.
        </p>
        <div className="pt-8 border-t border-slate-100 dark:border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/30 mb-4">How it works</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">01</span>
              <span>Set your observer name and target a date in 2026.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">02</span>
              <span>Select from 10 curated resonance threads discovered in the archives.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">03</span>
              <span>Manually save your favorite echoes to your personal archive for later reflection.</span>
            </li>
          </ul>
        </div>
      </div>
      <Link to="/" className="inline-block mt-12 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg shadow-indigo-600/20">Back to Archive</Link>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.SETUP);
  const [data, setData] = useState<InspirationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
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

  const dayInfo = useMemo(() => getDayOfYearInfo(new Date(selectedDate)), [selectedDate]);

  const handleFetchRecommendations = useCallback(async () => {
    try {
      setError(null);
      setLoadingState(LoadingState.CHOOSING_EVENT);
      const recs = await fetchHistoricalRecommendations(dayInfo.dateString, 10);
      setRecommendations(recs);
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
      setError(err.message || "An unexpected disturbance occurred.");
      setLoadingState(LoadingState.ERROR);
    }
  }, [dayInfo, authorName]);

  const isLoading = loadingState === LoadingState.FETCHING_EVENT || loadingState === LoadingState.GENERATING_IMAGE;

  return (
    <div className="w-full flex flex-col items-center min-h-screen">
      {loadingState === LoadingState.SETUP && (
        <div className="max-w-xl w-full my-auto space-y-12 animate-in slide-in-from-bottom-12 duration-1000 pt-10 px-4">
          <div className="p-10 sm:p-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-xl space-y-12 relative overflow-hidden backdrop-blur-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight text-slate-900 dark:text-white">Divine Echo</h1>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.5em] mt-4 font-black">2026 Resilience Hub</p>
              <div className="mt-8 flex flex-col items-center">
                <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full flex items-center gap-4 transition-colors">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Day Position</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{dayInfo.current} / {dayInfo.total}</span>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] font-black ml-1">Observer Name</label>
                <input type="text" value={authorName} onChange={(e) => { setAuthorName(e.target.value); localStorage.setItem(AUTHOR_KEY, e.target.value); }} className="w-full px-6 py-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-white/10 outline-none font-medium transition-all text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] font-black ml-1">Target Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-6 py-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-white/10 outline-none font-medium transition-all text-slate-900 dark:text-white" />
              </div>
              <button onClick={handleFetchRecommendations} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-xl shadow-indigo-600/30 active:scale-95">Scan Archives</button>
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
              <Link to="/about" className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400 hover:text-indigo-600 transition-all">About Platform</Link>
            </div>
          </div>
          {history.length > 0 && (
            <div className="space-y-6 pb-20">
              <h3 className="text-center text-[10px] uppercase font-black tracking-[0.4em] text-slate-400">Personal Archive</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.map((item, idx) => (
                  <div key={idx} className="group relative flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] hover:border-indigo-500/50 transition-all text-left shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                    <button onClick={() => { setData(item); setLoadingState(LoadingState.COMPLETED); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-1 flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm bg-slate-100 dark:bg-white/5 shrink-0">
                        {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{item.eventTitle}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 tracking-widest uppercase font-black">{item.dateString}</p>
                      </div>
                    </button>
                    <button onClick={(e) => deleteFromHistory(e, idx)} className="p-3 text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-90 z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="max-w-4xl w-full my-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 pt-10 px-4">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Resonance Threads</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black">Archive Extraction Successful</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map((rec, idx) => (
              <button 
                key={rec.id} 
                onClick={() => handleSelectEvent(rec)} 
                className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] text-left hover:border-indigo-500/50 hover:shadow-2xl transition-all group active:scale-95 flex flex-col h-full shadow-md animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight pr-3">{rec.title}</h3>
                  <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400 shrink-0">{rec.year}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-serif italic leading-relaxed mt-auto line-clamp-3">{rec.description}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-4 text-[10px] uppercase font-black text-slate-400 dark:text-white/20 hover:text-slate-900 dark:hover:text-white transition-all tracking-[0.4em]">Abort Archive Sync</button>
        </div>
      )}

      {isLoading && (
        <div className="my-auto pt-20">
          <ShimmerLoader text={loadingState === LoadingState.FETCHING_EVENT ? 'Manifesting Resonance' : 'Weaving Visual Essence'} />
        </div>
      )}

      {data && loadingState === LoadingState.COMPLETED && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-32 pt-10 px-4">
          <InspirationCard 
            data={data} 
            showControls={true} 
            onUpdate={(u) => setData(prev => prev ? {...prev, ...u} : null)} 
            onSave={() => saveToHistory(data)}
          />
          <div className="mt-20 flex justify-center">
            <button onClick={() => { setData(null); setLoadingState(LoadingState.SETUP); }} className="px-12 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-full text-[10px] uppercase font-black tracking-[0.4em] transition-all shadow-sm">Archival Control</button>
          </div>
        </div>
      )}

      {loadingState === LoadingState.ERROR && (
        <div className="my-auto text-center p-14 bg-white dark:bg-slate-900 rounded-[3rem] border border-red-100 dark:border-red-500/20 max-w-md shadow-2xl pt-20 mx-4">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-red-500 mb-4">Sync Interrupted</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">{error}</p>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-lg shadow-red-600/20 active:scale-95">Reinitialize Systems</button>
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
