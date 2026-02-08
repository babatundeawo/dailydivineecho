
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { getDayOfYearInfo } from './utils/dateUtils.ts';
import { fetchDailyInspiration, generateInspirationalImage, fetchHistoricalRecommendations } from './services/geminiService.ts';
import { InspirationData, LoadingState, HistoricalRecommendation, HistoricalEra, ImpactCategory } from './types.ts';
import InspirationCard from './components/InspirationCard.tsx';

const HISTORY_INDEX_KEY = 'divine_echo_index_v5';
const HISTORY_ITEM_PREFIX = 'divine_echo_item_v5_';
const AUTHOR_KEY = 'divine_echo_author_name_v5';
const DEFAULT_AUTHOR = "Babátúndé Awóyẹmí";
const MAX_HISTORY_ITEMS = 50;

const ERAS: HistoricalEra[] = ['All', 'Ancient', 'Medieval', 'Renaissance', 'Industrial', 'Modern', 'Contemporary'];
const CATEGORIES: ImpactCategory[] = ['All', 'Science', 'Arts', 'Politics', 'Religion', 'Discovery', 'Conflict'];

interface HistoryMetadata {
  id: string;
  eventTitle: string;
  dateString: string;
  imageUrl?: string;
  timestamp: number;
}

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSmartDefaults = (dateStr: string): { era: HistoricalEra, category: ImpactCategory } => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  
  if (dayOfWeek === 0) return { era: 'Medieval', category: 'Religion' };
  if (dayOfWeek === 1) return { era: 'Modern', category: 'Politics' };
  if (dayOfWeek === 2) return { era: 'Industrial', category: 'Science' };
  if (dayOfWeek === 3) return { era: 'Renaissance', category: 'Discovery' };
  if (dayOfWeek === 4) return { era: 'Medieval', category: 'Conflict' };
  if (dayOfWeek === 5) return { era: 'Contemporary', category: 'Arts' };
  if (dayOfWeek === 6) return { era: 'Renaissance', category: 'Arts' };

  return { era: 'All', category: 'All' };
};

const ShimmerLoader: React.FC<{ state: LoadingState }> = ({ state }) => {
  const [progress, setProgress] = useState(0);
  
  const statusMessages = useMemo(() => {
    switch (state) {
      case LoadingState.SCANNING:
        return ["Inverting timeline...", "Analyzing archival harmonics...", "Parsing historical ripples...", "Decoding resonance patterns..."];
      case LoadingState.FETCHING_EVENT:
        return ["Weaving narrative threads...", "Infusing spiritual wisdom...", "Engaging storytelling logic...", "Synthesizing enthusiasm..."];
      case LoadingState.GENERATING_IMAGE:
        return ["Rendering cinematic frames...", "Painting visual echoes...", "Calibrating lens harmonics...", "Finalizing manifestation..."];
      default:
        return ["Processing..."];
    }
  }, [state]);

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [statusMessages]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + (Math.random() * 15), 98));
    }, 800);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000 p-8 min-h-[500px] w-full max-w-lg">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <div className="absolute inset-0 border-[1px] border-indigo-500/10 rounded-full animate-[spin_10s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
        </div>
        <div className="absolute inset-8 border-[1px] border-emerald-500/10 rounded-full animate-[spin_6s_linear_infinite_reverse]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
        </div>
        <div className="absolute inset-16 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-[inset_0_0_20px_rgba(79,70,229,0.1)]"></div>
        <div className="absolute inset-20 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="z-10 text-indigo-600 dark:text-indigo-400 font-black text-2xl tracking-tighter">
          {Math.floor(progress)}%
        </div>
      </div>

      <div className="space-y-6 text-center w-full">
        <div className="h-10">
          <h2 className="text-3xl font-serif italic text-slate-800 dark:text-slate-100 animate-in slide-in-from-bottom-2 fade-in duration-500 tracking-tight" key={statusMessages[messageIndex]}>
            {statusMessages[messageIndex]}
          </h2>
        </div>
        
        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] uppercase tracking-[0.6em] text-slate-400 font-black animate-pulse">Archival Sync In Progress</p>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const About: React.FC = () => (
  <div className="max-w-3xl w-full mx-auto py-12 px-6 animate-in slide-in-from-bottom-8 duration-700">
    <div className="p-10 sm:p-16 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3.5rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <h1 className="text-4xl font-serif font-bold mb-8 text-slate-900 dark:text-white">The Echo Protocol</h1>
      <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          <strong className="text-indigo-600 dark:text-indigo-400">Daily Divine Echo</strong> is a high-performance resonance engine built for the visionaries of 2026.
        </p>
        <p>
          We bridge historical legacy with modern Christian wisdom, delivering spellbinding narratives that empower your digital presence.
        </p>
      </div>
      <Link to="/" className="inline-block mt-12 px-12 py-5 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 transition-colors">Back to interface</Link>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.SETUP);
  const [data, setData] = useState<InspirationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [authorName, setAuthorName] = useState<string>(localStorage.getItem(AUTHOR_KEY) || DEFAULT_AUTHOR);
  const [historyIndex, setHistoryIndex] = useState<HistoryMetadata[]>([]);
  const [recommendations, setRecommendations] = useState<HistoricalRecommendation[]>([]);
  
  const [eraFilter, setEraFilter] = useState<HistoricalEra>('All');
  const [categoryFilter, setCategoryFilter] = useState<ImpactCategory>('All');
  const [filtersManuallySet, setFiltersManuallySet] = useState(false);

  useEffect(() => {
    const savedIndex = localStorage.getItem(HISTORY_INDEX_KEY);
    if (savedIndex) try { setHistoryIndex(JSON.parse(savedIndex)); } catch (e) {}
  }, []);

  useEffect(() => {
    if (!filtersManuallySet) {
      const { era, category } = getSmartDefaults(selectedDate);
      setEraFilter(era);
      setCategoryFilter(category);
    }
  }, [selectedDate, filtersManuallySet]);

  const saveToHistory = useCallback((newItem: InspirationData) => {
    const itemId = `echo_${Date.now()}`;
    const metadata: HistoryMetadata = {
      id: itemId,
      eventTitle: newItem.eventTitle,
      dateString: newItem.dateString,
      imageUrl: newItem.imageUrl,
      timestamp: Date.now()
    };

    try {
      // Store full content under a unique key
      localStorage.setItem(`${HISTORY_ITEM_PREFIX}${itemId}`, JSON.stringify(newItem));
      
      // Update the lightweight index
      const updatedIndex = [metadata, ...historyIndex].slice(0, MAX_HISTORY_ITEMS);
      setHistoryIndex(updatedIndex);
      localStorage.setItem(HISTORY_INDEX_KEY, JSON.stringify(updatedIndex));

      // Synchronize physical storage - remove orphaned keys
      const existingKeys = Object.keys(localStorage).filter(k => k.startsWith(HISTORY_ITEM_PREFIX));
      const validKeys = updatedIndex.map(m => `${HISTORY_ITEM_PREFIX}${m.id}`);
      existingKeys.forEach(k => {
        if (!validKeys.includes(k)) localStorage.removeItem(k);
      });

    } catch (e) {
      console.error("Archive storage failed:", e);
      setError("Archive capacity reached. Please clear old echoes.");
    }
  }, [historyIndex]);

  const loadFromHistory = useCallback((itemId: string) => {
    const saved = localStorage.getItem(`${HISTORY_ITEM_PREFIX}${itemId}`);
    if (saved) {
      try {
        setData(JSON.parse(saved));
        setLoadingState(LoadingState.COMPLETED);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        console.error("Echo retrieval failed:", e);
        setError("This archive fragment has been corrupted or lost.");
      }
    }
  }, []);

  const deleteFromHistory = useCallback((e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const updatedIndex = historyIndex.filter(m => m.id !== itemId);
    setHistoryIndex(updatedIndex);
    localStorage.setItem(HISTORY_INDEX_KEY, JSON.stringify(updatedIndex));
    localStorage.removeItem(`${HISTORY_ITEM_PREFIX}${itemId}`);
  }, [historyIndex]);

  const dayInfo = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return getDayOfYearInfo(new Date(year, month - 1, day));
  }, [selectedDate]);

  const handleFetchRecommendations = useCallback(async () => {
    try {
      setError(null);
      setLoadingState(LoadingState.SCANNING);
      const recs = await fetchHistoricalRecommendations(dayInfo.dateString, 15, { era: eraFilter, category: categoryFilter });
      setTimeout(() => {
        setRecommendations(recs);
        setLoadingState(LoadingState.CHOOSING_EVENT);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setLoadingState(LoadingState.ERROR);
    }
  }, [dayInfo, eraFilter, categoryFilter]);

  const handleStartGeneration = useCallback(async (event: HistoricalRecommendation) => {
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

  const isLoading = loadingState === LoadingState.SCANNING || loadingState === LoadingState.FETCHING_EVENT || loadingState === LoadingState.GENERATING_IMAGE;

  return (
    <div className="w-full flex flex-col items-center min-h-screen px-4 py-8 max-w-7xl mx-auto overflow-hidden">
      {loadingState === LoadingState.SETUP && (
        <div className="max-w-2xl w-full my-auto space-y-12 animate-in slide-in-from-bottom-16 duration-1000">
          <div className="p-8 sm:p-14 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3.5rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="text-center">
              <h1 className="text-5xl font-serif font-bold tracking-tighter text-slate-900 dark:text-white">Divine Echo</h1>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.6em] mt-4 font-black">2026 Resilience Hub</p>
              <div className="mt-10 inline-flex items-center px-6 py-2 bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-full gap-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Day</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{dayInfo.current} <span className="text-slate-200 dark:text-white/10">/</span> {dayInfo.total}</span>
              </div>
            </div>
            
            <div className="mt-12 space-y-8 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black ml-4">Observer</label>
                  <input type="text" value={authorName} onChange={(e) => { setAuthorName(e.target.value); localStorage.setItem(AUTHOR_KEY, e.target.value); }} className="w-full px-6 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black ml-4">Temporal Node</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium" />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-4">
                    <label className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black">Era Selection</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ERAS.map(e => (
                      <button key={e} onClick={() => { setEraFilter(e); setFiltersManuallySet(true); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${eraFilter === e ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-4">
                    <label className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black">Impact Category</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => { setCategoryFilter(c); setFiltersManuallySet(true); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === c ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleFetchRecommendations} className="w-full py-7 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[12px] shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all active:scale-95">Scan Archival Channels</button>
            </div>
            <Link to="/about" className="block mt-10 text-[9px] uppercase font-black tracking-[0.5em] text-slate-300 hover:text-indigo-600 transition-all text-center">Manifesto</Link>
          </div>

          {historyIndex.length > 0 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[100px]" />
                <h3 className="text-[10px] uppercase font-black tracking-[1em] text-slate-400 text-center">Personal Echoes</h3>
                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1 max-w-[100px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4">
                {historyIndex.map((item, idx) => (
                  <div key={item.id} className="group relative flex items-center gap-5 p-5 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[2.5rem] hover:border-indigo-500/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left shadow-lg overflow-hidden animate-in fade-in slide-in-from-right-12" style={{ animationDelay: `${idx * 100}ms` }}>
                    <button onClick={() => loadFromHistory(item.id)} className="flex-1 flex items-center gap-5 min-w-0">
                      <div className="w-16 h-16 rounded-3xl overflow-hidden border dark:border-white/5 shadow-md bg-slate-100 dark:bg-slate-800 shrink-0">
                        {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{item.eventTitle}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{item.dateString}</p>
                      </div>
                    </button>
                    <button onClick={(e) => deleteFromHistory(e, item.id)} className="p-3 text-slate-200 dark:text-slate-800 hover:text-red-500 transition-all rounded-full hover:bg-red-50">
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
        <div className="max-w-6xl w-full space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 mt-10">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Select Resonance</h2>
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 uppercase tracking-[0.6em] font-black">
              <span>{recommendations.length} Archived Fragments</span>
              <span className="text-indigo-500">Filtered for {eraFilter} {categoryFilter}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendations.map((rec, idx) => (
              <button key={rec.id} onClick={() => handleStartGeneration(rec)} className="p-10 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3.5rem] text-left hover:border-indigo-600 hover:shadow-2xl transition-all group active:scale-[0.98] shadow-xl relative overflow-hidden animate-in slide-in-from-bottom-12 fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-start mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-[1.2] pr-6">{rec.title}</h3>
                  <span className="text-[11px] font-black bg-indigo-600 text-white px-4 py-1.5 rounded-full shrink-0 shadow-lg">{rec.year}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic line-clamp-3 leading-relaxed border-t dark:border-white/5 pt-6">{rec.description}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-8 text-[9px] uppercase font-black text-slate-400 hover:text-indigo-600 tracking-[0.8em] transition-all">Back to scanner config</button>
        </div>
      )}

      {isLoading && (
        <div className="my-auto">
          <ShimmerLoader state={loadingState} />
        </div>
      )}

      {data && loadingState === LoadingState.COMPLETED && (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20 mt-10">
          <InspirationCard data={data} showControls={true} onUpdate={(u) => setData(prev => prev ? {...prev, ...u} : null)} onSave={() => saveToHistory(data)} />
          <div className="flex justify-center mt-16">
            <button onClick={() => { setData(null); setLoadingState(LoadingState.SETUP); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-16 py-7 bg-white dark:bg-slate-900 border dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-full text-[11px] uppercase font-black tracking-[0.5em] shadow-2xl hover:text-indigo-600 transition-all active:scale-95">Return to Archive Core</button>
          </div>
        </div>
      )}

      {loadingState === LoadingState.ERROR && (
        <div className="my-auto text-center p-14 bg-white dark:bg-slate-900 rounded-[4rem] border border-red-100 dark:border-red-900/30 max-w-lg shadow-[0_30px_100px_rgba(239,68,68,0.1)] animate-in zoom-in-95">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-10 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-4xl font-serif font-bold text-red-600 mb-8">System Instability</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 leading-relaxed font-medium">{error}</p>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-7 bg-red-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-red-600/30 active:scale-95 transition-all">Attempt Reconnection</button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen font-sans transition-colors duration-500 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
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
