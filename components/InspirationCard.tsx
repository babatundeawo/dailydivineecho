
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

        <div className="flex-1 flex flex-col justify-center items-center w-full px-16 text-center">
          <h1 className="text-[90px] font-serif font-black text-white leading-[0.95] tracking-tight italic uppercase drop-shadow-[0_15px_45px_rgba(0,0,0,0.9)] scale-y-110">
            {data.imageOverlayText ? `“${data.imageOverlayText}”` : `“${data.eventTitle}”`}
          </h1>
        </div>

        <div className="w-full flex flex-col items-center">
          <div className="max-w-4xl text-center mb-16 px-12">
            <blockquote className="text-[42px] font-serif italic text-white leading-[1.35] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-6">
              {data.bibleVerse}
            </blockquote>
            <cite className="text-2xl font-black uppercase tracking-[0.6em] text-white/60 not-italic">
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
        <PlatformCard name="LinkedIn" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>} content={data.linkedInPost} hashtags={data.linkedInHashtags} color="text-indigo-600" limit={3000} />
        <PlatformCard name="Facebook" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.783h-2.956v-3.427h2.956v-2.528c0-2.929 1.789-4.524 4.402-4.524 1.251 0 2.327.093 2.641.135v3.061l-1.811.001c-1.421 0-1.697.675-1.697 1.667v2.189h3.391l-.441 3.427h-2.95v8.783h6.083c.731 0 1.325-.593 1.325-1.324v-21.351c0-.732-.593-1.325-1.325-1.325z"/></svg>} content={data.facebookPost} hashtags={data.facebookHashtags} color="text-blue-600" limit={3000} />
        <PlatformCard name="WeChat" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.28 1.95c-4.43 0-8.02 3.14-8.02 7.02 0 2.18 1.14 4.14 2.95 5.5l-.75 2.23 2.59-1.29c.39.11.8.19 1.23.19.43 0 .84-.08 1.23-.19l2.59 1.29-.75-2.23c1.81-1.36 2.95-3.32 2.95-5.5 0-3.88-3.59-7.02-8.02-7.02zm-3.14 5.37c-.52 0-.94-.43-.94-.94 0-.52.42-.94.94-.94.51 0 .93.42.93.94 0 .51-.42.94-.93.94zm6.28 0c-.51 0-.93-.43-.93-.94 0-.52.42-.94.93-.94.52 0 .94.42.94.94 0 .51-.42.94-.94.94zm6.6 3.44c-3.7 0-6.7 2.61-6.7 5.83 0 1.81.95 3.44 2.46 4.58l-.63 1.86 2.16-1.08c.32.09.67.15 1.03.15.36 0 .71-.06 1.03-.15l2.16 1.08-.63-1.86c1.51-1.14 2.46-2.77 2.46-4.58 0-3.22-3-5.83-6.7-5.83zm-2.61 4.48c-.43 0-.78-.35-.78-.78 0-.43.35-.78.78-.78.43 0 .78.35.78.78 0 .43-.35.78-.78.78zm5.22 0c-.43 0-.78-.35-.78-.78 0-.43.35-.78.78-.78.43 0 .78.35.78.78 0 .43-.35.78-.78.78z"/></svg>} content={data.wechatPost} hashtags={data.wechatHashtags} color="text-emerald-500" limit={5000} />
        <PlatformCard name="Instagram" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.558.217.957.477 1.377.896.419.42.679.819.896 1.377.164.422.359 1.057.412 2.227.059 1.266.071 1.646.071 4.85s-.012 3.584-.071 4.85c-.054 1.17-.249 1.805-.412 2.227-.217.558-.477.957-.896 1.377-.42.419-.819.679-1.377.896-.422.164-1.057.359-2.227.412-1.266.059-1.646.071-4.85.071s-3.584-.012-4.85-.071c-1.17-.054-1.805-.249-2.227-.412-.558-.217-.957-.477-1.377-.896-.419-.42-.679-.819-.896-1.377-.164-.422-.359-1.057-.412-2.227-.059-1.266-.071-1.646-.071-4.85s.012-3.584.071-4.85c.054-1.17.249-1.805.412-2.227.217-.558.477-.957.896-1.377.42-.419.819-.679 1.377-.896.422-.164 1.057-.359 2.227-.412 1.266-.059 1.646-.071 4.85-.071"/></svg>} content={data.instagramPost} hashtags={data.instagramHashtags} color="text-rose-500" limit={500} />
        <PlatformCard name="Threads" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15.42 12.15c0 1.23-.31 2.21-.92 2.94-.61.73-1.46 1.1-2.55 1.1-1.09 0-1.94-.37-2.55-1.1-.61-.73-.92-1.71-.92-2.94s.31-2.21.92-2.94c.61-.73 1.46-1.1 2.55-1.1 1.09 0 1.94.37 2.55 1.1.61.73.92 1.71.92 2.94zm4.58 0c0 4.14-3.36 7.5-7.5 7.5S5 16.29 5 12.15 8.36 4.65 12.5 4.65s7.5 3.36 7.5 7.5z"/></svg>} content={data.threadsPost} hashtags={data.threadsHashtags} color="text-slate-900 dark:text-white" limit={500} />
        <PlatformCard name="WhatsApp" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045a11.971 11.971 0 001.608 6.008L0 24l6.117-1.605a11.845 11.845 0 005.933 1.588h.005c6.632 0 12.042-5.412 12.045-12.048a11.85 11.85 0 00-3.535-8.414" clipRule="evenodd"/></svg>} content={data.whatsappPost} hashtags={data.whatsappHashtags} color="text-green-500" limit={500} />
        <PlatformCard name="X (Twitter)" icon={<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z"/></svg>} content={data.twitterPost} hashtags={data.twitterHashtags} color="text-slate-900 dark:text-white" limit={280} />
      </div>
    </div>
  );
};

export default InspirationCard;
