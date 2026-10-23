import { Campaign, AIDiagnosisResult, ChatMessage } from '../../types/campaign';

export interface IAIService {
  name: string;
  providerId: 'gemini' | 'bedrock' | 'rule_based';
  isConfigured: () => Promise<boolean>;
  diagnoseCampaign: (campaign: Campaign, historicalCampaigns?: Campaign[]) => Promise<AIDiagnosisResult>;
  askAssistant: (
    messages: ChatMessage[],
    campaigns: Campaign[],
    activeCampaignId?: string
  ) => Promise<string>;
}
