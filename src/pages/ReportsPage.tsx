import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileDown,
  Printer,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  Layers,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';
import {
  calculateCampaignMetrics,
  aggregateCampaignMetrics,
  formatCurrency,
  formatPercent,
  formatNumber,
} from '../utils/metrics';
import { generateRuleBasedDiagnosis } from '../services/ai/ruleBasedDiagnosis';

export const ReportsPage: React.FC = () => {
  const { campaigns, selectedCampaignId, setSelectedCampaignId, diagnoses, settings } = useCampaigns();
  const [reportScope, setReportScope] = useState<'selected' | 'all'>('all');

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0] || null;

  // Selected or aggregated metrics
  const targetCampaigns = reportScope === 'selected' && selectedCampaign ? [selectedCampaign] : campaigns;
  const { totalImpressions, totalClicks, totalConversions, totalSpend, totalRevenue, calculated } =
    aggregateCampaignMetrics(targetCampaigns);

  const activeDiagnosis =
    (selectedCampaign && diagnoses[selectedCampaign.id]) ||
    (targetCampaigns.length > 0 && diagnoses[targetCampaigns[0].id]) ||
    (targetCampaigns.length > 0 ? generateRuleBasedDiagnosis(targetCampaigns[0]) : null);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (targetCampaigns.length === 0) return;

    const headers = [
      'Campaign Name',
      'Platform',
      'Objective',
      'Status',
      'Start Date',
      'End Date',
      'Budget',
      'Spend',
      'Impressions',
      'Clicks',
      'CTR (%)',
      'Conversions',
      'CVR (%)',
      'CPC ($)',
      'CPA ($)',
      'Revenue',
      'ROAS',
      'Is Demo',
    ];

    const rows = targetCampaigns.map((c) => {
      const m = calculateCampaignMetrics(c);
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.platform}"`,
        `"${c.objective}"`,
        `"${c.status}"`,
        c.startDate,
        c.endDate,
        c.budget,
        c.spend,
        c.impressions,
        c.clicks,
        m.ctr.toFixed(2),
        c.conversions,
        m.cvr.toFixed(2),
        m.cpc.toFixed(2),
        m.cpa.toFixed(2),
        c.revenue,
        m.roas.toFixed(2),
        c.isDemo ? 'Yes' : 'No',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `CampaignPilot_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <FileText className="h-8 w-8 text-slate-300 mb-2" />
        <h3 className="text-base font-bold text-slate-800">No Report Data Available</h3>
        <p className="mt-1 text-xs text-slate-500">Create or import campaign data to generate executive marketing reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto print:max-w-none print:p-0 print:space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Executive Performance Report</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive audit report with metrics, channel attribution, and AI diagnosis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setReportScope('all')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                reportScope === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Campaigns
            </button>
            <button
              onClick={() => setReportScope('selected')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                reportScope === 'selected' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Single Campaign
            </button>
          </div>

          {reportScope === 'selected' && (
            <select
              value={selectedCampaignId || ''}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            title="Download printer-friendly PDF report via browser print"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Branded Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                CP
              </span>
              <span className="text-base font-bold text-slate-900 tracking-tight">CampaignPilot AI</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">
              Digital Marketing Diagnostic Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scope: {reportScope === 'all' ? `Entire Portfolio (${targetCampaigns.length} campaigns)` : selectedCampaign?.name}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
            <div><strong>Generated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Prepared For:</strong> {settings.displayName} ({settings.userRole})</div>
            <div><strong>Data Status:</strong> {targetCampaigns.some((c) => c.isDemo) ? 'Includes Demo Samples' : 'Verified Real Data'}</div>
          </div>
        </div>

        {/* Executive KPI Summary Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            Portfolio KPI Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500">Total Spend</span>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {formatCurrency(totalSpend, settings.preferredCurrency, 0)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500">Total Revenue</span>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {formatCurrency(totalRevenue, settings.preferredCurrency, 0)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500">Blended ROAS</span>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                {calculated.roas.toFixed(2)}x
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500">Total Conversions</span>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {formatNumber(totalConversions)}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-100 p-3 bg-white">
              <span className="text-[10px] text-slate-500">Impressions</span>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                {formatNumber(totalImpressions)}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 p-3 bg-white">
              <span className="text-[10px] text-slate-500">Clicks</span>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                {formatNumber(totalClicks)}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 p-3 bg-white">
              <span className="text-[10px] text-slate-500">Blended CTR</span>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                {formatPercent(calculated.ctr)}
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 p-3 bg-white">
              <span className="text-[10px] text-slate-500">Blended CVR</span>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-800 mt-0.5">
                {formatPercent(calculated.cvr)}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Campaigns Audit Table */}
        <div className="print-avoid-break">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            Campaign Performance Breakdown
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3 text-right">Spend</th>
                  <th className="py-2.5 px-3 text-right">Clicks</th>
                  <th className="py-2.5 px-3 text-right">CTR</th>
                  <th className="py-2.5 px-3 text-right">Conv.</th>
                  <th className="py-2.5 px-3 text-right">CVR</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {targetCampaigns.map((c) => {
                  const m = calculateCampaignMetrics(c);
                  return (
                    <tr key={c.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="py-2.5 px-3">{c.platform}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCurrency(c.spend, settings.preferredCurrency, 0)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.clicks)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatPercent(m.ctr)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatNumber(c.conversions)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatPercent(m.cvr)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCurrency(c.revenue, settings.preferredCurrency, 0)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">{m.roas.toFixed(2)}x</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Diagnosis Section in Report */}
        {activeDiagnosis && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 print-avoid-break">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>AI Marketing Diagnosis & Insights</span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900">Executive Assessment</h4>
              <p className="mt-1 text-xs text-slate-700 leading-relaxed">{activeDiagnosis.executive_summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <h5 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">Key Strengths</h5>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                  {activeDiagnosis.strengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Concerns & Drag Factors</h5>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-700">
                  {activeDiagnosis.performance_concerns.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">!</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {activeDiagnosis.recommendations && activeDiagnosis.recommendations.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-2">
                  Actionable Next Steps
                </h5>
                <div className="space-y-2">
                  {activeDiagnosis.recommendations.slice(0, 3).map((rec, i) => (
                    <div key={i} className="rounded-lg bg-white border border-slate-200 p-3 text-xs">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{rec.title}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold">{rec.priority} Priority</span>
                      </div>
                      <p className="text-slate-600 mt-1">{rec.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Footer / Signature */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>Report compiled by CampaignPilot AI Diagnostic Engine</span>
          <span>Amazon Developer Hackathon Submission Edition</span>
        </div>
      </div>
    </div>
  );
};
