import { Campaign, AIDiagnosisResult, ChatMessage } from '../../types/campaign';
import { generateRuleBasedDiagnosis } from './ruleBasedDiagnosis';
import { calculateCampaignMetrics } from '../../utils/metrics';

export interface AiServiceStatus {
  aiConfigured: boolean;
  provider: string;
  model: string;
  awsBedrockReady: boolean;
}

/**
 * Checks server AI availability
 */
export async function checkAiStatus(): Promise<AiServiceStatus> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) {
      return { aiConfigured: false, provider: 'rule_based_fallback', model: 'rule-engine', awsBedrockReady: true };
    }
    const data = await res.json();
    return data;
  } catch {
    return { aiConfigured: false, provider: 'rule_based_fallback', model: 'rule-engine', awsBedrockReady: true };
  }
}

/**
 * Request diagnosis from server Gemini agent, falling back gracefully to heuristic rule engine.
 */
export async function diagnoseCampaignWithAgent(
  campaign: Campaign,
  historicalCampaigns: Campaign[] = []
): Promise<{ diagnosis: AIDiagnosisResult; usedFallback: boolean; errorNote?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        campaign,
        historicalContext: historicalCampaigns.map(c => ({
          name: c.name,
          platform: c.platform,
          ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) + '%' : '0%',
          cvr: c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(2) + '%' : '0%',
          roas: c.spend > 0 ? (c.revenue / c.spend).toFixed(2) + 'x' : '0x',
        })),
      }),
    });

    clearTimeout(timeoutId);

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.ok && data?.success && data?.diagnosis) {
      return {
        diagnosis: {
          ...data.diagnosis,
          id: `diag-gemini-${Date.now()}`,
          campaignId: campaign.id,
          campaignName: campaign.name,
          timestamp: new Date().toISOString(),
          provider: 'gemini',
        },
        usedFallback: false,
      };
    }

    // Server indicated fallback, busy model, or error occurred
    const fallbackDiagnosis = generateRuleBasedDiagnosis(campaign);
    return {
      diagnosis: fallbackDiagnosis,
      usedFallback: true,
      errorNote: data?.error || 'Loaded instantaneous rule-based diagnostic engine.',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[CampaignPilot AI] Network, timeout, or server error during diagnosis, switching to rule engine:', err);
    const fallbackDiagnosis = generateRuleBasedDiagnosis(campaign);
    return {
      diagnosis: fallbackDiagnosis,
      usedFallback: true,
      errorNote: 'Loaded instantaneous rule-based diagnostic engine.',
    };
  }
}

/**
 * Chat with Marketing Assistant, with smart local fallback calculations if server is unavailable.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  campaigns: Campaign[],
  activeCampaignId?: string
): Promise<{ reply: string; usedFallback: boolean }> {
  const latestMessage = messages[messages.length - 1]?.text || '';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        messages,
        activeCampaignId,
        campaignsSummary: campaigns.map(c => {
          const m = calculateCampaignMetrics(c);
          return {
            id: c.id,
            name: c.name,
            platform: c.platform,
            objective: c.objective,
            spend: c.spend,
            revenue: c.revenue,
            clicks: c.clicks,
            impressions: c.impressions,
            conversions: c.conversions,
            ctr: `${m.ctr.toFixed(2)}%`,
            cvr: `${m.cvr.toFixed(2)}%`,
            cpc: `$${m.cpc.toFixed(2)}`,
            cpa: `$${m.cpa.toFixed(2)}`,
            roas: `${m.roas.toFixed(2)}x`,
            profit: `$${m.profit.toFixed(2)}`,
            notes: c.audienceNotes || 'None',
          };
        }),
      }),
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.reply) {
        return { reply: data.reply, usedFallback: false };
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[CampaignPilot AI] Assistant backend unreachable or timed out, falling back to local heuristic response:', err);
  }

  // Factual local response synthesizer grounded on the actual campaigns
  const localReply = generateLocalAssistantAnswer(latestMessage, campaigns);
  return { reply: localReply, usedFallback: true };
}

/**
 * Local assistant engine for answering marketing queries factually using application data
 */
function generateLocalAssistantAnswer(query: string, campaigns: Campaign[]): string {
  const lower = query.toLowerCase();

  if (campaigns.length === 0) {
    return 'There are currently no campaigns recorded. You can add a new campaign or reset the demo data to start analyzing metrics.';
  }

  // Question: highest CTR
  if (lower.includes('highest ctr') || lower.includes('best ctr') || lower.includes('click through')) {
    const sorted = [...campaigns].map(c => ({
      name: c.name,
      platform: c.platform,
      ctr: calculateCampaignMetrics(c).ctr,
    })).sort((a, b) => b.ctr - a.ctr);

    const best = sorted[0];
    return `Based on your recorded data, **${best.name}** (${best.platform}) has the highest CTR at **${best.ctr.toFixed(2)}%**.\n\nAll campaigns by CTR:\n${sorted.map((c, i) => `${i + 1}. ${c.name}: ${c.ctr.toFixed(2)}%`).join('\n')}`;
  }

  // Question: ROAS comparison
  if (lower.includes('roas') || lower.includes('return on ad spend') || lower.includes('profit')) {
    const sorted = [...campaigns].map(c => {
      const m = calculateCampaignMetrics(c);
      return {
        name: c.name,
        platform: c.platform,
        roas: m.roas,
        profit: m.profit,
        revenue: c.revenue,
        spend: c.spend,
      };
    }).sort((a, b) => b.roas - a.roas);

    return `Campaign performance ranked by ROAS:\n\n${sorted.map((c, i) => `${i + 1}. **${c.name}** (${c.platform})\n   - ROAS: **${c.roas.toFixed(2)}x**\n   - Spend: $${c.spend.toLocaleString()} | Revenue: $${c.revenue.toLocaleString()} (Net Profit: $${c.profit.toLocaleString()})`).join('\n\n')}\n\n*Top performer:* **${sorted[0].name}** generates the highest return per dollar spent.`;
  }

  // Question: conversion rate / low cvr
  if (lower.includes('conversion rate') || lower.includes('cvr') || lower.includes('why') && lower.includes('low')) {
    const sorted = [...campaigns].map(c => ({
      name: c.name,
      platform: c.platform,
      cvr: calculateCampaignMetrics(c).cvr,
      notes: c.audienceNotes,
    })).sort((a, b) => a.cvr - b.cvr);

    const lowest = sorted[0];
    return `Looking at conversion rates across your active campaigns, **${lowest.name}** (${lowest.platform}) has the lowest CVR at **${lowest.cvr.toFixed(2)}%**.\n\nCommon causes for conversion drops observed in this dataset:\n- **Post-click friction:** If CTR is healthy but CVR is low, users are intrigued by the ad but encounter confusion, slow page load, or checkout friction on the landing page.\n- **Audience expectation mismatch:** Ensure the value proposition promised in the ad copy exactly matches the first above-the-fold headline on your page.\n- **Tracking anomalies:** Check if pixel conversion triggers fired accurately.`;
  }

  // Question: summarize performance
  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('overview')) {
    const totalSpend = campaigns.reduce((acc, c) => acc + c.spend, 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenue, 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
    const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);
    const overallROAS = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0';

    return `**Campaign Portfolio Summary:**\n- Total Campaigns: **${campaigns.length}**\n- Aggregate Spend: **$${totalSpend.toLocaleString()}**\n- Aggregate Revenue: **$${totalRevenue.toLocaleString()}** (Net Margin: **$${(totalRevenue - totalSpend).toLocaleString()}**)\n- Overall ROAS: **${overallROAS}x**\n- Total Clicks: **${totalClicks.toLocaleString()}**\n- Total Conversions: **${totalConversions.toLocaleString()}**\n\nYour portfolio is currently net-profitable overall. Use the Campaign Analysis page to diagnose individual campaign bottlenecks.`;
  }

  // Default helpful analytical response
  return `I have analyzed your **${campaigns.length} active campaigns**. You can ask me specific questions such as:\n- *"Which campaign has the highest CTR?"*\n- *"Compare my campaigns by ROAS"*\n- *"Why is my conversion rate dropping?"*\n- *"Summarize portfolio performance"*`;
}
