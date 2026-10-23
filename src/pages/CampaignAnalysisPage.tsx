import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  HelpCircle,
  BarChart2,
  DollarSign,
  Target,
  ArrowRight,
  Layers,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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
  calculateCampaignMetrics,
  formatCurrency,
  formatPercent,
  formatNumber,
  PLATFORM_BENCHMARKS,
} from '../utils/metrics';
import { generateRuleBasedDiagnosis } from '../services/ai/ruleBasedDiagnosis';
import { NavigationPage } from '../components/Sidebar';

interface CampaignAnalysisPageProps {
  onNavigate: (page: NavigationPage) => void;
  onOpenAddModal: () => void;
}

export const CampaignAnalysisPage: React.FC<CampaignAnalysisPageProps> = ({
  onNavigate,
  onOpenAddModal,
}) => {
  const {
    campaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCampaign,
    activeDiagnosis,
    isDiagnosing,
    runDiagnosisForCampaign,
    settings,
    aiStatus,
    updateRecommendationStatus,
  } = useCampaigns();

  const [activeChartTab, setActiveChartTab] = useState<'ctr_cvr' | 'impressions_clicks' | 'spend_revenue' | 'conversions'>('ctr_cvr');

  if (!selectedCampaign) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <h3 className="text-base font-bold text-slate-800">No Campaign Selected</h3>
        <p className="mt-1 text-xs text-slate-500">Please create or select a campaign to view diagnostic analysis.</p>
        <button
          onClick={onOpenAddModal}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Create Campaign
        </button>
      </div>
    );
  }

  const metrics = calculateCampaignMetrics(selectedCampaign);
  const benchmark = PLATFORM_BENCHMARKS[selectedCampaign.platform] || PLATFORM_BENCHMARKS['Other'];
  const diagnosis = activeDiagnosis || generateRuleBasedDiagnosis(selectedCampaign);

  // Time-series chart points from campaign dailyMetrics (or synthetic distribution)
  const chartPoints = React.useMemo(() => {
    if (selectedCampaign.dailyMetrics && selectedCampaign.dailyMetrics.length > 0) {
      return selectedCampaign.dailyMetrics.map((d) => ({
        ...d,
        ctr: d.impressions > 0 ? parseFloat(((d.clicks / d.impressions) * 100).toFixed(2)) : 0,
        cvr: d.clicks > 0 ? parseFloat(((d.conversions / d.clicks) * 100).toFixed(2)) : 0,
        roas: d.spend > 0 ? parseFloat((d.revenue / d.spend).toFixed(2)) : 0,
        cpc: d.clicks > 0 ? parseFloat((d.spend / d.clicks).toFixed(2)) : 0,
      }));
    }

    // Default 5 points based on campaign totals
    const days = ['Day 1', 'Day 7', 'Day 14', 'Day 21', 'Day 28'];
    return days.map((day, i) => {
      const factor = 0.15 + (i * 0.05);
      const im = Math.round(selectedCampaign.impressions * factor);
      const cl = Math.round(selectedCampaign.clicks * factor);
      const co = Math.round(selectedCampaign.conversions * factor);
      const sp = Math.round(selectedCampaign.spend * factor);
      const re = Math.round(selectedCampaign.revenue * factor);
      return {
        date: day,
        impressions: im,
        clicks: cl,
        conversions: co,
        spend: sp,
        revenue: re,
        ctr: im > 0 ? parseFloat(((cl / im) * 100).toFixed(2)) : 0,
        cvr: cl > 0 ? parseFloat(((co / cl) * 100).toFixed(2)) : 0,
        roas: sp > 0 ? parseFloat((re / sp).toFixed(2)) : 0,
        cpc: cl > 0 ? parseFloat((sp / cl).toFixed(2)) : 0,
      };
    });
  }, [selectedCampaign]);

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Campaign Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {selectedCampaign.platform}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-600">{selectedCampaign.objective}</span>
            {selectedCampaign.isDemo && (
              <>
                <span className="text-xs text-slate-400">·</span>
                <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Demo Record
                </span>
              </>
            )}
          </div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedCampaign.name}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Runtime: {selectedCampaign.startDate} to {selectedCampaign.endDate}
            {selectedCampaign.audienceNotes ? ` · Notes: ${selectedCampaign.audienceNotes}` : ''}
          </p>
        </div>

        {/* Campaign Switcher & Re-run Diagnosis Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCampaign.id}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white focus:border-indigo-500 focus:outline-none"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.platform})
              </option>
            ))}
          </select>

          <button
            onClick={() => runDiagnosisForCampaign(selectedCampaign.id)}
            disabled={isDiagnosing}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isDiagnosing ? 'Analyzing...' : 'Re-Run AI Diagnosis'}</span>
          </button>
        </div>
      </div>

      {/* 10 Key Calculated Metrics Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          10 Key Calculated Marketing Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Impressions */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500">Impressions</span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatNumber(selectedCampaign.impressions)}
            </div>
            <span className="text-[10px] text-slate-400">Total Views</span>
          </div>

          {/* Clicks */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500">Clicks</span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatNumber(selectedCampaign.clicks)}
            </div>
            <span className="text-[10px] text-slate-400">Total Inbound</span>
          </div>

          {/* CTR */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">CTR</span>
              <span className={`text-[10px] font-semibold ${metrics.ctr >= benchmark.ctr ? 'text-emerald-600' : 'text-amber-600'}`}>
                {benchmark.ctr}% bench
              </span>
            </div>
            <div className={`text-lg font-bold font-mono tabular-nums mt-1 ${metrics.ctr >= benchmark.ctr ? 'text-emerald-700' : 'text-amber-700'}`}>
              {formatPercent(metrics.ctr)}
            </div>
            <span className="text-[10px] text-slate-400">(Clicks / Impr)</span>
          </div>

          {/* Conversions */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500">Conversions</span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatNumber(selectedCampaign.conversions)}
            </div>
            <span className="text-[10px] text-slate-400">Leads / Purchases</span>
          </div>

          {/* CVR */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">CVR</span>
              <span className={`text-[10px] font-semibold ${metrics.cvr >= benchmark.cvr ? 'text-emerald-600' : 'text-amber-600'}`}>
                {benchmark.cvr}% bench
              </span>
            </div>
            <div className={`text-lg font-bold font-mono tabular-nums mt-1 ${metrics.cvr >= benchmark.cvr ? 'text-emerald-700' : 'text-amber-700'}`}>
              {formatPercent(metrics.cvr)}
            </div>
            <span className="text-[10px] text-slate-400">(Conv / Clicks)</span>
          </div>

          {/* Spend */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500">Spend</span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatCurrency(selectedCampaign.spend, settings.preferredCurrency, 0)}
            </div>
            <span className="text-[10px] text-slate-400">Budget: ${selectedCampaign.budget.toLocaleString()}</span>
          </div>

          {/* CPC */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500">CPC</span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatCurrency(metrics.cpc, settings.preferredCurrency)}
            </div>
            <span className="text-[10px] text-slate-400">Spend / Clicks</span>
          </div>

          {/* CPA */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500">CPA</span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatCurrency(metrics.cpa, settings.preferredCurrency)}
            </div>
            <span className="text-[10px] text-slate-400">Spend / Conversions</span>
          </div>

          {/* Revenue */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <span className="text-[11px] font-semibold text-slate-500">Revenue</span>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatCurrency(selectedCampaign.revenue, settings.preferredCurrency, 0)}
            </div>
            <span className="text-[10px] text-slate-400">Total Attributed</span>
          </div>

          {/* ROAS */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">ROAS</span>
              <span className="text-[10px] text-slate-400 font-mono">Profit: ${metrics.profit.toLocaleString()}</span>
            </div>
            <div className={`text-lg font-bold font-mono tabular-nums mt-1 ${metrics.roas >= 2.0 ? 'text-emerald-700' : metrics.roas < 1.0 ? 'text-red-600' : 'text-slate-900'}`}>
              {metrics.roas.toFixed(2)}x
            </div>
            <span className="text-[10px] text-slate-400">Revenue / Spend</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campaign Performance Visualizations</h3>
            <p className="text-xs text-slate-500">Interactive trends over campaign runtime</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setActiveChartTab('ctr_cvr')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeChartTab === 'ctr_cvr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              CTR vs CVR
            </button>
            <button
              onClick={() => setActiveChartTab('impressions_clicks')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeChartTab === 'impressions_clicks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Impressions & Clicks
            </button>
            <button
              onClick={() => setActiveChartTab('spend_revenue')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeChartTab === 'spend_revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Spend vs Revenue
            </button>
            <button
              onClick={() => setActiveChartTab('conversions')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeChartTab === 'conversions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Daily Conversions
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'ctr_cvr' ? (
              <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#6366F1" unit="%" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#10B981" unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '']}
                  contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line yAxisId="left" type="monotone" dataKey="ctr" name="CTR (%)" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="cvr" name="CVR (%)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            ) : activeChartTab === 'impressions_clicks' ? (
              <AreaChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="impressions" name="Impressions" stroke="#94A3B8" fill="#CBD5E1" fillOpacity={0.3} />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
              </AreaChart>
            ) : activeChartTab === 'spend_revenue' ? (
              <BarChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip
                  formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="spend" name="Spend ($)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartPoints} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Marketing Diagnosis Engine Panel */}
      <div className="rounded-2xl border border-indigo-200/80 bg-white p-6 shadow-sm">
        {/* Header with Provider Transparency */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">CampaignPilot Diagnosis Engine</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                  diagnosis?.provider === 'gemini'
                    ? 'bg-purple-50 border border-purple-200 text-purple-700'
                    : 'bg-amber-50 border border-amber-200 text-amber-700'
                }`}>
                  {diagnosis?.provider === 'gemini' ? 'Gemini 3.8 Flash' : 'Rule-Based Analytical Fallback'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grounded in entered metrics · Facts strictly distinguished from causal hypotheses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Confidence: <strong className="text-slate-700">{diagnosis?.confidence || 'High'}</strong>
            </span>
          </div>
        </div>

        {/* Diagnosis Content */}
        {isDiagnosing ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-3 animate-spin">
              <RefreshCw className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">Analyzing Campaign Data with Diagnosis Agent...</p>
            <p className="text-xs text-slate-500 mt-1">Comparing benchmarks, calculating unit economics, and drafting evidence-based recommendations.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Executive Summary */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Executive Summary</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {diagnosis.executive_summary}
              </p>
            </div>

            {/* Strengths vs Performance Concerns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths (Observed Facts) */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Observed Strengths (Factual Metrics)</span>
                </div>
                <ul className="space-y-2">
                  {diagnosis.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Performance Concerns */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Performance Concerns & Drag Points</span>
                </div>
                <ul className="space-y-2">
                  {diagnosis.performance_concerns.map((c, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Possible Causes (Hypotheses) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  <span>Possible Causal Explanations</span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  Distinguished Hypotheses
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                These are hypothesized root causes generated from data patterns, clearly distinguished from confirmed factual data.
              </p>
              <div className="space-y-2">
                {diagnosis.possible_causes.map((cause, i) => (
                  <div key={i} className="rounded-lg bg-white border border-slate-200/80 p-3 text-xs text-slate-700">
                    {cause}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Data Needed for Causal Certainty */}
            {diagnosis.missing_data && diagnosis.missing_data.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Additional Information Required for Definitive Attribution
                </h4>
                <div className="flex flex-wrap gap-2">
                  {diagnosis.missing_data.map((item, idx) => (
                    <span key={idx} className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Prioritized Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Prioritized Action Items ({diagnosis.recommendations?.length || 0})
                </h4>
                <button
                  onClick={() => onNavigate('recommendations')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Open Full Recommendation Center</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-3">
                {diagnosis.recommendations?.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              rec.priority === 'High'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : rec.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {rec.priority} Priority
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-[11px] font-semibold text-indigo-600 uppercase">
                            {rec.category}
                          </span>
                        </div>
                        <h5 className="mt-1.5 text-xs font-bold text-slate-900">{rec.title}</h5>
                        <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{rec.explanation}</p>
                      </div>

                      <div className="shrink-0">
                        {rec.status === 'completed' ? (
                          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Done
                          </span>
                        ) : (
                          <button
                            onClick={() => updateRecommendationStatus(rec.id, 'completed')}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                      <div>
                        <strong>Supporting Evidence:</strong> {rec.metric_evidence}
                      </div>
                      <div>·</div>
                      <div>
                        <strong>Expected Outcome:</strong> {rec.expected_impact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
