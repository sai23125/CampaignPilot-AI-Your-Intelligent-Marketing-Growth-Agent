import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Campaign, AdvertisingPlatform, CampaignObjective, CampaignStatus } from '../types/campaign';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: any) => void;
  initialData?: Campaign | null;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<AdvertisingPlatform>('Meta Ads');
  const [objective, setObjective] = useState<CampaignObjective>('Conversions');
  const [status, setStatus] = useState<CampaignStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [spend, setSpend] = useState<number | ''>('');
  const [impressions, setImpressions] = useState<number | ''>('');
  const [clicks, setClicks] = useState<number | ''>('');
  const [conversions, setConversions] = useState<number | ''>('');
  const [revenue, setRevenue] = useState<number | ''>('');
  const [audienceNotes, setAudienceNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPlatform(initialData.platform);
      setObjective(initialData.objective);
      setStatus(initialData.status);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setBudget(initialData.budget);
      setSpend(initialData.spend);
      setImpressions(initialData.impressions);
      setClicks(initialData.clicks);
      setConversions(initialData.conversions);
      setRevenue(initialData.revenue);
      setAudienceNotes(initialData.audienceNotes || '');
    } else {
      // Default to today and 30 days ahead
      const today = new Date().toISOString().split('T')[0];
      const future = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setName('');
      setPlatform('Meta Ads');
      setObjective('Conversions');
      setStatus('active');
      setStartDate(today);
      setEndDate(future);
      setBudget(2500);
      setSpend(1850);
      setImpressions(85000);
      setClicks(1950);
      setConversions(120);
      setRevenue(4800);
      setAudienceNotes('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Campaign name is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date must be on or after start date';
    }
    if (budget === '' || budget < 0) newErrors.budget = 'Budget must be >= 0';
    if (spend === '' || spend < 0) newErrors.spend = 'Spend must be >= 0';
    if (impressions === '' || impressions < 0) newErrors.impressions = 'Impressions must be >= 0';
    if (clicks === '' || clicks < 0) newErrors.clicks = 'Clicks must be >= 0';
    if (conversions === '' || conversions < 0) newErrors.conversions = 'Conversions must be >= 0';
    if (revenue === '' || revenue < 0) newErrors.revenue = 'Revenue must be >= 0';

    if (clicks !== '' && impressions !== '' && Number(clicks) > Number(impressions)) {
      newErrors.clicks = 'Clicks cannot exceed impressions';
    }
    if (conversions !== '' && clicks !== '' && Number(conversions) > Number(clicks)) {
      newErrors.conversions = 'Conversions cannot exceed clicks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      platform,
      objective,
      status,
      startDate,
      endDate,
      budget: Number(budget),
      spend: Number(spend),
      impressions: Number(impressions),
      clicks: Number(clicks),
      conversions: Number(conversions),
      revenue: Number(revenue),
      audienceNotes: audienceNotes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialData ? 'Edit Campaign' : 'Add New Campaign'}
            </h2>
            <p className="text-xs text-slate-500">
              Input campaign advertising parameters and performance metrics for AI diagnosis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Black Friday Lead Acquisition"
              className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                errors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-indigo-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-red-500">{errors.name}</p>}
          </div>

          {/* Platform, Objective & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as AdvertisingPlatform)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Objective *
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as CampaignObjective)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="Conversions">Conversions</option>
                <option value="Lead Generation">Lead Generation</option>
                <option value="Traffic">Traffic</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="App Installs">App Installs</option>
                <option value="Catalog Sales">Catalog Sales</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
              {errors.startDate && <p className="mt-1 text-[11px] text-red-500">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
              {errors.endDate && <p className="mt-1 text-[11px] text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          {/* Budget & Spend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Budget ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="5000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              {errors.budget && <p className="mt-1 text-[11px] text-red-500">{errors.budget}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Spent ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={spend}
                onChange={(e) => setSpend(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="3200"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              {errors.spend && <p className="mt-1 text-[11px] text-red-500">{errors.spend}</p>}
            </div>
          </div>

          {/* Impressions, Clicks, Conversions, Revenue */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Impressions *
              </label>
              <input
                type="number"
                min="0"
                value={impressions}
                onChange={(e) => setImpressions(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="100000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              {errors.impressions && <p className="mt-1 text-[10px] text-red-500">{errors.impressions}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clicks *
              </label>
              <input
                type="number"
                min="0"
                value={clicks}
                onChange={(e) => setClicks(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="2500"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              {errors.clicks && <p className="mt-1 text-[10px] text-red-500">{errors.clicks}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conversions *
              </label>
              <input
                type="number"
                min="0"
                value={conversions}
                onChange={(e) => setConversions(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="150"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              {errors.conversions && <p className="mt-1 text-[10px] text-red-500">{errors.conversions}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Revenue ($) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="7500"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono tabular-nums focus:border-indigo-500 focus:outline-none"
              />
              {errors.revenue && <p className="mt-1 text-[10px] text-red-500">{errors.revenue}</p>}
            </div>
          </div>

          {/* Audience Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Audience & Creative Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={audienceNotes}
              onChange={(e) => setAudienceNotes(e.target.value)}
              placeholder="e.g. Lookalike 2% buyers, video hook highlighting 50% discount. Creative unchanged for 4 weeks."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              {initialData ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
