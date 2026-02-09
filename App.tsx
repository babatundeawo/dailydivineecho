
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { getDayOfYearInfo } from './utils/dateUtils.ts';
import { fetchDailyInspiration, generateInspirationalImage, fetchHistoricalRecommendations } from './services/geminiService.ts';
import { InspirationData, LoadingState, HistoricalRecommendation } from './types.ts';
import InspirationCard from './components/InspirationCard.tsx';

const HISTORY_INDEX_KEY = 'divine_echo_index_v6';
const HISTORY_ITEM_PREFIX = 'divine_echo_item_v6_';
const AUTHOR_KEY = 'divine_echo_author_name_v6';
const DEFAULT_AUTHOR = "Awaiting Soul";
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
        return ["Scanning archival depths...", "Calibrating spiritual resonance...", "Finding the most intriguing node...", "Decoding historical ripples..."];
      case LoadingState.FETCHING_EVENT:
        return ["Weaving your master narrative...", "Infusing witty enthusiasm...", "Applying zero-hyphen logic...", "Grounding in ancient wisdom..."];
      case LoadingState.GENERATING_IMAGE:
        return ["Painting visual echoes...", "Developing cinematic light...", "Capturing historical aura...", "Manifesting visual truth..."];
      default:
        return ["Calibrating..."];
    }
  }, [state]);

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [statusMessages]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + (Math.random() * 10), 99));
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center space-y-16 animate-in fade-in zoom-in-95 duration-1000 p-8 min-h-[600px] w-full max-w-xl">
      <div className="relative w-64 h-64 flex items-center justify-center">
        <div className="absolute inset-0 border-[2px] border-indigo-500/10 rounded-full animate-[spin_12s_linear_infinite]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
        </div>
        <div className="absolute inset-10 border-[1px] border-emerald-500/10 rounded-full animate-[spin_8s_linear_infinite_reverse]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
        </div>
        <div className="absolute inset-20 bg-gradient-to-br from-indigo-600/10 to-emerald-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="z-10 flex flex-col items-center">
          <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{Math.floor(progress)}%</span>
        </div>
      </div>

      <div className="space-y-8 text-center w-full">
        <div className="h-12 overflow-hidden">
          <h2 className="text-3xl font-serif italic text-slate-800 dark:text-slate-100 animate-in slide-in-from-bottom-2 fade-in duration-700 tracking-tight" key={statusMessages[messageIndex]}>
            {statusMessages[messageIndex]}
          </h2>
        </div>
        
        <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner max-w-xs mx-auto">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <p className="text-[11px] uppercase tracking-[1em] text-slate-400 font-black animate-pulse ml-2">Archival Synchronization</p>
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
  const [historyIndex, setHistoryIndex] = useState<HistoryMetadata[]>([]);
  
  useEffect(() => {
    const savedIndex = localStorage.getItem(HISTORY_INDEX_KEY);
    if (savedIndex) try { setHistoryIndex(JSON.parse(savedIndex)); } catch (e) {}
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
        setError("This archival fragment is lost.");
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

  const handleDeepScan = useCallback(async () => {
    try {
      setError(null);
      setLoadingState(LoadingState.SCANNING);
      
      // Internal intelligent selection: Fetch many, pick the most "intriguing"
      const recs = await fetchHistoricalRecommendations(dayInfo.dateString, 20);
      const topEvent = recs[0]; // First one is prioritized by prompt
      
      setLoadingState(LoadingState.FETCHING_EVENT);
      const info = await fetchDailyInspiration({ 
        current: dayInfo.current, total: dayInfo.total, formatted: dayInfo.formatted, 
        dateString: dayInfo.dateString, userName: authorName, selectedEvent: topEvent
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

  const isLoading = loadingState !== LoadingState.SETUP && loadingState !== LoadingState.COMPLETED && loadingState !== LoadingState.ERROR;

  return (
    <div className="w-full flex flex-col items-center min-h-screen px-6 py-12 max-w-7xl mx-auto overflow-hidden bg-slate-50/30 dark:bg-transparent">
      {loadingState === LoadingState.SETUP && (
        <div className="max-w-3xl w-full my-auto space-y-20 animate-in slide-in-from-bottom-16 duration-1000">
          <div className="p-12 sm:p-20 bg-white/70 dark:bg-slate-900/40 border dark:border-white/5 rounded-[4rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="text-center">
              <h1 className="text-7xl font-serif font-black tracking-tighter text-slate-900 dark:text-white mb-4">Divine Echo</h1>
              <p className="text-[12px] text-indigo-600 dark:text-indigo-400 uppercase font-black tracking-[0.8em]">Manifest Destiny 2026</p>
              
              <div className="mt-14 inline-flex items-center px-10 py-3 bg-slate-950/5 dark:bg-white/5 rounded-full gap-6">
                 <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Temporal Progress</span>
                    <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{dayInfo.current} <span className="text-slate-200 dark:text-white/10">/</span> {dayInfo.total}</span>
                 </div>
                 <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Node</span>
                    <span className="text-lg font-serif italic text-indigo-600 dark:text-indigo-400">{dayInfo.dateString}</span>
                 </div>
              </div>
            </div>
            
            <div className="mt-16 space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-black ml-6">Divine Witness</label>
                  <input type="text" value={authorName} onChange={(e) => { setAuthorName(e.target.value); localStorage.setItem(AUTHOR_KEY, e.target.value); }} className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border dark:border-white/5 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium shadow-inner" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-slate-400 uppercase tracking-widest font-black ml-6">Temporal Window</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border dark:border-white/5 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white font-medium shadow-inner" />
                </div>
              </div>
              <button onClick={handleDeepScan} className="w-full py-9 bg-indigo-600 text-white rounded-[3rem] font-black uppercase tracking-[0.2em] text-[14px] shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95">Initiate Resonance Scan</button>
            </div>
          </div>

          {historyIndex.length > 0 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="flex items-center justify-center gap-6">
                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                <h3 className="text-[11px] uppercase font-black tracking-[1em] text-slate-400">Stored Echoes</h3>
                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {historyIndex.map((item, idx) => (
                  <button key={item.id} onClick={() => loadFromHistory(item.id)} className="group relative flex items-center gap-6 p-6 bg-white dark:bg-slate-900 border dark:border-white/5 rounded-[2.5rem] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 text-left shadow-lg overflow-hidden animate-in fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="w-20 h-20 rounded-3xl overflow-hidden border dark:border-white/5 shadow-md shrink-0">
                      {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />}
                    </div>
                    <div className="flex-1 min-w-0 pr-10">
                      <p className="text-base font-bold truncate text-slate-800 dark:text-slate-100">{item.eventTitle}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{item.dateString}</p>
                    </div>
                    <div onClick={(e) => deleteFromHistory(e, item.id)} className="absolute top-6 right-6 p-2 text-slate-200 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="my-auto">
          <ShimmerLoader state={loadingState} />
        </div>
      )}

      {data && loadingState === LoadingState.COMPLETED && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            <InspirationCard data={data} onUpdate={(u) => setData(prev => prev ? {...prev, ...u} : null)} onSave={() => saveToHistory(data)} />
            <button onClick={() => { setData(null); setLoadingState(LoadingState.SETUP); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-20 px-20 py-8 bg-white/50 dark:bg-slate-900 border dark:border-white/5 text-slate-400 rounded-full text-[11px] uppercase font-black tracking-[0.5em] shadow-xl hover:text-indigo-600 transition-all active:scale-95 backdrop-blur-3xl">Return to Sanctuary</button>
          </div>
        </div>
      )}

      {loadingState === LoadingState.ERROR && (
        <div className="my-auto text-center p-16 bg-white dark:bg-slate-900 rounded-[4rem] border border-red-100 dark:border-red-900/20 max-w-lg shadow-2xl animate-in zoom-in-95">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-4xl font-serif font-bold text-red-600 mb-6">Manifestation Error</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">{error}</p>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-7 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] text-[12px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl">Back to Sanctuary</button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen font-sans transition-colors duration-500 selection:bg-indigo-500 selection:text-white">
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainApp />} />
        </Routes>
      </HashRouter>
    </div>
  );
};

export default App;
