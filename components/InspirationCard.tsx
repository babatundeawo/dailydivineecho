
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

const InspirationCard: React.FC<InspirationCardProps> = ({ data, onSave, onUpdate }) => {
  const hiddenCaptureRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeVoicePlatform, setActiveVoicePlatform] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const parentWidth = wrapperRef.current.offsetWidth;
        setScale(Math.min(parentWidth / 1080, 1));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleShare = async (platform: string, content: string, hashtags: string) => {
    const fullText = generateFullPost(content, hashtags);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Divine Echo: ${data.eventTitle}`,
          text: fullText,
          url: window.location.href
        });
      } catch (e) { console.error("Share failed", e); }
    } else {
      handleCopy(platform, content, hashtags);
    }
  };

  const handleListen = async (platform: string, text: string) => {
    if (activeVoicePlatform) return;
    try {
      setActiveVoicePlatform(platform);
      const base64Audio = await generateTTS(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer.slice(0)); // Standard decoding for small buffers
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setActiveVoicePlatform(null);
      source.start();
    } catch (err) {
      console.error("TTS Error:", err);
      setActiveVoicePlatform(null);
    }
  };

  const CardContent = ({ isCapture = false }: { isCapture?: boolean }) => (
    <div className="relative flex flex-col h-full w-full bg-slate-950 overflow-hidden" data-capture-node={isCapture ? "true" : "false"}>
      {data.imageUrl && (
        <img src={data.imageUrl} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-1000" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 z-0" />
      <div className="relative z-10 flex flex-col h-full p-16 items-center text-center">
        <div className="flex flex-col items-center w-full mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex items-center gap-4">
             <span className="px-6 py-2 bg-white/10 backdrop-blur-xl text-white text-[11px] font-black uppercase rounded-full border border-white/20 shadow-2xl">POS {data.dayNumber}</span>
             <span className="text-[13px] font-black uppercase tracking-[0.5em] text-white/90 drop-shadow-md">{data.dateString}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-5xl px-4 animate-in fade-in zoom-in-95 duration-1000">
          <h1 className="text-6xl sm:text-7xl font-serif font-black text-white leading-[1.1] tracking-tighter italic drop-shadow-2xl">
            {data.imageOverlayText ? `“${data.imageOverlayText}”` : `“${data.eventTitle}”`}
          </h1>
        </div>
        <div className="w-full mt-auto pt-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="max-w-4xl mx-auto mb-10">
            <blockquote className="text-2xl sm:text-3xl font-serif italic text-white/95 leading-relaxed drop-shadow-lg px-8 mb-6">
              {data.bibleVerse}
            </blockquote>
            <cite className="text-[14px] font-black uppercase tracking-[0.4em] text-white/60 not-italic">{data.bibleReference}</cite>
          </div>
          <div className="w-full flex justify-between items-end border-t border-white/10 pt-8 opacity-80">
            <div className="text-left">
              <p className="text-[9px] uppercase text-white/40 font-black tracking-widest mb-1">Manifested for</p>
              <p className="text-xl font-serif italic text-white/90">{data.userName}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black uppercase tracking-[0.6em] text-white/10">DIVINE ECHO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PlatformCard = ({ name, content, hashtags, color, limit, icon }: { name: string, content: string, hashtags: string, color: string, limit: number, icon: React.ReactNode }) => {
    const isSpeaking = activeVoicePlatform === name;
    return (
      <div className="group bg-white dark:bg-slate-900/50 backdrop-blur-3xl border dark:border-white/5 rounded-[3rem] shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
        <div className="p-8 border-b dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ${color}`}>
              {icon}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">{name}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(content + hashtags).length} / {limit}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleListen(name, content)}
              disabled={!!activeVoicePlatform}
              className={`p-3 rounded-xl transition-all ${isSpeaking ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Listen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.978 5.978 0 0115 10a5.978 5.978 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.979 3.979 0 0013 10a3.979 3.979 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              onClick={() => handleCopy(name, content, hashtags)}
              className={`p-3 rounded-xl transition-all ${copiedType === name ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              title="Copy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
            <button 
              onClick={() => handleShare(name, content, hashtags)}
              className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Share"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-10 text-left">
          <div className="text-slate-700 dark:text-slate-300 leading-[1.8] whitespace-pre-wrap font-sans text-base p-8 bg-slate-50/50 dark:bg-black/20 rounded-[2rem] border dark:border-white/5 shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
            {content}
          </div>
          <div className={`mt-6 ${color} font-bold text-sm tracking-wide bg-slate-50 dark:bg-white/5 p-4 rounded-2xl inline-block`}>
            {hashtags}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-20 w-full max-w-5xl mx-auto py-10 px-4">
      <div style={{ position: 'fixed', top: 0, left: '-5000px', width: '1080px', height: '1350px', zIndex: -9999 }}>
        <div ref={hiddenCaptureRef} style={{ width: '1080px', height: '1350px' }}>
          <CardContent isCapture={true} />
        </div>
      </div>

      {/* Hero Display */}
      <div ref={wrapperRef} className="w-full relative group transition-all duration-700 hover:scale-[1.01]" style={{ height: `calc(${scale} * 1350px)` }}>
        <div className="absolute top-0 left-0 overflow-hidden bg-slate-950 border dark:border-white/10 flex flex-col shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transition-all duration-700" style={{ width: '1080px', height: '1350px', transform: `scale(${scale})`, transformOrigin: 'top left', borderRadius: '80px' }}>
          <CardContent />
        </div>
      </div>

      {/* Master Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <button onClick={handleDownload} className="group relative py-6 px-8 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 transition-all hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export Art
        </button>
        <button onClick={() => { if(onSave) onSave(data); setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); }} className={`py-6 px-8 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all hover:-translate-y-1 active:scale-95 shadow-xl flex items-center justify-center gap-3 ${isSaved ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          {isSaved ? 'Archived' : 'Store Echo'}
        </button>
        <label className="py-6 px-8 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black uppercase tracking-widest text-[11px] cursor-pointer text-center shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if(file && onUpdate) { const reader = new FileReader(); reader.onload = () => onUpdate({ imageUrl: reader.result as string }); reader.readAsDataURL(file); } }} /> Swap Scene
        </label>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="py-6 px-8 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          To Top
        </button>
      </div>

      {/* Narratives Section */}
      <div className="space-y-16 pb-20">
        <div className="text-center space-y-4">
          <h2 className="text-[12px] uppercase font-black tracking-[1.2em] text-slate-400 dark:text-slate-500">Universal Resonance</h2>
          <p className="text-xl italic text-slate-500 font-serif">Optimized for every digital frequency</p>
        </div>
        
        <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
          <PlatformCard 
            name="LinkedIn" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>} 
            content={data.linkedInPost} hashtags={data.linkedInHashtags} color="text-indigo-600" limit={3000} 
          />
          <PlatformCard 
            name="Facebook" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>}
            content={data.facebookPost} hashtags={data.facebookHashtags} color="text-blue-600" limit={3000} 
          />
          <PlatformCard 
            name="WeChat" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.333 13.916c0-.28 0-.559.043-.84-.515-.043-1.073-.086-1.589-.086-3.822 0-7 2.533-7 5.667 0 1.72.944 3.263 2.533 4.336L1.504 24l2.876-1.46c.86.258 1.762.387 2.664.387 3.864 0 7-2.533 7-5.667 0-1.29-.515-2.45-1.374-3.35-.902-.945-2.191-1.547-3.622-1.547l-.714.553zm.001 3.548c-.559 0-1.031-.472-1.031-1.031 0-.558.472-1.03 1.031-1.03s1.03.472 1.03 1.03c-.001.559-.473 1.031-1.03 1.031zm3.822-1.031c0 .559.472 1.031 1.031 1.031.558 0 1.03-.472 1.03-1.031s-.472-1.03-1.03-1.03c-.559-.001-1.031.471-1.031 1.03z"/></svg>}
            content={data.wechatPost} hashtags={data.wechatHashtags} color="text-emerald-600" limit={5000} 
          />
          <PlatformCard 
            name="Instagram" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.558.217.957.477 1.377.896.419.42.679.819.896 1.377.164.422.359 1.057.412 2.227.059 1.266.071 1.646.071 4.85s-.012 3.584-.071 4.85c-.054 1.17-.249 1.805-.412 2.227-.217.558-.477.957-.896 1.377-.42.419-.819.679-1.377.896-.422.164-1.057.359-2.227.412-1.266.059-1.646.071-4.85.071s-3.584-.012-4.85-.071c-1.17-.054-1.805-.249-2.227-.412-.558-.217-.957-.477-1.377-.896-.419-.42-.679-.819-.896-1.377-.164-.422-.359-1.057-.412-2.227-.059-1.266-.071-1.646-.071-4.85s.012-3.584.071-4.85c.054-1.17.249-1.805.412-2.227.217-.558.477-.957.896-1.377.42-.419.819-.679 1.377-.896.422-.164 1.057-.359 2.227-.412 1.266-.059 1.646-.071 4.85-.071m0-2.163c-3.259 0-3.667.014-4.947.072-1.277.057-2.148.258-2.911.554-.789.307-1.459.717-2.126 1.384-.667.667-1.077 1.337-1.384 2.126-.296.763-.497 1.634-.554 2.911-.058 1.28-.072 1.688-.072 4.947s.014 3.668.072 4.947c.057 1.277.258 2.148.554 2.911.307.789.717 1.459 1.384 2.126.667.667 1.337 1.077 2.126 1.384.763.296 1.634.497 2.911.554 1.28.058 1.688.072 4.947.072s3.668-.014 4.947-.072c1.277-.057 2.148-.258 2.911-.554.789-.307 1.459-.717 2.126-1.384.667-.667 1.077-1.337 1.384-2.126.296-.763.497-1.634.554-2.911.058-1.28.072-1.688.072-4.947s-.014-3.668-.072-4.947c-.057-1.277-.258-2.148-.554-2.911-.307-.789-.717-1.459-1.384-2.126-.667-.667-1.337-1.077-2.126-1.384-.763-.296-1.634-.497-2.911-.554-1.28-.058-1.688-.072-4.947-.072z"/><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162m0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4m6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
            content={data.instagramPost} hashtags={data.instagramHashtags} color="text-rose-500" limit={2200} 
          />
          <PlatformCard 
            name="Threads" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.823 12.834c.667 0 1.226-.115 1.673-.346.448-.23.673-.615.673-1.154 0-.538-.225-.923-.673-1.154-.447-.23-1.006-.346-1.673-.346h-2.12v3h2.12zm-2.12-5.454h1.767c.56 0 1.018-.096 1.374-.288.356-.192.534-.51.534-.954 0-.444-.178-.762-.534-.954-.356-.192-.814-.288-1.374-.288h-1.767v2.484zm-4.37 13.924V5h7.245c1.174 0 2.14.2 2.895.6s1.134 1.012 1.134 1.838c0 .826-.379 1.438-1.134 1.838-.755.4-1.721.6-2.895.6H12.7v2.092h2.946c1.174 0 2.14.2 2.895.6s1.134 1.012 1.134 1.838c0 .826-.379 1.438-1.134 1.838-.755.4-1.721.6-2.895.6h-7.245z"/></svg>}
            content={data.threadsPost} hashtags={data.threadsHashtags} color="text-slate-900 dark:text-white" limit={500} 
          />
          <PlatformCard 
            name="X (Twitter)" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
            content={data.twitterPost} hashtags={data.twitterHashtags} color="text-sky-500" limit={280} 
          />
          <PlatformCard 
            name="WhatsApp" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>}
            content={data.whatsappPost} hashtags={data.whatsappHashtags} color="text-emerald-500" limit={500} 
          />
        </div>
      </div>
    </div>
  );
};

export default InspirationCard;
