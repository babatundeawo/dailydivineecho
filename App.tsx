
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
  <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000 p-8">
    <div className="relative w-40 h-40 flex items-center justify-center">
      <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-6 border-2 border-slate-200 dark:border-white/10 rounded-full animate-pulse-slow"></div>
      <div className="absolute inset-12 border-2 border-indigo-500/20 rounded-full animate-pulse"></div>
    </div>
    <div className="space-y-6 text-center w-full max-w-sm">
      <h2 className="text-3xl sm:text-4xl font-serif italic text-slate-800 dark:text-slate-100 animate-pulse">{text}</h2>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 animate-shimmer" style={{ width: '100%' }} />
      </div>
      <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400 font-black">Decrypting Temporal Nodes...</p>
    </div>
  </div>
);

const About: React.FC = () => (
  <div className="max-w-3xl w-full mx-auto py-12 px-6 animate-in slide-in-from-bottom-8 duration-700">
    <div className="p-10 sm:p-16 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
      <h1 className="text-4xl font-serif font-bold mb-8 text-slate-900 dark:text-white">The Echo Protocol</h1>
      <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          <strong className="text-indigo-600 dark:text-indigo-400">Daily Divine Echo</strong> is a high-performance resonance engine built for the visionaries of 2026.
        </p>
        <p>
          We bridge historical legacy with modern Christian wisdom, delivering spellbinding narratives that empower your digital presence across LinkedIn, Instagram, and X.
        </p>
        <div className="pt-8 border-t dark:border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/30 mb-4">The Workflow</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">01</span>
              <span>Target any temporal node on the calendar.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">02</span>
              <span>Select a resonance thread from the archives.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-indigo-600 font-bold">03</span>
              <span>Deploy cinematic frames and viral narratives to your platforms.</span>
            </li>
          </ul>
        </div>
      </div>
      <Link to="/" className="inline-block mt-12 px-12 py-5 bg-indigo-600 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl">Back to interface</Link>
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
      setLoadingState(LoadingState.SCANNING);
      const recs = await fetchHistoricalRecommendations(dayInfo.dateString, 12);
      setTimeout(() => {
        setRecommendations(recs);
        setLoadingState(LoadingState.CHOOSING_EVENT);
      }, 800);
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

  const isLoading = loadingState === LoadingState.SCANNING || loadingState === LoadingState.FETCHING_EVENT || loadingState === LoadingState.GENERATING_IMAGE;

  return (
    <div className="w-full flex flex-col items-center min-h-screen px-4 py-8">
      {loadingState === LoadingState.SETUP && (
        <div className="max-w-xl w-full my-auto space-y-10 animate-in slide-in-from-bottom-16 duration-1000">
          <div className="p-8 sm:p-14 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[4rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="text-center">
              <h1 className="text-5xl font-serif font-bold tracking-tighter text-slate-900 dark:text-white">Divine Echo</h1>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.6em] mt-4 font-black">2026 Resonance Hub</p>
              <div className="mt-10 inline-flex items-center px-6 py-2 bg-slate-50 dark:bg-white/5 border dark:border-white/10 rounded-full gap-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Day</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{dayInfo.current} <span className="text-slate-200 dark:text-white/10">/</span> {dayInfo.total}</span>
              </div>
            </div>
            <div className="mt-12 space-y-8 text-left">
              <div className="space-y-2">
                <label className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black ml-4">Observer</label>
                <input type="text" value={authorName} onChange={(e) => { setAuthorName(e.target.value); localStorage.setItem(AUTHOR_KEY, e.target.value); }} className="w-full px-6 py-5 rounded-3xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black ml-4">Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-6 py-5 rounded-3xl bg-slate-50 dark:bg-white/5 border dark:border-white/10 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white" />
              </div>
              <button onClick={handleFetchRecommendations} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/40">Scan Archives</button>
            </div>
            <Link to="/about" className="block mt-10 text-[9px] uppercase font-black tracking-[0.5em] text-slate-300 hover:text-indigo-600 transition-all text-center">Manifesto</Link>
          </div>

          {/* History Scroll - Mobile First */}
          {history.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-center text-[10px] uppercase font-black tracking-widest text-slate-400">Archived Echoes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.map((item, idx) => (
                  <button key={idx} onClick={() => { setData(item); setLoadingState(LoadingState.COMPLETED); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-3xl text-left shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border dark:border-white/5 shrink-0">
                      {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{item.eventTitle}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">{item.dateString}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loadingState === LoadingState.CHOOSING_EVENT && (
        <div className="max-w-6xl w-full space-y-16 animate-in fade-in zoom-in-95 duration-700 pb-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-serif font-bold text-slate-900 dark:text-white">The Archives</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.8em] font-black">Select a Resonance Thread</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, idx) => (
              <button key={rec.id} onClick={() => handleSelectEvent(rec)} className="p-8 sm:p-12 bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3rem] text-left hover:border-indigo-600 transition-all group active:scale-[0.98] shadow-xl relative overflow-hidden animate-in slide-in-from-bottom-10 fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-[1.1] pr-6">{rec.title}</h3>
                  <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full shrink-0">{rec.year}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-serif italic line-clamp-3">{rec.description}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-8 text-[9px] uppercase font-black text-slate-300 hover:text-white tracking-[0.5em] transition-all">Back to scanner</button>
        </div>
      )}

      {isLoading && (
        <div className="my-auto">
          <ShimmerLoader text={loadingState === LoadingState.SCANNING ? 'Scanning Archives' : loadingState === LoadingState.FETCHING_EVENT ? 'Collating Wisdom' : 'Manifesting Vision'} />
        </div>
      )}

      {data && loadingState === LoadingState.COMPLETED && (
        <div className="w-full max-w-5xl animate-in fade-in duration-1000 pb-20">
          <InspirationCard data={data} showControls={true} onUpdate={(u) => setData(prev => prev ? {...prev, ...u} : null)} onSave={() => saveToHistory(data)} />
          <button onClick={() => { setData(null); setLoadingState(LoadingState.SETUP); }} className="mt-10 px-10 py-5 bg-white dark:bg-slate-900 border dark:border-white/10 text-slate-400 rounded-full text-[10px] uppercase font-black tracking-widest shadow-md">New Scan</button>
        </div>
      )}

      {loadingState === LoadingState.ERROR && (
        <div className="my-auto text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border border-red-100 max-w-lg shadow-3xl">
          <h2 className="text-3xl font-serif font-bold text-red-600 mb-6">Sync Severed</h2>
          <p className="text-base text-slate-500 mb-10">{error}</p>
          <button onClick={() => setLoadingState(LoadingState.SETUP)} className="w-full py-6 bg-red-600 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest">Reconnect Systems</button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen font-sans transition-colors duration-500 overflow-x-hidden">
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
