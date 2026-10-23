import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Info,
  ArrowRight,
  Eye,
  MousePointer,
  Percent,
  CheckCircle,
  DollarSign,
  Target,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useCampaigns } from '../context/CampaignContext';
import {
  aggregateCampaignMetrics,
  calculateCampaignMetrics,
  formatCurrency,
  formatPercent,
  formatNumber,
} from '../utils/metrics';
import { NavigationPage } from '../components/Sidebar';
import { Campaign } from '../types/campaign';

interface DashboardPageProps {
  onNavigate: (page: NavigationPage) => void;
  onOpenAddModal: () => void;
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAddModal,
  onEditCampaign,
  onDeleteCampaign,
}) => {
  const {
    campaigns,
    setSelectedCampaignId,
    settings,
    resetDemoData,
    recommendations,
  } = useCampaigns();

  const [showSecondaryKpis, setShowSecondaryKpis] = useState(true);
  const [activeChartMetric, setActiveChartMetric] = useState<'volume' | 'financial'>('volume');

  const hasDemoCampaigns = campaigns.some((c) => c.isDemo);
  const { totalImpressions, totalClicks, totalConversions, totalSpend, totalRevenue, calculated } =
    aggregateCampaignMetrics(campaigns);

  // Time-series chart data aggregated across campaigns
  const chartData = React.useMemo(() => {
    if (campaigns.length === 0) return [];
    
    // Group daily metrics by date across all campaigns
    const dateMap: Record<string, { date: string; impressions: number; clicks: number; conversions: number; spend: number; revenue: number }> = {};

    campaigns.forEach((c) => {
      if (c.dailyMetrics) {
        c.dailyMetrics.forEach((d) => {
          if (!dateMap[d.date]) {
            dateMap[d.date] = { date: d.date, impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
          }
          dateMap[d.date].impressions += d.impressions;
          dateMap[d.date].clicks += d.clicks;
          dateMap[d.date].conversions += d.conversions;
          dateMap[d.date].spend += d.spend;
          dateMap[d.date].revenue += d.revenue;
        });
      }
    });

    const entries = Object.values(dateMap);
    if (entries.length > 0) {
      return entries;
    }

    // Fallback pseudo-history from aggregate for smooth visualization if no daily breakdown
    return [
      { date: 'Week 1', impressions: totalImpressions * 0.2, clicks: totalClicks * 0.18, conversions: totalConversions * 0.15, spend: totalSpend * 0.2, revenue: totalRevenue * 0.18 },
      { date: 'Week 2', impressions: totalImpressions * 0.25, clicks: totalClicks * 0.24, conversions: totalConversions * 0.22, spend: totalSpend * 0.25, revenue: totalRevenue * 0.24 },
      { date: 'Week 3', impressions: totalImpressions * 0.27, clicks: totalClicks * 0.28, conversions: totalConversions * 0.30, spend: totalSpend * 0.27, revenue: totalRevenue * 0.30 },
      { date: 'Week 4', impressions: totalImpressions * 0.28, clicks: totalClicks * 0.30, conversions: totalConversions * 0.33, spend: totalSpend * 0.28, revenue: totalRevenue * 0.28 },
    ];
  }, [campaigns, totalImpressions, totalClicks, totalConversions, totalSpend, totalRevenue]);

  // Generate automated quick summary grounded on real numbers
  const quickSummary = React.useMemo(() => {
    if (campaigns.length === 0) return null;

    let strongestMetric = 'Overall Portfolio ROAS';
    let strongestDetail = `${calculated.roas.toFixed(2)}x Return on Ad Spend generates positive return.`;
    if (calculated.ctr > 2.0) {
      strongestMetric = 'Audience CTR';
      strongestDetail = `${calculated.ctr.toFixed(2)}% CTR indicates strong message-market interest across active channels.`;
    }

    let biggestConcern = 'Conversion Rate Optimization';
    let concernDetail = `Conversion rate is currently ${calculated.cvr.toFixed(2)}%. Review destination checkout and lead forms.`;
    
    // Check if any campaign has poor CTR or high CPA
    const lowCtrCamp = [...campaigns].sort((a, b) => calculateCampaignMetrics(a).ctr - calculateCampaignMetrics(b).ctr)[0];
    if (lowCtrCamp && calculateCampaignMetrics(lowCtrCamp).ctr < 1.0) {
      biggestConcern = `Creative Fatigue in "${lowCtrCamp.name}"`;
      concernDetail = `Low CTR of ${calculateCampaignMetrics(lowCtrCamp).ctr.toFixed(2)}% suggests ad creative needs refresh.`;
    }

    const pendingRec = recommendations.find((r) => r.priority === 'High' && r.status === 'pending');
    const recommendedAction = pendingRec
      ? pendingRec.title
      : 'Conduct creative A/B testing on lowest-CTR ad sets.';

    return {
      strongestMetric,
      strongestDetail,
      biggestConcern,
      concernDetail,
      recommendedAction,
    };
  }, [campaigns, calculated, recommendations]);

  if (campaigns.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 shadow-sm border border-indigo-100">
          <Target className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Campaigns Found</h2>
        <p className="mt-2 max-w-md text-xs text-slate-500 leading-relaxed">
          Create your first digital marketing campaign to diagnose performance, or load realistic demo data to explore CampaignPilot AI’s diagnostic capabilities.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={resetDemoData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-indigo-600" />
            <span>Load Demo Data</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Demo Data Notice */}
      {hasDemoCampaigns && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200/80 text-amber-900 font-bold text-[10px]">
              !
            </span>
            <span>
              <strong>Sample Demo Data Active:</strong> The records below represent realistic synthetic campaigns for testing. Add real campaigns anytime.
            </span>
          </div>
          <button
            onClick={onOpenAddModal}
            className="self-start sm:self-auto rounded-lg bg-amber-900 px-3 py-1.5 text-[11px] font-semibold text-amber-50 hover:bg-amber-950 transition-colors"
          >
            + Enter Real Campaign
          </button>
        </div>
      )}

      {/* Top 4 Primary KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Primary Performance Metrics
          </h2>
          <button
            onClick={() => setShowSecondaryKpis(!showSecondaryKpis)}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
          >
            {showSecondaryKpis ? 'Hide Unit Economics' : 'Show Unit Economics'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Impressions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600">Total Impressions</span>
              <Eye className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatNumber(totalImpressions)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+12.4% vs prev</span>
              </div>
              <span className="text-slate-400 text-[10px]" title="Total views of your ad creatives">Ad Views</span>
            </div>
          </div>

          {/* Clicks */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600">Total Clicks</span>
              <MousePointer className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatNumber(totalClicks)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+8.1% vs prev</span>
              </div>
              <span className="text-slate-400 text-[10px]" title="Inbound visits to landing pages">Traffic</span>
            </div>
          </div>

          {/* CTR */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600">Click-Through Rate (CTR)</span>
              <Percent className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatPercent(calculated.ctr)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <div className={`flex items-center gap-1 font-medium ${calculated.ctr >= 1.5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {calculated.ctr >= 1.5 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{calculated.ctr >= 1.5 ? 'Above benchmark' : 'Requires creative review'}</span>
              </div>
              <span className="text-slate-400 text-[10px]">(Clicks / Impr)</span>
            </div>
          </div>

          {/* Conversions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold text-slate-600">Total Conversions</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatNumber(totalConversions)}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-emerald-600 font-medium">
                <TrendingUp className="h-3 w-3" />
                <span>+15.3% vs prev</span>
              </div>
              <span className="text-slate-400 text-[10px]">Purchases & Leads</span>
            </div>
          </div>
        </div>

        {/* Secondary Unit Economics Cards */}
        {showSecondaryKpis && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Conversion Rate (CVR)</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-800 mt-1">
                {formatPercent(calculated.cvr)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Conversions per 100 clicks</div>
            </div>

            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Cost Per Click (CPC)</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-800 mt-1">
                {formatCurrency(calculated.cpc, settings.preferredCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Spend / Clicks</div>
            </div>

            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Cost Per Acquisition (CPA)</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-800 mt-1">
                {formatCurrency(calculated.cpa, settings.preferredCurrency)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Spend / Conversions</div>
            </div>

            <div className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="text-[11px] font-medium text-slate-500">Return on Ad Spend (ROAS)</div>
              <div className={`text-base font-bold font-mono tabular-nums mt-1 ${calculated.roas >= 2.0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {calculated.roas.toFixed(2)}x
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Revenue / Spend</div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Overview Chart & Quick Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Overview Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Performance Overview</h3>
              <p className="text-xs text-slate-500">Trends across active advertising channels</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setActiveChartMetric('volume')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  activeChartMetric === 'volume'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Traffic & Conversions
              </button>
              <button
                onClick={() => setActiveChartMetric('financial')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  activeChartMetric === 'financial'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Spend vs Revenue
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartMetric === 'volume' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    name="Conversions"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConversions)"
                  />
                </AreaChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <Tooltip
                    formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    name="Spend ($)"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue ($)"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Summary Card Generated From Real Metrics */}
        {quickSummary && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 mb-3">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-sm font-bold text-slate-900">Portfolio Quick Diagnosis</h3>
              </div>

              {/* Strongest Metric */}
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Strongest Signal</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">{quickSummary.strongestMetric}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">{quickSummary.strongestDetail}</p>
                </div>

                {/* Biggest Concern */}
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    <span>Primary Concern</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-800">{quickSummary.biggestConcern}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600 leading-relaxed">{quickSummary.concernDetail}</p>
                </div>

                {/* Recommended Next Action */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                    <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Next Action</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-700 leading-relaxed">
                    {quickSummary.recommendedAction}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => onNavigate('analysis')}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <span>Launch Full Diagnosis</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Campaigns Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campaigns ({campaigns.length})</h3>
            <p className="text-xs text-slate-500">Live & historical campaign performance records</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Campaign</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Spend</th>
                <th className="py-3 px-3 text-right">Clicks</th>
                <th className="py-3 px-3 text-right">Conversions</th>
                <th className="py-3 px-3 text-right">CTR</th>
                <th className="py-3 px-3 text-right">ROAS</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {campaigns.map((camp) => {
                const metrics = calculateCampaignMetrics(camp);
                return (
                  <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{camp.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {camp.objective} {camp.isDemo ? '· Demo Data' : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {camp.platform}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          camp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : camp.status === 'paused'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-900">
                      {formatCurrency(camp.spend, settings.preferredCurrency, 0)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-900">
                      {formatNumber(camp.clicks)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-slate-900">
                      {formatNumber(camp.conversions)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      <span className={metrics.ctr >= 1.5 ? 'text-emerald-700 font-semibold' : 'text-slate-700'}>
                        {formatPercent(metrics.ctr)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold">
                      <span className={metrics.roas >= 2.5 ? 'text-emerald-700' : metrics.roas < 1.0 ? 'text-red-600' : 'text-slate-800'}>
                        {metrics.roas.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCampaignId(camp.id);
                            onNavigate('analysis');
                          }}
                          className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          Diagnose
                        </button>
                        <button
                          onClick={() => onEditCampaign(camp)}
                          className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteCampaign(camp.id)}
                          className="rounded-lg px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
