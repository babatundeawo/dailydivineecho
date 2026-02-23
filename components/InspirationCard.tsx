
import React, { useRef, useState } from 'react';
import { InspirationData } from '../types.ts';
import html2canvas from 'html2canvas';

interface InspirationCardProps {
  data: InspirationData;
  onSave?: (data: InspirationData) => void;
  onUpdate?: (updates: Partial<InspirationData>) => void;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ data, onSave, onUpdate }) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const generateFullPost = (content: string, hashtags: string) => {
    const header = `✨ DIVINE ECHO | ${data.dateString}\n📅 Day ${data.dayNumber} of ${data.totalDays}\n\n`;
    return `${header}${content}\n\n${hashtags}`;
  };

  const handleDownload = async () => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        scale: 2, 
        backgroundColor: '#000000',
        logging: false,
        width: 1080,
        height: 1350,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-capture-target="true"]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.margin = '0';
          }
        }
      });
      const link = document.createElement('a');
      link.download = `DivineEcho-Day${data.dayNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Export Error:', err);
    }
  };

  const handleCopy = (type: string, content: string, hashtags: string) => {
    const fullText = generateFullPost(content, hashtags);
    navigator.clipboard.writeText(fullText);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const cardWidth = 1080;
  const cardHeight = 1350;

  const CardContent = () => (
    <div 
      className="relative flex flex-col bg-slate-950 overflow-hidden shrink-0"
      style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
    >
      {data.imageUrl && (
        <img 
          src={data.imageUrl} 
          alt="" 
          crossOrigin="anonymous" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 flex flex-col h-full p-20">
        <div className="flex flex-col items-center w-full text-center">
          <div className="flex flex-col items-center gap-2">
             <span className="text-2xl font-black uppercase tracking-[0.8em] text-white/90 drop-shadow-lg">
               DAY {data.dayNumber}
             </span>
             <div className="h-1 w-24 bg-white/40 mb-2" />
             <span className="text-3xl font-serif italic text-white/80 tracking-widest drop-shadow-md">
               {data.dateString}
             </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-start pt-32 items-center w-full px-16 text-center">
          <h1 className="text-[72px] font-serif font-black text-white leading-[0.95] tracking-tight italic uppercase drop-shadow-[0_15px_45px_rgba(0,0,0,0.9)] scale-y-110">
            {data.imageOverlayText ? `“${data.imageOverlayText}”` : `“${data.eventTitle}”`}
          </h1>
        </div>

        <div className="w-full flex flex-col items-center">
          <div className="max-w-4xl text-center mb-16 px-12">
            <blockquote className="text-[32px] font-serif italic text-white leading-[1.35] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-6">
              {data.bibleVerse}
            </blockquote>
            <cite className="text-xl font-black uppercase tracking-[0.6em] text-white/60 not-italic">
              {data.bibleReference}
            </cite>
          </div>

          <div className="w-full flex justify-between items-end border-t border-white/20 pt-10">
            <div className="text-left">
              <p className="text-lg uppercase text-white/30 font-black tracking-[0.4em] mb-1">DIVINE WITNESS</p>
              <p className="text-4xl font-serif italic text-white/90 drop-shadow-sm">{data.userName}</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black tracking-[0.7em] text-white/20 uppercase">DIVINE ECHO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PlatformCard = ({ name, content, hashtags, color, limit, icon }: { name: string, content: string, hashtags: string, color: string, limit: number, icon: React.ReactNode }) => {
    if (!content) return null;
    return (
      <div className="bg-white dark:bg-slate-900 border dark:border-white/5 rounded-[3rem] shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl flex flex-col">
        <div className="p-8 border-b dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm ${color}`}>{icon}</div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">{name}</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{limit} Character Limit</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleCopy(name, content, hashtags)} 
              title="Copy to clipboard"
              className={`p-3 rounded-xl transition-all ${copiedType === name ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-10 flex-1">
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-base max-h-[400px] overflow-y-auto pr-4 custom-scrollbar italic font-medium">
            {content}
          </div>
          <div className={`mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 ${color} font-bold text-xs tracking-widest`}>
            {hashtags}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center gap-12">
      <div className="w-full flex justify-center py-4 overflow-visible">
        <div className="relative group transition-all duration-700">
          <div 
            ref={captureRef}
            data-capture-target="true"
            className="rounded-[40px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] bg-slate-900"
            style={{ 
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              transform: 'scale(0.35)', 
              transformOrigin: 'top center',
              marginBottom: `-${cardHeight * 0.65}px` 
            }}
          >
            <CardContent />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-6 max-w-4xl px-4 mt-8">
        <button 
          onClick={handleDownload} 
          className="flex items-center gap-4 px-12 py-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-4 border-indigo-600 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-indigo-600 hover:text-white active:scale-95 transition-all"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export Masterpiece
        </button>
        <button 
          onClick={() => { onSave?.(data); setIsSaved(true); setTimeout(() => setIsSaved(false), 2000); }} 
          className={`flex items-center gap-4 px-12 py-6 rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-95 transition-all ${isSaved ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          {isSaved ? 'Echo Stored' : 'Archive Echo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl px-4 mt-16 pb-20">
        <PlatformCard 
          name="LinkedIn / FB / WeChat / WA Channel" 
          icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>} 
          content={data.longPost} 
          hashtags={data.longHashtags} 
          color="text-indigo-600" 
          limit={3000} 
        />
        <PlatformCard 
          name="Instagram / Threads" 
          icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.558.217.957.477 1.377.896.419.42.679.819.896 1.377.164.422.359 1.057.412 2.227.059 1.266.071 1.646.071 4.85s-.012 3.584-.071 4.85c-.054 1.17-.249 1.805-.412 2.227-.217.558-.477.957-.896 1.377-.42.419-.819.679-1.377.896-.422.164-1.057.359-2.227.412-1.266.059-1.646.071-4.85.071s-3.584-.012-4.85-.071c-1.17-.054-1.805-.249-2.227-.412-.558-.217-.957-.477-1.377-.896-.419-.42-.679-.819-.896-1.377-.164-.422-.359-1.057-.412-2.227-.059-1.266-.071-1.646-.071-4.85s.012-3.584.071-4.85c.054-1.17.249-1.805.412-2.227.217-.558.477-.957.896-1.377.42-.419.819-.679 1.377-.896.422-.164 1.057-.359 2.227-.412 1.266-.059 1.646-.071 4.85-.071"/></svg>} 
          content={data.mediumPost} 
          hashtags={data.mediumHashtags} 
          color="text-rose-500" 
          limit={500} 
        />
        <PlatformCard 
          name="X / WhatsApp Status" 
          icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/></svg>} 
          content={data.shortPost} 
          hashtags={data.shortHashtags} 
          color="text-slate-900 dark:text-white" 
          limit={280} 
        />
      </div>
    </div>
  );
};

export default InspirationCard;
