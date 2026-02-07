
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

  const handleShare = async (platform: string, content: string, hashtags: string) => {
    const fullText = generateFullPost(content, hashtags);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Divine Echo',
          text: fullText,
          url: window.location.href,
        });
      } catch (err) { console.debug('Share cancelled'); }
    } else {
      // Fallback: Copy to clipboard and alert
      navigator.clipboard.writeText(fullText);
      setCopiedType(platform);
      setTimeout(() => setCopiedType(null), 2000);
    }
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

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-[900px] mx-auto">
        <button onClick={handleListenLinkedIn} className={`py-4 px-6 rounded-3xl font-black uppercase tracking-wider text-[10px] bg-white dark:bg-slate-900 border dark:border-white/10 text-slate-600 dark:text-slate-300 ${isSpeaking ? 'animate-pulse text-indigo-500' : ''}`}>
          {isSpeaking ? 'Narrating LI...' : 'Hear Wisdom'}
        </button>
        <button onClick={handleDownload} className="py-4 px-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-wider text-[10px]">Download Frame</button>
        <button onClick={() => { if(onSave) onSave(data); setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); }} className={`py-4 px-6 rounded-3xl font-black uppercase tracking-wider text-[10px] border dark:border-white/10 ${isSaved ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>
          {isSaved ? 'Archived' : 'Pin to History'}
        </button>
        <label className="py-4 px-6 bg-white dark:bg-slate-900 border dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-3xl font-black uppercase tracking-wider text-[10px] cursor-pointer text-center">
          <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if(file && onUpdate) { const reader = new FileReader(); reader.onload = () => onUpdate({ customBg: reader.result as string }); reader.readAsDataURL(file); } }} /> Swap Scene
        </label>
      </div>

      {/* Narrative Hubs - Grouped by Platform */}
      <div className="space-y-8 max-w-[850px] mx-auto">
        
        {/* Hub 1: Professional & Narrative (LinkedIn / Facebook / Wechat) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3rem] shadow-xl overflow-hidden">
          <div className="p-8 border-b dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
            <div className="text-left">
              <span className="text-[12px] font-black uppercase tracking-widest text-indigo-600">Narrative Hub</span>
              <p className="text-[9px] uppercase text-slate-400 font-bold mt-1">LinkedIn • Facebook • Wechat</p>
            </div>
            <button onClick={() => handleShare('Group1', data.linkedInPost, data.linkedInHashtags)} className="px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              {copiedType === 'Group1' ? 'Copied' : 'Share / Copy'}
            </button>
          </div>
          <div className="p-10 text-left">
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-sm sm:text-base p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border dark:border-white/10 shadow-inner">
              {data.linkedInPost}
            </div>
            <div className="mt-6 text-indigo-600 font-bold text-xs">{data.linkedInHashtags}</div>
          </div>
        </div>

        {/* Hub 2: Visual & Conversational (Instagram / Threads) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3rem] shadow-xl overflow-hidden">
          <div className="p-8 border-b dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
            <div className="text-left">
              <span className="text-[12px] font-black uppercase tracking-widest text-pink-500">Visual Caption</span>
              <p className="text-[9px] uppercase text-slate-400 font-bold mt-1">Instagram • Threads</p>
            </div>
            <button onClick={() => handleShare('Group2', data.instaThreadsPost, data.instaHashtags)} className="px-6 py-2 bg-pink-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              {copiedType === 'Group2' ? 'Copied' : 'Share / Copy'}
            </button>
          </div>
          <div className="p-10 text-left">
            <div className="text-slate-700 dark:text-slate-300 italic font-sans text-base p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border dark:border-white/10 shadow-inner">
              {data.instaThreadsPost}
            </div>
            <div className="mt-6 text-pink-500 font-bold text-xs">{data.instaHashtags}</div>
          </div>
        </div>

        {/* Hub 3: Real-time & Viral (X / WhatsApp) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-white/10 rounded-[3rem] shadow-xl overflow-hidden">
          <div className="p-8 border-b dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
            <div className="text-left">
              <span className="text-[12px] font-black uppercase tracking-widest text-blue-400">Viral Echo</span>
              <p className="text-[9px] uppercase text-slate-400 font-bold mt-1">X • WhatsApp</p>
            </div>
            <button onClick={() => handleShare('Group3', data.twitterWhatsAppPost, data.twitterHashtags)} className="px-6 py-2 bg-blue-400 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              {copiedType === 'Group3' ? 'Copied' : 'Share / Copy'}
            </button>
          </div>
          <div className="p-10 text-left">
            <div className="text-slate-700 dark:text-slate-300 font-sans text-lg p-8 bg-slate-50 dark:bg-white/5 rounded-3xl border dark:border-white/10 shadow-inner">
              {data.twitterWhatsAppPost}
            </div>
            <div className="mt-6 text-blue-400 font-bold text-xs">{data.twitterHashtags}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InspirationCard;
