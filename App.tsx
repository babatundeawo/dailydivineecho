
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { Trash2, History, Info } from 'lucide-react';
import { getDayOfYearInfo } from './utils/dateUtils.ts';
import { fetchDailyInspiration, generateInspirationalImage, fetchHistoricalRecommendations } from './services/geminiService.ts';
import { InspirationData, LoadingState, HistoricalRecommendation } from './types.ts';
import InspirationCard from './components/InspirationCard.tsx';
import AboutPage from './components/AboutPage.tsx';

const HISTORY_INDEX_KEY = 'divine_echo_index_v7';
const HISTORY_ITEM_PREFIX = 'divine_echo_item_v7_';
const AUTHOR_KEY = 'divine_echo_author_name_v7';
const DEFAULT_AUTHOR = "Babátúndé Awóyẹmí";
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
  const [selectedDate] = useState<string>(getLocalDateString());
  const [authorName] = useState<string>(DEFAULT_AUTHOR);
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
            
            <div className="flex flex-col items-center justify-center space-y-4 mb-12">
              <div className="text-center">
                <p className="text-sm font-serif italic text-slate-500 dark:text-slate-400">Witnessing as</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{authorName}</p>
              </div>
              <div className="h-px w-12 bg-slate-100 dark:bg-white/10" />
              <div className="text-center">
                <p className="text-sm font-serif italic text-slate-500 dark:text-slate-400">Temporal Node</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{dayInfo.fullDateString}</p>
              </div>
            </div>

            <button onClick={handleScan} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">Scan Archival Depths</button>
            
            <div className="pt-8">
              <Link to="/about" className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                What is Divine Echo?
              </Link>
            </div>
          </div>

          {historyIndex.length > 0 && (
            <div className="space-y-10 pb-20 w-full overflow-hidden">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/10 rounded-lg">
                    <History className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-[10px] uppercase font-black tracking-[1em] text-slate-400">Stored Echoes</h3>
                </div>
                <div className="h-px flex-1 bg-slate-100 dark:bg-white/5 mx-8 hidden sm:block" />
              </div>

              <div className="relative group">
                <div className="flex gap-6 overflow-x-auto pb-8 px-4 snap-x snap-mandatory no-scrollbar scroll-smooth">
                  {historyIndex.map((item) => (
                    <div 
                      key={item.id} 
                      className="relative flex-none w-[280px] sm:w-[320px] snap-start"
                    >
                      <div className="relative group/card overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                        {/* Thumbnail Image */}
                        <div className="aspect-[4/5] w-full relative overflow-hidden">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" 
                              alt="" 
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <History className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/card:opacity-80 transition-opacity" />
                          
                          {/* Content Overlay */}
                          <div className="absolute inset-0 p-8 flex flex-col justify-end text-left">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">{item.dateString}</p>
                            <h4 className="text-lg font-serif font-bold text-white leading-tight mb-4 line-clamp-2 drop-shadow-md">
                              {item.eventTitle}
                            </h4>
                            
                            <button 
                              onClick={() => loadFromHistory(item.id)}
                              className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all"
                            >
                              Relive Echo
                            </button>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button 
                          onClick={(e) => deleteFromHistory(e, item.id)} 
                          title="Delete Echo"
                          className="absolute top-4 right-4 p-3 bg-red-600/90 text-white rounded-full opacity-0 group-hover/card:opacity-100 transition-all hover:bg-red-700 shadow-xl z-20 backdrop-blur-sm scale-75 group-hover/card:scale-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Scroll Indicators (Optional but nice) */}
                <div className="absolute left-0 top-0 bottom-8 w-12 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute right-0 top-0 bottom-8 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
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
                <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic">{rec.description}</p>
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
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  </HashRouter>
);

export default App;
