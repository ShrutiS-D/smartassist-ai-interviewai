export type UserRole = 'admin' | 'hr' | 'candidate';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ChatbotTheme {
  primaryColor: string;
  welcomeMessage: string;
  isDark: boolean;
  avatarUrl?: string;
  botName: string;
}

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  systemInstruction: string;
  type: 'support' | 'interview'; // support = SmartAssist, interview = InterviewAI
  faqs: FAQ[];
  documents: AppDocument[];
  theme: ChatbotTheme;
  createdAt: string;
  // If interview type:
  jobTitle?: string;
  jobRequirements?: string;
}

export interface AppDocument {
  id: string;
  fileName: string;
  fileContent: string;
  uploadedBy: string;
  createdAt: string;
  analysis?: string; // For resumes
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  rating?: number; // 1 to 5 star rating
  sentiment?: 'positive' | 'neutral' | 'negative';
  audioUrl?: string;
}

export interface ChatSession {
  id: string;
  chatbotId: string;
  chatbotName: string;
  chatbotType: 'support' | 'interview';
  userId?: string;
  userName?: string;
  userEmail?: string;
  messages: ChatMessage[];
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  rating?: number;
  feedbackText?: string;
  sentimentAverage?: string;
  
  // For HR / InterviewAI evaluation score:
  candidateScore?: number;
  skillsAssessed?: string[];
  interviewReport?: InterviewReport;
}

export interface InterviewReport {
  id: string;
  sessionId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  overallScore: number; // 0 - 100
  categories: {
    technicalSkills: number;
    communication: number;
    experienceFit: number;
    problemSolving: number;
  };
  keyStrengths: string[];
  improvementAreas: string[];
  transcriptSummary: string;
  hiringDecision: 'Hire' | 'Maybe' | 'Reject';
  createdAt: string;
}

export interface AnalyticsSummary {
  totalChatbots: number;
  totalConversations: number;
  averageRating: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  totalSubscribers?: number;
  messagesPerDay: { date: string; count: number }[];
  languagesUsed: { language: string; count: number }[];
  hiringFunnel?: {
    totalInterviewed: number;
    hire: number;
    maybe: number;
    reject: number;
  };
}
