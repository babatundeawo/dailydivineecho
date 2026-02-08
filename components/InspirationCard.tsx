
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
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [scale, setScale] = useState(1);

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

  const generateFullPost = (content: string, hashtags: string) => {
    const header = `✨ DIVINE ECHO | ${data.dateString}\n📅 Day ${data.dayNumber} of ${data.totalDays}\n\n`;
    return `${header}${content}\n\n${hashtags}`;
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
      link.download = `DivineEcho-Day${data.dayNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Export Error:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCopy = (type: string, content: string, hashtags: string) => {
    const fullText = generateFullPost(content, hashtags);
    navigator.clipboard.writeText(fullText);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleListenLinkedIn = async () => {
    if (isSpeaking) return;
    try {
      setIsSpeaking(true);
      const base64Audio = await generateTTS(data.linkedInPost);
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

  const CardContent = ({ isCapture = false }: { isCapture?: boolean }) => (
    <div className="relative flex flex-col h-full w-full bg-slate-950 overflow-hidden" data-capture-node={isCapture ? "true" : "false"}>
      {(data.customBg || data.imageUrl) && (
        <img src={data.customBg || data.imageUrl} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/70 z-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full p-16 items-center text-center">
        <div className="flex flex-col items-center w-full mb-10">
          <div className="flex items-center gap-4">
             <span className="px-5 py-2 bg-white/10 backdrop-blur-2xl text-white text-[12px] font-black uppercase rounded-full shadow-2xl border border-white/20">POSITION {data.dayNumber}</span>
             <span className="text-[14px] font-black uppercase tracking-[0.6em] text-white/80 drop-shadow-lg">{data.dateString}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl px-4">
          <h1 className={`${summaryFontSize} font-serif font-black text-white leading-[1.05] tracking-tight drop-shadow-[0_15px_60px_rgba(0,0,0,1)] italic scale-105 transition-transform`}>
            {data.imageOverlayText ? `“${data.imageOverlayText}”` : `“${data.eventTitle}”`}
          </h1>
        </div>
        <div className="w-full mt-auto pt-10">
          <div className="max-w-4xl mx-auto mb-12">
            <blockquote className="text-[26px] font-serif italic text-white leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,1)] px-12 mb-6">
              {data.bibleVerse}
            </blockquote>
            <cite className="text-[15px] font-black uppercase tracking-[0.5em] text-white/70 not-italic drop-shadow-lg">{data.bibleReference}</cite>
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

  const PlatformSection = ({ name, content, hashtags, color, limit }: { name: string, content: string, hashtags: string, color: string, limit: number }) => {
    const charCount = (content + hashtags).length;
    return (
      <div className="bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[2.5rem] shadow-xl overflow-hidden transition-all hover:shadow-2xl">
        <div className="p-6 border-b dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <div className="flex flex-col">
            <span className={`text-[12px] font-black uppercase tracking-widest ${color}`}>{name}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{charCount} / {limit} chars</span>
          </div>
          <button onClick={() => handleCopy(name, content, hashtags)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${copiedType === name ? 'bg-green-600 text-white' : 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900'}`}>
            {copiedType === name ? 'Copied ✓' : 'Copy Post'}
          </button>
        </div>
        <div className="p-8 text-left">
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-sm sm:text-base p-6 bg-slate-50 dark:bg-black/20 rounded-2xl border dark:border-white/10 shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar">
            {content}
          </div>
          <div className={`mt-4 ${color} font-bold text-xs select-all`}>
            {hashtags}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 sm:space-y-16 w-full max-w-4xl mx-auto py-10 px-4">
      {/* Hidden high-res capture node */}
      <div style={{ position: 'fixed', top: 0, left: '-5000px', width: '1080px', height: '1350px', zIndex: -9999, pointerEvents: 'none' }}>
        <div ref={hiddenCaptureRef} style={{ width: '1080px', height: '1350px' }}>
          <CardContent isCapture={true} />
        </div>
      </div>

      {/* Hero Display Card */}
      <div ref={wrapperRef} className="w-full relative group cursor-pointer" style={{ height: `calc(${scale} * 1350px)` }}>
        <div className="absolute top-0 left-0 overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 flex flex-col shadow-2xl transition-all duration-700" style={{ width: '1080px', height: '1350px', transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: '70px' }}>
          <CardContent />
        </div>
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-[900px] mx-auto">
        <button onClick={handleListenLinkedIn} className={`py-4 px-6 rounded-3xl font-black uppercase tracking-wider text-[10px] bg-white dark:bg-slate-900 border dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all ${isSpeaking ? 'animate-pulse text-indigo-500 border-indigo-500 shadow-lg' : 'shadow-sm'}`}>
          {isSpeaking ? 'Narrating...' : 'Listen Narrative'}
        </button>
        <button onClick={handleDownload} className="py-4 px-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-wider text-[10px] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Download Art</button>
        <button onClick={() => { if(onSave) onSave(data); setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); }} className={`py-4 px-6 rounded-3xl font-black uppercase tracking-wider text-[10px] border dark:border-white/10 shadow-sm transition-all ${isSaved ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>
          {isSaved ? 'Archived ✓' : 'Store Echo'}
        </button>
        <label className="py-4 px-6 bg-white dark:bg-slate-900 border dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-3xl font-black uppercase tracking-wider text-[10px] cursor-pointer text-center shadow-sm hover:bg-slate-50 transition-all">
          <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if(file && onUpdate) { const reader = new FileReader(); reader.onload = () => onUpdate({ customBg: reader.result as string }); reader.readAsDataURL(file); } }} /> Scene Swap
        </label>
      </div>

      {/* Separate Platform Narratives */}
      <div className="space-y-10 max-w-[850px] mx-auto pb-10">
        <div className="text-center space-y-2">
          <h2 className="text-[10px] uppercase font-black tracking-[1em] text-slate-400 dark:text-slate-500">Multiverse Narratives</h2>
          <p className="text-[11px] italic text-slate-400 font-serif">Scripture-infused & humanly enthusiastic</p>
        </div>
        
        <PlatformSection name="LinkedIn" content={data.linkedInPost} hashtags={data.linkedInHashtags} color="text-indigo-600" limit={3000} />
        <PlatformSection name="Facebook" content={data.facebookPost} hashtags={data.facebookHashtags} color="text-blue-700" limit={3000} />
        <PlatformSection name="WeChat" content={data.wechatPost} hashtags={data.wechatHashtags} color="text-green-600" limit={5000} />
        <PlatformSection name="Instagram" content={data.instagramPost} hashtags={data.instagramHashtags} color="text-pink-600" limit={2200} />
        <PlatformSection name="Threads" content={data.threadsPost} hashtags={data.threadsHashtags} color="text-slate-900 dark:text-white" limit={500} />
        <PlatformSection name="X (Twitter)" content={data.twitterPost} hashtags={data.twitterHashtags} color="text-blue-400" limit={280} />
        <PlatformSection name="WhatsApp" content={data.whatsappPost} hashtags={data.whatsappHashtags} color="text-emerald-500" limit={500} />
      </div>
    </div>
  );
};

export default InspirationCard;
