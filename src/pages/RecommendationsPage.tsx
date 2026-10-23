import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';
import {
  RecommendationItem,
  RecommendationPriority,
  RecommendationCategory,
  RecommendationStatus,
} from '../types/campaign';

export const RecommendationsPage: React.FC = () => {
  const { recommendations, updateRecommendationStatus, refreshAllRecommendations, isDiagnosing } =
    useCampaigns();

  const [priorityFilter, setPriorityFilter] = useState<'All' | RecommendationPriority>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | RecommendationCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | RecommendationStatus>('pending');

  const filtered = recommendations.filter((rec) => {
    const matchesPriority = priorityFilter === 'All' || rec.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesPriority && matchesCategory && matchesStatus;
  });

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;
  const completedCount = recommendations.filter((r) => r.status === 'completed').length;
  const highPriorityCount = recommendations.filter((r) => r.priority === 'High' && r.status === 'pending').length;

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">AI Recommendations Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized tactical steps to optimize CTR, improve conversion rate, and stabilize CPA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshAllRecommendations()}
            disabled={isDiagnosing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
            <span>{isDiagnosing ? 'Regenerating...' : 'Refresh Recommendations'}</span>
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Pending Actions</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting marketer execution</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">High Priority Critical</span>
            <Sparkles className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-red-600">
            {highPriorityCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Highest estimated impact</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Completed Optimizations</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-600">
            {completedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Marked as implemented</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        {/* Status Segments */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['pending', 'completed', 'dismissed', 'All'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors capitalize ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'All' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Priority & Category Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="creative">Creative & Ad Copy</option>
            <option value="landing_page">Landing Page</option>
            <option value="audience">Audience Targeting</option>
            <option value="budget">Budget Allocation</option>
            <option value="conversion">Conversion Tracking</option>
          </select>
        </div>
      </div>

      {/* Recommendation Cards List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No Recommendations Match Current Filters</h4>
          <p className="text-xs text-slate-500 mt-1">
            Try switching filter criteria or click "Refresh Recommendations" to analyze active campaigns.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rec) => {
            const isDone = rec.status === 'completed';
            const isDismissed = rec.status === 'dismissed';

            return (
              <div
                key={rec.id}
                className={`rounded-2xl border p-5 transition-all shadow-xs ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isDismissed
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
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
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-[11px] font-semibold text-indigo-600 uppercase">
                        {rec.category.replace('_', ' ')}
                      </span>
                      {isDone && (
                        <>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                            Completed
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-slate-900">{rec.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{rec.explanation}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start">
                    {isDone ? (
                      <button
                        onClick={() => updateRecommendationStatus(rec.id, 'pending')}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        onClick={() => updateRecommendationStatus(rec.id, 'completed')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {!isDismissed && (
                      <button
                        onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                        title="Dismiss recommendation"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                {/* Evidence & Expected Impact Callouts */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Supporting Metric Evidence
                    </span>
                    <p className="text-slate-800 font-semibold mt-0.5">{rec.metric_evidence}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Estimated Expected Impact
                    </span>
                    <p className="text-slate-800 font-medium mt-0.5">{rec.expected_impact}</p>
                  </div>
                </div>

                {/* Step-by-Step Implementation Checklist */}
                {rec.implementation_steps && rec.implementation_steps.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Suggested Implementation Steps
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {rec.implementation_steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
