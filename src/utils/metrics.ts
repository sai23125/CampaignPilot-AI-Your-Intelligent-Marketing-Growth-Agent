import { Campaign, CalculatedMetrics } from '../types/campaign';

/**
 * Calculates standard digital marketing performance metrics safely with zero-division handling.
 */
export function calculateCampaignMetrics(campaign: Pick<Campaign, 'impressions' | 'clicks' | 'conversions' | 'spend' | 'revenue'>): CalculatedMetrics {
  const impressions = Number(campaign.impressions) || 0;
  const clicks = Number(campaign.clicks) || 0;
  const conversions = Number(campaign.conversions) || 0;
  const spend = Number(campaign.spend) || 0;
  const revenue = Number(campaign.revenue) || 0;

  // CTR = (Clicks / Impressions) * 100
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

  // CVR = (Conversions / Clicks) * 100
  const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;

  // CPC = Spend / Clicks
  const cpc = clicks > 0 ? spend / clicks : 0;

  // CPA = Spend / Conversions
  const cpa = conversions > 0 ? spend / conversions : 0;

  // ROAS = Revenue / Spend
  const roas = spend > 0 ? revenue / spend : 0;

  // CPM = (Spend / Impressions) * 1000
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

  // Net Profit = Revenue - Spend
  const profit = revenue - spend;

  return {
    ctr,
    cvr,
    cpc,
    cpa,
    roas,
    cpm,
    profit,
  };
}

/**
 * Aggregate metrics across a collection of campaigns
 */
export function aggregateCampaignMetrics(campaigns: Campaign[]): {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  calculated: CalculatedMetrics;
} {
  const totals = campaigns.reduce(
    (acc, curr) => ({
      totalImpressions: acc.totalImpressions + (Number(curr.impressions) || 0),
      totalClicks: acc.totalClicks + (Number(curr.clicks) || 0),
      totalConversions: acc.totalConversions + (Number(curr.conversions) || 0),
      totalSpend: acc.totalSpend + (Number(curr.spend) || 0),
      totalRevenue: acc.totalRevenue + (Number(curr.revenue) || 0),
    }),
    { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalSpend: 0, totalRevenue: 0 }
  );

  const calculated = calculateCampaignMetrics({
    impressions: totals.totalImpressions,
    clicks: totals.totalClicks,
    conversions: totals.totalConversions,
    spend: totals.totalSpend,
    revenue: totals.totalRevenue,
  });

  return {
    ...totals,
    calculated,
  };
}

/**
 * Formats currency values with correct symbol and decimal control
 */
export function formatCurrency(amount: number | null | undefined, currency: string = '$', decimals: number = 2): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }
  return `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Formats a percentage safely
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formats standard integers with commas
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Industry benchmarks by platform for objective comparisons
 */
export const PLATFORM_BENCHMARKS: Record<string, { ctr: number; cvr: number; cpc: number; roas: number }> = {
  'Google Ads': { ctr: 3.17, cvr: 4.40, cpc: 2.69, roas: 3.0 },
  'Meta Ads': { ctr: 1.25, cvr: 3.20, cpc: 1.85, roas: 2.8 },
  'Instagram': { ctr: 0.95, cvr: 2.80, cpc: 1.45, roas: 2.5 },
  'LinkedIn': { ctr: 0.65, cvr: 3.50, cpc: 5.25, roas: 2.2 },
  'Other': { ctr: 1.10, cvr: 3.00, cpc: 2.00, roas: 2.5 },
};
