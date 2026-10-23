import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Campaign,
  AIDiagnosisResult,
  RecommendationItem,
  RecommendationStatus,
  ChatMessage,
  UserSettings,
  AdvertisingPlatform,
} from '../types/campaign';
import { INITIAL_DEMO_CAMPAIGNS } from '../data/mockData';
import { diagnoseCampaignWithAgent, checkAiStatus, AiServiceStatus } from '../services/ai/client';
import { generateRuleBasedDiagnosis } from '../services/ai/ruleBasedDiagnosis';

interface CampaignContextType {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
  selectedCampaign: Campaign | null;
  dateRange: 'last7' | 'last30' | 'last90' | 'all';
  setDateRange: (range: 'last7' | 'last30' | 'last90' | 'all') => void;
  platformFilter: 'all' | AdvertisingPlatform;
  setPlatformFilter: (filter: 'all' | AdvertisingPlatform) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredCampaigns: Campaign[];
  diagnoses: Record<string, AIDiagnosisResult>;
  isDiagnosing: boolean;
  activeDiagnosis: AIDiagnosisResult | null;
  runDiagnosisForCampaign: (campaignId: string) => Promise<AIDiagnosisResult | null>;
  recommendations: RecommendationItem[];
  updateRecommendationStatus: (id: string, status: RecommendationStatus) => void;
  refreshAllRecommendations: () => Promise<void>;
  chatMessages: ChatMessage[];
  addChatMessage: (text: string, sender: 'user' | 'assistant', isError?: boolean) => void;
  clearChatHistory: () => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  aiStatus: AiServiceStatus;
  refreshAiStatus: () => Promise<void>;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;
  resetDemoData: () => void;
  clearAllData: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;
}

const STORAGE_KEYS = {
  CAMPAIGNS: 'campaignpilot_campaigns_v1',
  DIAGNOSES: 'campaignpilot_diagnoses_v1',
  CHAT: 'campaignpilot_chat_v1',
  SETTINGS: 'campaignpilot_settings_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'Alex Morgan',
  userRole: 'Growth Lead',
  preferredCurrency: '$',
  defaultDateRange: 'last30',
  activeAiProvider: 'gemini',
  bedrockRegion: 'us-east-1',
  bedrockModel: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
};

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: "Hello! I am your CampaignPilot AI Marketing Assistant. I can analyze your campaign metrics, compare platform ROAS, detect conversion leaks, and explain your data. Try asking: *'Which campaign has the highest CTR?'* or *'Why is my conversion rate dropping?'*",
    timestamp: new Date().toISOString(),
  },
];

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load saved campaigns or fallback to demo
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading campaigns from storage', e);
    }
    return INITIAL_DEMO_CAMPAIGNS;
  });

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(() => {
    return campaigns.length > 0 ? campaigns[0].id : null;
  });

  const [dateRange, setDateRange] = useState<'last7' | 'last30' | 'last90' | 'all'>('last30');
  const [platformFilter, setPlatformFilter] = useState<'all' | AdvertisingPlatform>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Diagnoses cache
  const [diagnoses, setDiagnoses] = useState<Record<string, AIDiagnosisResult>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DIAGNOSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading diagnoses from storage', e);
    }
    const initialMap: Record<string, AIDiagnosisResult> = {};
    INITIAL_DEMO_CAMPAIGNS.forEach((c) => {
      initialMap[c.id] = generateRuleBasedDiagnosis(c);
    });
    return initialMap;
  });

  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Recommendations aggregated
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(() => {
    // Generate initial recommendations from loaded diagnoses or defaults
    return [];
  });

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHAT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading chat from storage', e);
    }
    return INITIAL_CHAT_MESSAGES;
  });

  // User Settings
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  // AI service status
  const [aiStatus, setAiStatus] = useState<AiServiceStatus>({
    aiConfigured: false,
    provider: 'checking',
    model: 'gemini-3.8-flash',
    awsBedrockReady: true,
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DIAGNOSES, JSON.stringify(diagnoses));
    // Flatten recommendations from all diagnoses
    const allRecs: RecommendationItem[] = [];
    const seen = new Set<string>();
    Object.values(diagnoses).forEach((diag) => {
      diag.recommendations?.forEach((rec) => {
        if (!seen.has(rec.id)) {
          seen.add(rec.id);
          allRecs.push(rec);
        }
      });
    });
    setRecommendations(allRecs);
  }, [diagnoses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Check AI service status on mount
  const refreshAiStatus = async () => {
    const status = await checkAiStatus();
    setAiStatus(status);
  };

  useEffect(() => {
    refreshAiStatus();
  }, []);

  // Selected Campaign derived
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0] || null;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.objective.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || c.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  // Active diagnosis for selected campaign
  const activeDiagnosis = selectedCampaignId && diagnoses[selectedCampaignId] ? diagnoses[selectedCampaignId] : null;

  // Diagnoses are pre-populated instantly from demo records or cache; on-demand re-diagnosis is available
  // Run diagnosis for a campaign
  const runDiagnosisForCampaign = async (campaignId: string): Promise<AIDiagnosisResult | null> => {
    const target = campaigns.find((c) => c.id === campaignId);
    if (!target) return null;

    setIsDiagnosing(true);
    try {
      const historical = campaigns.filter((c) => c.id !== campaignId);
      const { diagnosis } = await diagnoseCampaignWithAgent(target, historical);

      setDiagnoses((prev) => ({
        ...prev,
        [campaignId]: diagnosis,
      }));
      return diagnosis;
    } catch (err) {
      console.error('Failed to run diagnosis:', err);
      return null;
    } finally {
      setIsDiagnosing(false);
    }
  };

  const refreshAllRecommendations = async () => {
    setIsDiagnosing(true);
    try {
      for (const camp of campaigns) {
        await runDiagnosisForCampaign(camp.id);
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  const updateRecommendationStatus = (id: string, status: RecommendationStatus) => {
    setDiagnoses((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((campId) => {
        const diag = updated[campId];
        if (diag.recommendations) {
          diag.recommendations = diag.recommendations.map((rec) =>
            rec.id === id ? { ...rec, status } : rec
          );
        }
      });
      return updated;
    });
  };

  const addChatMessage = (text: string, sender: 'user' | 'assistant', isError?: boolean) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      isError,
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const clearChatHistory = () => {
    setChatMessages(INITIAL_CHAT_MESSAGES);
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addCampaign = (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `camp-${Date.now()}`;
    const newCampaign: Campaign = {
      ...campaignData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: false,
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    setSelectedCampaignId(newId);
  };

  const updateCampaign = (updated: Campaign) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteCampaign = (id: string) => {
    setCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (selectedCampaignId === id) {
        setSelectedCampaignId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
    setDiagnoses((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const resetDemoData = () => {
    setCampaigns(INITIAL_DEMO_CAMPAIGNS);
    setSelectedCampaignId(INITIAL_DEMO_CAMPAIGNS[0].id);
    const initialMap: Record<string, AIDiagnosisResult> = {};
    INITIAL_DEMO_CAMPAIGNS.forEach((c) => {
      initialMap[c.id] = generateRuleBasedDiagnosis(c);
    });
    setDiagnoses(initialMap);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    localStorage.setItem(STORAGE_KEYS.DIAGNOSES, JSON.stringify(initialMap));
  };

  const clearAllData = () => {
    setCampaigns([]);
    setSelectedCampaignId(null);
    setDiagnoses({});
    setRecommendations([]);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEYS.DIAGNOSES);
  };

  const exportDataJson = () => {
    const backup = {
      app: 'CampaignPilot AI',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      campaigns,
      diagnoses,
      settings,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataJson = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (parsed && Array.isArray(parsed.campaigns)) {
        setCampaigns(parsed.campaigns);
        if (parsed.diagnoses) setDiagnoses(parsed.diagnoses);
        if (parsed.settings) setSettings((prev) => ({ ...prev, ...parsed.settings }));
        if (parsed.campaigns.length > 0) {
          setSelectedCampaignId(parsed.campaigns[0].id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        selectedCampaignId,
        setSelectedCampaignId,
        selectedCampaign,
        dateRange,
        setDateRange,
        platformFilter,
        setPlatformFilter,
        searchQuery,
        setSearchQuery,
        filteredCampaigns,
        diagnoses,
        isDiagnosing,
        activeDiagnosis,
        runDiagnosisForCampaign,
        recommendations,
        updateRecommendationStatus,
        refreshAllRecommendations,
        chatMessages,
        addChatMessage,
        clearChatHistory,
        settings,
        updateSettings,
        aiStatus,
        refreshAiStatus,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        resetDemoData,
        clearAllData,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaigns must be used within a CampaignProvider');
  }
  return context;
};
