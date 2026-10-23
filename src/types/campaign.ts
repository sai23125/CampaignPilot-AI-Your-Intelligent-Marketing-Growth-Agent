export type AdvertisingPlatform = 'Meta Ads' | 'Google Ads' | 'Instagram' | 'LinkedIn' | 'Other';

export type CampaignObjective = 
  | 'Conversions' 
  | 'Lead Generation' 
  | 'Traffic' 
  | 'Brand Awareness' 
  | 'App Installs' 
  | 'Catalog Sales';

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: AdvertisingPlatform;
  objective: CampaignObjective;
  startDate: string;
  endDate: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  audienceNotes?: string;
  status: CampaignStatus;
  isDemo?: boolean;
  dailyMetrics?: DailyMetric[];
  createdAt: string;
  updatedAt: string;
}

export interface CalculatedMetrics {
  ctr: number;        // Click-Through Rate: (Clicks / Impressions) * 100
  cvr: number;        // Conversion Rate: (Conversions / Clicks) * 100
  cpc: number;        // Cost Per Click: Spend / Clicks
  cpa: number;        // Cost Per Acquisition: Spend / Conversions
  roas: number;       // Return on Ad Spend: Revenue / Spend
  cpm: number;        // Cost Per Mille (Thousand Impressions): (Spend / Impressions) * 1000
  profit: number;     // Revenue - Spend
}

export type RecommendationPriority = 'High' | 'Medium' | 'Low';
export type RecommendationCategory = 
  | 'creative' 
  | 'audience' 
  | 'landing_page' 
  | 'budget' 
  | 'bidding' 
  | 'conversion';

export type RecommendationStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed';

export interface RecommendationItem {
  id: string;
  title: string;
  explanation: string;
  metric_evidence: string;
  priority: RecommendationPriority;
  category: RecommendationCategory;
  implementation_steps: string[];
  expected_impact: string;
  status: RecommendationStatus;
}

export interface BenchmarkComparison {
  metric: string;
  campaignValue: string;
  benchmarkValue: string;
  status: 'above' | 'below' | 'on_par';
}

export interface AIDiagnosisResult {
  id: string;
  campaignId: string;
  campaignName: string;
  timestamp: string;
  provider: 'gemini' | 'bedrock' | 'rule_based';
  executive_summary: string;
  strengths: string[];
  performance_concerns: string[];
  possible_causes: string[]; // Clearly labeled as hypotheses
  recommendations: RecommendationItem[];
  confidence: 'High' | 'Medium' | 'Low';
  missing_data: string[];
  benchmark_comparisons?: BenchmarkComparison[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  groundingCampaigns?: string[];
  suggestedActions?: string[];
  isError?: boolean;
}

export interface UserSettings {
  displayName: string;
  userRole: string;
  preferredCurrency: '$' | '€' | '£' | '¥';
  defaultDateRange: 'last7' | 'last30' | 'last90' | 'all';
  activeAiProvider: 'gemini' | 'bedrock';
  bedrockRegion: string;
  bedrockModel: string;
}

export interface ReportData {
  generatedAt: string;
  campaignName: string;
  dateRange: string;
  metrics: CalculatedMetrics & {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
  };
  diagnosis?: AIDiagnosisResult;
  isDemo: boolean;
}
