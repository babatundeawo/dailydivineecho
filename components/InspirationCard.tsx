
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { InspirationData } from '../types';
import html2canvas from 'html2canvas';
import { generateTTS } from '../services/geminiService';

interface InspirationCardProps {
  data: InspirationData;
  onDelete?: () => void;
  onSave?: (data: InspirationData) => void;
  onUpdate?: (updates: Partial<InspirationData>) => void;
  showControls?: boolean;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ data, onDelete, onSave, onUpdate, showControls = false }) => {
  const hiddenCaptureRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedType, setCopiedType] = useState<'li' | 'x' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [scale, setScale] = useState(1);

  const hashtags = "#DailyDivineEcho #DayOfYear #Leadership #Legacy #Growth #LifelongLearning #2026";

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const parentWidth = wrapperRef.current.offsetWidth;
        setScale(parentWidth / 1080);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const verseFontSize = useMemo(() => {
    const len = data.bibleVerse.length;
    if (len > 300) return 'text-[18px] leading-[1.3]';
    if (len > 120) return 'text-[28px] leading-[1.2]';
    return 'text-[42px] font-bold leading-[1.0]';
  }, [data.bibleVerse]);

  const generateFullPost = (content: string, type: 'LinkedIn' | 'X') => {
    const header = `✨ DIVINE ECHO | ${data.dateString}\n📅 Day ${data.dayNumber} of ${data.totalDays}\n🌟 Legacy Moment: ${data.eventTitle}\n\n`;
    const footer = `\n\n${hashtags}`;
    return `${header}${content}${footer}`;
  };

  const handleDownload = async () => {
    if (!hiddenCaptureRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const canvas = await html2canvas(hiddenCaptureRef.current, {
        useCORS: true,
        scale: 2, 
        backgroundColor: '#ffffff',
        width: 1080,
        height: 1350,
      });
      const link = document.createElement('a');
      link.download = `DivineEcho-Day${data.dayNumber}-${data.dateString.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Export Error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleListen = async () => {
    if (isSpeaking) return;
    try {
      setIsSpeaking(true);
      const text = `${data.eventTitle}. ${data.bibleVerse}. ${data.bibleReference}.`;
      const base64Audio = await generateTTS(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, 24000);
      const dataInt16 = new Int16Array(bytes.buffer);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  const handleManualSave = () => {
    if (onSave && !isSaved) {
      onSave(data);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const CardContent = ({ isCapture = false }: { isCapture?: boolean }) => (
    <div className="relative flex flex-col h-full w-full bg-white overflow-hidden" data-capture-node={isCapture ? "true" : "false"}>
      <div className="absolute inset-0 bg-white" />
      {(data.customBg || data.imageUrl) && (
        <img src={data.customBg || data.imageUrl} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100 transition-opacity duration-1000" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/60 z-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full p-12 md:p-16 items-center text-center">
        <div className="flex flex-col items-center mb-8 w-full">
          <div className="flex items-center gap-3 mb-4">
             <span className="px-4 py-1.5 bg-indigo-600 text-white text-[11px] font-black uppercase rounded-full shadow-lg">DAY {data.dayNumber}</span>
             <span className="text-[15px] font-black uppercase tracking-[0.4em] text-white drop-shadow-md">{data.dateString}</span>
          </div>
          <h1 className="text-[44px] font-bold text-white tracking-tight uppercase leading-[1.1] drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">{data.eventTitle}</h1>
          <div className="w-24 h-1 bg-indigo-500 mt-6 rounded-full shadow-lg" />
        </div>
        <div className="mt-auto mb-12 max-w-5xl">
          <div className="w-16 h-0.5 bg-white/40 mb-8 mx-auto" />
          <blockquote className={`${verseFontSize} font-serif italic text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] px-6 leading-tight`}>
            "{data.bibleVerse}"
          </blockquote>
          <cite className="mt-6 block text-[20px] font-black uppercase tracking-[0.6em] text-white/90 not-italic drop-shadow-lg">{data.bibleReference}</cite>
        </div>
        <div className="w-full flex justify-between items-end border-t border-white/20 pt-8 mt-4">
          <div className="text-left space-y-1">
            <p className="text-[11px] uppercase text-white/50 font-black tracking-widest">Observer</p>
            <p className="text-[18px] font-serif italic text-white/80">{data.userName}</p>
          </div>
          <span className="text-[26px] font-black uppercase tracking-[0.6em] text-white opacity-20">DIVINE ECHO</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-16 w-full max-w-4xl mx-auto py-10 px-4">
      <div style={{ position: 'fixed', top: 0, left: '-5000px', width: '1080px', height: '1350px', zIndex: -9999, pointerEvents: 'none' }}>
        <div ref={hiddenCaptureRef} style={{ width: '1080px', height: '1350px' }}>
          <CardContent isCapture={true} />
        </div>
      </div>

      <div ref={wrapperRef} className="w-full relative" style={{ height: `calc(${scale} * 1350px)` }}>
        <div className="absolute top-0 left-0 overflow-hidden bg-white border border-slate-200 dark:border-white/10 flex flex-col shadow-2xl" style={{ width: '1080px', height: '1350px', transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: '60px' }}>
          <CardContent />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 max-w-[900px] mx-auto">
        <button onClick={handleListen} className={`py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all ${isSpeaking ? 'animate-pulse text-indigo-600 border-indigo-200 shadow-md' : 'shadow-sm'}`}>{isSpeaking ? 'Narrating...' : 'Listen to Echo'}</button>
        <button onClick={handleDownload} className="py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-indigo-600/30">Download Frame</button>
        <button onClick={handleManualSave} className={`py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] border transition-all ${isSaved ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm'}`}>
          {isSaved ? '✓ Saved' : 'Archive Echo'}
        </button>
        <label className="flex items-center justify-center gap-2 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm transition-all">
          <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if(file && onUpdate) { const reader = new FileReader(); reader.onload = () => onUpdate({ customBg: reader.result as string }); reader.readAsDataURL(file); } }} /> Scene Swap
        </label>
      </div>

      <div className="space-y-12 max-w-[850px] mx-auto">
        {/* LinkedIn Post Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-xl animate-in slide-in-from-bottom-6 duration-700">
          <div className="p-10 sm:p-14 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-black uppercase tracking-[0.5em] text-indigo-600 dark:text-indigo-400">LinkedIn Narrative</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-wider">{data.eventTitle}</span>
                </div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(generateFullPost(data.linkedInPost, 'LinkedIn')); setCopiedType('li'); setTimeout(() => setCopiedType(null), 2000); }} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${copiedType === 'li' ? 'bg-green-600 text-white' : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/20'}`}>
                {copiedType === 'li' ? '✓ Copied' : 'Copy Post'}
              </button>
            </div>
          </div>
          <div className="p-10 sm:p-14">
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-sm sm:text-base p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner">
              {data.linkedInPost}
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
              <p className="text-slate-400 dark:text-slate-500 text-[11px] font-bold italic mb-3">Post Footer & Hashtags:</p>
              <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">{hashtags}</p>
            </div>
          </div>
        </div>

        {/* X/Twitter Post Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-xl animate-in slide-in-from-bottom-6 duration-700 delay-100">
          <div className="p-10 sm:p-14 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 bg-blue-500 rounded-full" />
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-black uppercase tracking-[0.5em] text-blue-500">X Resonance</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-wider">{data.dateString}</span>
                </div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(generateFullPost(data.twitterPost, 'X')); setCopiedType('x'); setTimeout(() => setCopiedType(null), 2000); }} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${copiedType === 'x' ? 'bg-green-600 text-white' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20'}`}>
                {copiedType === 'x' ? '✓ Copied' : 'Copy Post'}
              </button>
            </div>
          </div>
          <div className="p-10 sm:p-14">
            <div className="text-slate-700 dark:text-slate-300 italic font-sans text-lg p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner leading-relaxed">
              {data.twitterPost}
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
              <p className="text-blue-500 dark:text-blue-400 text-xs font-medium">{hashtags}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspirationCard;
