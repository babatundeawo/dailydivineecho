
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { InspirationData } from '../types.ts';
import html2canvas from 'html2canvas';
import { generateTTS } from '../services/geminiService.ts';

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

  const hashtags = "#DailyDivineEcho #Legacy #Growth #Humanity #2026";

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

  const summaryFontSize = useMemo(() => {
    const len = (data.imageOverlayText || data.eventTitle).length;
    if (len > 80) return 'text-[42px]';
    if (len > 40) return 'text-[56px]';
    return 'text-[72px]';
  }, [data.imageOverlayText, data.eventTitle]);

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
      const text = `${data.eventTitle}. ${data.imageOverlayText || data.eventDescription}. ${data.bibleVerse}. ${data.bibleReference}.`;
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
    <div className="relative flex flex-col h-full w-full bg-slate-950 overflow-hidden" data-capture-node={isCapture ? "true" : "false"}>
      {/* Hyper-realistic Background with extreme clarity */}
      {(data.customBg || data.imageUrl) && (
        <img src={data.customBg || data.imageUrl} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100" />
      )}
      
      {/* High-end cinematic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 z-0 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full p-16 items-center text-center">
        {/* Top Minimal Branding */}
        <div className="flex flex-col items-center w-full mb-10">
          <div className="flex items-center gap-4">
             <span className="px-5 py-2 bg-indigo-600/80 backdrop-blur-xl text-white text-[12px] font-black uppercase rounded-full shadow-2xl border border-white/10">POSITION {data.dayNumber}</span>
             <span className="text-[14px] font-black uppercase tracking-[0.6em] text-white/90 drop-shadow-lg">{data.dateString}</span>
          </div>
        </div>

        {/* Captivating Hero Text - CENTERED & IMPACTFUL */}
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl px-4">
          <div className="mb-6 animate-in slide-in-from-top-4 duration-1000">
            <h2 className="text-[20px] font-black uppercase tracking-[0.8em] text-indigo-400 drop-shadow-xl mb-4">{data.eventTitle}</h2>
            <div className="h-1 w-24 bg-white/20 mx-auto rounded-full" />
          </div>
          <h1 className={`${summaryFontSize} font-serif font-black text-white leading-[1.05] tracking-tight drop-shadow-[0_15px_60px_rgba(0,0,0,1)] italic scale-105 transition-transform`}>
            {data.imageOverlayText ? `“${data.imageOverlayText}”` : `“${data.eventTitle}”`}
          </h1>
        </div>

        {/* Bottom spiritual anchor */}
        <div className="w-full mt-auto pt-10">
          <div className="max-w-4xl mx-auto mb-12">
            <blockquote className="text-[26px] font-serif italic text-white leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,1)] px-12 mb-6">
              {data.bibleVerse}
            </blockquote>
            <cite className="text-[15px] font-black uppercase tracking-[0.5em] text-indigo-300 not-italic drop-shadow-lg">{data.bibleReference}</cite>
          </div>
          
          <div className="w-full flex justify-between items-end border-t border-white/10 pt-10">
            <div className="text-left">
              <p className="text-[10px] uppercase text-white/40 font-black tracking-widest mb-1">Archived for</p>
              <p className="text-[22px] font-serif italic text-white/95">{data.userName}</p>
            </div>
            <div className="text-right">
              <span className="text-[26px] font-black uppercase tracking-[0.8em] text-white/10">ECHO</span>
            </div>
          </div>
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

      <div ref={wrapperRef} className="w-full relative group cursor-pointer" style={{ height: `calc(${scale} * 1350px)` }}>
        <div className="absolute top-0 left-0 overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] group-hover:shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)] transition-all duration-700" style={{ width: '1080px', height: '1350px', transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: '70px' }}>
          <CardContent />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 max-w-[900px] mx-auto">
        <button onClick={handleListen} className={`py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all ${isSpeaking ? 'animate-pulse text-indigo-600 border-indigo-200 shadow-md' : 'shadow-sm'}`}>{isSpeaking ? 'Narrating...' : 'Listen'}</button>
        <button onClick={handleDownload} className="py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-indigo-600/30">Download</button>
        <button onClick={handleManualSave} className={`py-5 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] border transition-all ${isSaved ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm'}`}>
          {isSaved ? '✓ Saved' : 'Archive'}
        </button>
        <label className="flex items-center justify-center gap-2 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm transition-all">
          <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if(file && onUpdate) { const reader = new FileReader(); reader.onload = () => onUpdate({ customBg: reader.result as string }); reader.readAsDataURL(file); } }} /> Scene Swap
        </label>
      </div>

      <div className="space-y-12 max-w-[850px] mx-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
          <div className="p-10 sm:p-14 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.8)]" />
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-black uppercase tracking-[0.6em] text-indigo-600 dark:text-indigo-400">Master Narrative</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-widest">{data.eventTitle}</span>
                </div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(generateFullPost(data.linkedInPost, 'LinkedIn')); setCopiedType('li'); setTimeout(() => setCopiedType(null), 2000); }} className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-md ${copiedType === 'li' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {copiedType === 'li' ? '✓ Copied' : 'Copy for LinkedIn'}
              </button>
            </div>
          </div>
          <div className="p-10 sm:p-14">
            <div className="text-slate-700 dark:text-slate-300 leading-[1.8] whitespace-pre-wrap font-sans text-base sm:text-lg p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-inner italic-quotes">
              {data.linkedInPost}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="p-10 sm:p-14 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-black uppercase tracking-[0.6em] text-blue-500">X Echo</span>
                </div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(generateFullPost(data.twitterPost, 'X')); setCopiedType('x'); setTimeout(() => setCopiedType(null), 2000); }} className={`px-10 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-md ${copiedType === 'x' ? 'bg-green-600 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
                {copiedType === 'x' ? '✓ Copied' : 'Copy for X'}
              </button>
            </div>
          </div>
          <div className="p-10 sm:p-14">
            <div className="text-slate-700 dark:text-slate-300 italic font-sans text-xl p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-inner leading-relaxed">
              {data.twitterPost}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspirationCard;
