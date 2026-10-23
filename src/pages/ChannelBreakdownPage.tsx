import React, { useState } from 'react';
import {
  Layers,
  Award,
  TrendingUp,
  DollarSign,
  MousePointer,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { useCampaigns } from '../context/CampaignContext';
import {
  AdvertisingPlatform,
  Campaign,
  CalculatedMetrics,
} from '../types/campaign';
import {
  calculateCampaignMetrics,
  formatCurrency,
  formatPercent,
  formatNumber,
} from '../utils/metrics';

interface ChannelSummary {
  platform: AdvertisingPlatform;
  campaignCount: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  metrics: CalculatedMetrics;
}

const PLATFORM_COLORS: Record<string, string> = {
  'Google Ads': '#4285F4',
  'Meta Ads': '#0081FB',
  'Instagram': '#E1306C',
  'LinkedIn': '#0A66C2',
  'Other': '#8B5CF6',
};

export const ChannelBreakdownPage: React.FC = () => {
  const { campaigns, settings } = useCampaigns();
  const [selectedObjective, setSelectedObjective] = useState<'roas' | 'cpa' | 'volume' | 'ctr'>('roas');

  // Group campaigns by platform
  const channelData: ChannelSummary[] = React.useMemo(() => {
    const map: Record<string, { campaigns: Campaign[]; impressions: number; clicks: number; conversions: number; spend: number; revenue: number }> = {};

    campaigns.forEach((c) => {
      if (!map[c.platform]) {
        map[c.platform] = { campaigns: [], impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
      }
      map[c.platform].campaigns.push(c);
      map[c.platform].impressions += c.impressions;
      map[c.platform].clicks += c.clicks;
      map[c.platform].conversions += c.conversions;
      map[c.platform].spend += c.spend;
      map[c.platform].revenue += c.revenue;
    });

    return Object.entries(map).map(([platform, data]) => {
      const metrics = calculateCampaignMetrics({
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        spend: data.spend,
        revenue: data.revenue,
      });

      return {
        platform: platform as AdvertisingPlatform,
        campaignCount: data.campaigns.length,
        totalImpressions: data.impressions,
        totalClicks: data.clicks,
        totalConversions: data.conversions,
        totalSpend: data.spend,
        totalRevenue: data.revenue,
        metrics,
      };
    });
  }, [campaigns]);

  // Identify best channel based on objective
  const bestChannel = React.useMemo(() => {
    if (channelData.length === 0) return null;

    let winner = channelData[0];
    let reason = '';

    if (selectedObjective === 'roas') {
      winner = [...channelData].sort((a, b) => b.metrics.roas - a.metrics.roas)[0];
      reason = `Generates highest return on ad spend at ${winner.metrics.roas.toFixed(2)}x ROAS ($${winner.totalRevenue.toLocaleString()} revenue on $${winner.totalSpend.toLocaleString()} spend).`;
    } else if (selectedObjective === 'cpa') {
      const validCpa = channelData.filter((c) => c.metrics.cpa > 0);
      winner = [...validCpa].sort((a, b) => a.metrics.cpa - b.metrics.cpa)[0] || channelData[0];
      reason = `Delivers the lowest acquisition cost per converted customer at $${winner.metrics.cpa.toFixed(2)} CPA.`;
    } else if (selectedObjective === 'volume') {
      winner = [...channelData].sort((a, b) => b.totalConversions - a.totalConversions)[0];
      reason = `Drives the largest total conversion volume with ${winner.totalConversions.toLocaleString()} conversions.`;
    } else {
      winner = [...channelData].sort((a, b) => b.metrics.ctr - a.metrics.ctr)[0];
      reason = `Achieves highest ad engagement with a ${winner.metrics.ctr.toFixed(2)}% Click-Through Rate.`;
    }

    return { winner, reason };
  }, [channelData, selectedObjective]);

  if (channelData.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <Layers className="h-8 w-8 text-slate-300 mb-2" />
        <h3 className="text-base font-bold text-slate-800">No Channel Data Available</h3>
        <p className="mt-1 text-xs text-slate-500">Add campaigns with associated advertising platforms to see cross-channel comparisons.</p>
      </div>
    );
  }

  // Chart data formatting
  const comparisonChartData = channelData.map((c) => ({
    name: c.platform,
    ctr: parseFloat(c.metrics.ctr.toFixed(2)),
    cvr: parseFloat(c.metrics.cvr.toFixed(2)),
    conversions: c.totalConversions,
    spend: c.totalSpend,
    revenue: c.totalRevenue,
    roas: parseFloat(c.metrics.roas.toFixed(2)),
  }));

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cross-Platform Channel Comparison</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare acquisition efficiency, conversion rates, and revenue across active platforms.
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 font-medium">
          {channelData.length} active marketing channels evaluated
        </div>
      </div>

      {/* Best Performing Channel Evaluator */}
      {bestChannel && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Optimal Platform Pick
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs font-bold text-slate-900">
                    {bestChannel.winner.platform}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  Highest Efficiency for Selected Objective
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{bestChannel.reason}</p>
              </div>
            </div>

            {/* Objective Selector */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <span className="text-xs font-semibold text-slate-600">Goal:</span>
              <select
                value={selectedObjective}
                onChange={(e) => setSelectedObjective(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none"
              >
                <option value="roas">Maximize ROAS (Revenue Efficiency)</option>
                <option value="cpa">Minimize CPA (Cheapest Acquisition)</option>
                <option value="volume">Maximize Conversion Volume</option>
                <option value="ctr">Maximize Ad CTR (Engagement)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {channelData.map((c) => {
          const color = PLATFORM_COLORS[c.platform] || '#6366F1';
          return (
            <div
              key={c.platform}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <h3 className="text-sm font-bold text-slate-900">{c.platform}</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {c.campaignCount} campaign{c.campaignCount > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Primary Metrics */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Spend</span>
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {formatCurrency(c.totalSpend, settings.preferredCurrency, 0)}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Revenue</span>
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {formatCurrency(c.totalRevenue, settings.preferredCurrency, 0)}
                    </div>
                  </div>
                </div>

                {/* 6-Metric Breakdown */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Impressions</span>
                    <span className="font-mono tabular-nums text-slate-800">{formatNumber(c.totalImpressions)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Clicks</span>
                    <span className="font-mono tabular-nums text-slate-800">{formatNumber(c.totalClicks)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Click-Through Rate (CTR)</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">{formatPercent(c.metrics.ctr)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Total Conversions</span>
                    <span className="font-mono tabular-nums text-slate-800">{formatNumber(c.totalConversions)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Conversion Rate (CVR)</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">{formatPercent(c.metrics.cvr)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Cost Per Acquisition (CPA)</span>
                    <span className="font-mono tabular-nums text-slate-800">{formatCurrency(c.metrics.cpa, settings.preferredCurrency)}</span>
                  </div>
                </div>
              </div>

              {/* ROAS Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Platform ROAS</span>
                <span className={`text-base font-bold font-mono tabular-nums ${c.metrics.roas >= 2.5 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {c.metrics.roas.toFixed(2)}x
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Platform Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CTR & CVR by Platform */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">CTR vs CVR by Platform (%)</h3>
          <p className="text-xs text-slate-500 mb-4">Ad engagement vs onsite conversion efficiency</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="ctr" name="CTR (%)" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cvr" name="CVR (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend vs Revenue by Platform */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Spend vs Revenue Generated ($)</h3>
          <p className="text-xs text-slate-500 mb-4">Capital efficiency and gross margin returns</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip
                  formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="spend" name="Spend ($)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attribution & Fairness Disclosures (Mandatory from Section 10) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          <span>Cross-Platform Comparison Methodology & Data Disclosures</span>
        </h4>
        <p className="leading-relaxed">
          Cross-platform comparisons are calculated from recorded campaign parameters. Note that direct cross-platform evaluation can be affected by distinct platform attribution windows (e.g. 7-day click vs view-through attribution), divergent audience intent levels (active search intent on Google Ads vs passive visual feed discovery on Instagram), and budget sample sizes.
        </p>
      </div>
    </div>
  );
};
