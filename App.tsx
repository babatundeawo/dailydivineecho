
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { getDayOfYearInfo } from './utils/dateUtils.ts';
import { fetchDailyInspiration, generateInspirationalImage, fetchHistoricalRecommendations } from './services/geminiService.ts';
import { InspirationData, LoadingState, HistoricalRecommendation } from './types.ts';
import InspirationCard from './components/InspirationCard.tsx';

const HISTORY_INDEX_KEY = 'divine_echo_index_v7';
const HISTORY_ITEM_PREFIX = 'divine_echo_item_v7_';
const AUTHOR_KEY = 'divine_echo_author_name_v7';
const DEFAULT_AUTHOR = "Awaiting Witness";
const MAX_HISTORY_ITEMS = 50;

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

const ShimmerLoader: React.FC<{ state: LoadingState }> = ({ state }) => {
  const [progress, setProgress] = useState(0);
  const statusMessages = useMemo(() => {
    switch (state) {
      case LoadingState.SCANNING:
        return ["Piercing archival depths...", "Finding intrigued nodes...", "Parsing temporal ripples...", "Decoding ancient harmonics..."];
      case LoadingState.FETCHING_EVENT:
        return ["Weaving a master narrative...", "Infusing witty energy...", "Applying zero-hyphen logic...", "Synthesizing deep wisdom..."];
      case LoadingState.GENERATING_IMAGE:
        return ["Painting visual echoes...", "Calibrating cinematic light...", "Capturing aura...", "Developing art..."];
      default:
        return ["Connecting..."];
    }
  }, [state]);

  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setMessageIndex((prev) => (prev + 1) % statusMessages.length), 3000);
    return () => clearInterval(timer);
  }, [statusMessages]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + (Math.random() * 8), 99)), 800);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000 p-8 min-h-[500px] w-full max-w-lg">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 border-[2px] border-indigo-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-4 border-[1px] border-emerald-500/10 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
        <div className="z-10 text-4xl font-black text-indigo-600 dark:text-indigo-400">{Math.floor(progress)}%</div>
      </div>
      <div className="space-y-6 text-center w-full">
        <h2 className="text-2xl font-serif italic text-slate-800 dark:text-slate-100 transition-all duration-700" key={messageIndex}>
          {statusMessages[messageIndex]}
        </h2>
        <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.SETUP);
  const [data, setData] = useState<InspirationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [authorName, setAuthorName] = useState<string>(localStorage.getItem(AUTHOR_KEY) || DEFAULT_AUTHOR);
  const [recommendations, setRecommendations] = useState<HistoricalRecommendation[]>([]);
  const [historyIndex, setHistoryIndex] = useState<HistoryMetadata[]>([]);
  
  useEffect(() => {
    const savedIndex = localStorage.getItem(HISTORY_INDEX_KEY);
    if (savedIndex) {
      try { 
        setHistoryIndex(JSON.parse(savedIndex)); 
      } catch (e) {
        console.error("Failed to load history index", e);
      }
    }
  }, []);

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
      localStorage.setItem(`${HISTORY_ITEM_PREFIX}${itemId}`, JSON.stringify(newItem));
      const updatedIndex = [metadata, ...historyIndex].slice(0, MAX_HISTORY_ITEMS);
      setHistoryIndex(updatedIndex);
      localStorage.setItem(HISTORY_INDEX_KEY, JSON.stringify(updatedIndex));
    } catch (e) { 
      setError("Storage capacity reached."); 
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
        setError("Echo lost."); 
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

  const handleScan = useCallback(async () => {
    try {
      setError(null);
      setLoadingState(LoadingState.SCANNING);
      const recs = await fetchHistoricalRecommendations(dayInfo.dateString, 10);
      setRecommendations(recs);
      setLoadingState(LoadingState.CHOOSING_EVENT);
    } catch (err: any) {
      setError(err.message || "Archival link severed.");
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
      const imageUrl = await generateInspirationalImage(info);
      setData(prev => prev ? { ...prev, imageUrl } : null);
      setLoadingState(LoadingState.COMPLETED);
    } catch (err: any) {
      setError(err.message || "Manifestation failed.");
      setLoadingState(LoadingState.ERROR);
    }
  }, [dayInfo, authorName]);

  const isWorking = [LoadingState.SCANNING, LoadingState.FETCHING_EVENT, LoadingState.GENERATING_IMAGE].includes(loadingState);

  return (
    <div className="w-full flex flex-col items-center min-h-screen px-4 py-12 max-w-7xl mx-auto text-center overflow-x-hidden">
      {loadingState === LoadingState.SETUP && (
        <div className="max-w-3xl w-full my-auto space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
          <div className="p-10 sm:p-16 bg-white dark:bg-slate-900 border dark:border-white/5 rounded-[4rem] shadow-2xl backdrop-blur-3xl">
            <h1 className="text-6xl font-serif font-black text-slate-900 dark:text-white mb-2">Divine Echo</h1>
            <p className="text-[10px] uppercase font-black tracking-[0.8em] text-indigo-600 dark:text-indigo-400 mb-12">Temporal Wisdom 2026</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              <div className="text-left space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-4">Observer Name</label>
                <input 
                  type="text" 
                  value={authorName} 
                  onChange={(e) => { 
                    setAuthorName(e.target.value); 
                    localStorage.setItem(AUTHOR_KEY, e.target.value); 
                  }} 
                  placeholder="Enter your name..."
                  className="w-full px-6 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border dark:border-white/5 focus:border-indigo-500 outline-none text-slate-900 dark:text-white" 
                />
              </div>
              <div className="text-left space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-4">Temporal Node</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-6 py-4 rounded-3xl bg-slate-50 dark:bg-white/5 border dark:border-white/5 focus:border-indigo-500 outline-none text-slate-900 dark:text-white" />
              </div>
            </div>

            <button onClick={handleScan} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">Scan Archival Depths</button>
          </div>

          {historyIndex.length > 0 && (
            <div className="space-y-8 pb-12">
              <h3 className="text-[10px] uppercase font-black tracking-[1em] text-slate-400">Stored Echoes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {historyIndex.map((item) => (
                  <div key={item.id} className="relative group">
                    <button 
                      onClick={() => loadFromHistory(item.id)} 
                      className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border dark:border-white/5 rounded-3xl shadow-lg hover:-translate-y-1 transition-all"
                    >
                      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shrink-0">
                        {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm font-bold truncate text-slate-800 dark:text-white">{item.eventTitle}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.dateString}</p>
                      </div>
                    </button>
                    <button 
                      onClick={(e) => deleteFromHistory(e, item.id)} 
                      title="Delete Echo"
                      className="absolute -top-2 -right-2 p-3 bg-red-600 text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-xl z-20 border-2 border-white dark:border-slate-900"
                    >
                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
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
        <div className="max-w-6xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center">
            <h2 className="text-5xl font-serif font-black text-slate-900 dark:text-white mb-2">Select Resonance</h2>
            <p className="text-indigo-600 font-black tracking-widest uppercase text-[10px]">Pick an intriguing historical node</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <button key={rec.id} onClick={() => handleSelectEvent(rec)} className="p-8 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[2.5rem] text-left hover:border-indigo-600 hover:shadow-2xl transition-all group shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 pr-4 leading-tight">{rec.title}</h3>
                  <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full">{rec.year}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic line-clamp-3">{rec.description}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="text-slate-400 uppercase text-[10px] font-black tracking-widest hover:text-indigo-600">Back to Scanner</button>
        </div>
      )}

      {isWorking && <ShimmerLoader state={loadingState} />}

      {data && loadingState === LoadingState.COMPLETED && (
        <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
          <InspirationCard 
            data={data} 
            onUpdate={(u) => setData(p => p ? {...p, ...u} : null)} 
            onSave={() => saveToHistory(data)} 
          />
          <button 
            onClick={() => { setData(null); setLoadingState(LoadingState.SETUP); }} 
            className="mt-16 px-16 py-6 bg-white dark:bg-slate-800 text-slate-400 rounded-full text-[10px] uppercase font-black tracking-widest shadow-xl hover:text-indigo-600 transition-all"
          >
            Back to Home
          </button>
        </div>
      )}

      {loadingState === LoadingState.ERROR && (
        <div className="my-auto text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-red-500/20 max-w-lg shadow-2xl">
          <h2 className="text-3xl font-serif font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-slate-500 mb-10">{error}</p>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px]">Retry</button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<MainApp />} />
    </Routes>
  </HashRouter>
);

export default App;
