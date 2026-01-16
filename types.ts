
export interface HistoricalRecommendation {
  id: string;
  title: string;
  description: string;
  year: string;
}

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
  linkedInPost: string;
  twitterPost: string;
  imagePrompt: string;
  imageUrl?: string;
  customBg?: string;
  userName: string;
  sources?: Array<{ web?: { uri: string; title: string }; maps?: { uri: string; title: string } }>;
}

export enum LoadingState {
  IDLE = 'IDLE',
  SETUP = 'SETUP',
  CHOOSING_EVENT = 'CHOOSING_EVENT',
  FETCHING_EVENT = 'FETCHING_EVENT',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
