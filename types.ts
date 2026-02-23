
export interface HistoricalRecommendation {
  id: string;
  title: string;
  description: string;
  year: string;
  category?: string;
  era?: string;
}

export type HistoricalEra = 'Ancient' | 'Medieval' | 'Renaissance' | 'Industrial' | 'Modern' | 'Contemporary' | 'All';
export type ImpactCategory = 'Science' | 'Arts' | 'Politics' | 'Religion' | 'Discovery' | 'Conflict' | 'All';

export interface InspirationData {
  dayCount: string;
  dayNumber: number;
  totalDays: number;
  dateString: string;
  eventTitle: string;
  eventDescription: string;
  imageOverlayText?: string;
  eventLocation?: string;
  bibleVerse: string;
  bibleReference: string;
  reflectionPrompt: string;
  
  // Consolidated Platform Posts
  longPost: string;
  mediumPost: string;
  shortPost: string;

  // Consolidated Platform Hashtags
  longHashtags: string;
  mediumHashtags: string;
  shortHashtags: string;

  imagePrompt: string;
  imageUrl?: string;
  customBg?: string;
  userName: string;
  sources?: Array<{ web?: { uri: string; title: string }; maps?: { uri: string; title: string } }>;
}

export enum LoadingState {
  IDLE = 'IDLE',
  SETUP = 'SETUP',
  SCANNING = 'SCANNING',
  CHOOSING_EVENT = 'CHOOSING_EVENT',
  FETCHING_EVENT = 'FETCHING_EVENT',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
