import React, { useState } from 'react';
import {
  Settings,
  User,
  DollarSign,
  Calendar,
  Sparkles,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Copy,
  Check,
  Code,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';
import { AWS_BEDROCK_BLUEPRINT } from '../services/ai/bedrockBlueprint';

interface SettingsPageProps {
  onOpenResetConfirm: () => void;
  onOpenClearConfirm: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenResetConfirm,
  onOpenClearConfirm,
}) => {
  const { settings, updateSettings, aiStatus, refreshAiStatus, exportDataJson, importDataJson } =
    useCampaigns();

  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'aws_bedrock' | 'data'>('profile');
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleCopyBlueprint = () => {
    navigator.clipboard.writeText(AWS_BEDROCK_BLUEPRINT.backendImplementationSample);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJson(content);
      if (success) {
        setImportStatus('Successfully imported campaign data!');
      } else {
        setImportStatus('Failed to import: Invalid JSON format.');
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const json = exportDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CampaignPilot_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Workspace Settings & Architecture</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure preferences, inspect AI provider status, and explore AWS Bedrock architecture readiness.
        </p>

        {/* Tab switcher */}
        <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>User Profile & Currency</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'ai'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Provider Status</span>
          </button>

          <button
            onClick={() => setActiveTab('aws_bedrock')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'aws_bedrock'
                ? 'bg-purple-50 text-purple-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>AWS Builder Challenge Blueprint</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === 'data'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Data Persistence & Backup</span>
          </button>
        </div>
      </div>

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Personal & Organization Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={settings.displayName}
                onChange={(e) => updateSettings({ displayName: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role / Title
              </label>
              <input
                type="text"
                value={settings.userRole}
                onChange={(e) => updateSettings({ userRole: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Currency Symbol
              </label>
              <select
                value={settings.preferredCurrency}
                onChange={(e) => updateSettings({ preferredCurrency: e.target.value as any })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="$">$ (USD - United States Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="¥">¥ (JPY - Japanese Yen)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Reporting Period
              </label>
              <select
                value={settings.defaultDateRange}
                onChange={(e) => updateSettings({ defaultDateRange: e.target.value as any })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab: AI Provider Status */}
      {activeTab === 'ai' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Service Health & Environment</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-tier AI engine with server-side Gemini integration and zero-fail rule-based fallback.
              </p>
            </div>
            <button
              onClick={() => refreshAiStatus()}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Refresh Status
            </button>
          </div>

          {/* Status Indicator Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`rounded-xl border p-4 ${
              aiStatus.aiConfigured ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Google Gemini Agent
                </span>
                {aiStatus.aiConfigured ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active & Ready</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Rule Fallback Active</span>
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-700 space-y-1">
                <div>Model: <strong className="font-mono">{aiStatus.model}</strong></div>
                <div>Runtime: <strong>Server-side proxy (`/api/diagnose`)</strong></div>
                <div>Security: <strong>Zero client API key leakage</strong></div>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Rule-Based Engine (Fallback)
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  Always Available
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                If network disruptions occur or API credentials are not provided, CampaignPilot AI automatically executes local heuristic marketing equations so users never experience broken UI or empty screens.
              </p>
            </div>
          </div>

          {/* Configuration Guide */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Configuring GEMINI_API_KEY Securely
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              API keys are never entered or stored in the browser. In AI Studio, add your key to <strong>Settings &gt; Secrets</strong> as <code className="font-mono text-indigo-600">GEMINI_API_KEY</code>, or declare it in your server's <code className="font-mono text-indigo-600">.env</code> file. The Node.js Express server automatically authenticates requests using the official <code className="font-mono text-indigo-600">@google/genai</code> SDK with required User-Agent headers.
            </p>
          </div>
        </div>
      )}

      {/* Tab: AWS Builder Challenge Blueprint */}
      {activeTab === 'aws_bedrock' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">AWS Bedrock Integration Blueprint</h3>
                <span className="rounded-md bg-purple-100 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                  Hackathon Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete architectural specification for dual-homing CampaignPilot AI with Amazon Bedrock, DynamoDB, and S3.
              </p>
            </div>

            <button
              onClick={handleCopyBlueprint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCode ? 'Copied AWS Code!' : 'Copy Bedrock Adapter'}</span>
            </button>
          </div>

          {/* AWS Services Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Cloud className="h-4 w-4 text-purple-600" />
                <span>Amazon Bedrock</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Supports Anthropic Claude 3.5 Sonnet, Amazon Titan Premier, and Amazon Nova Pro via <code className="font-mono text-[11px]">@aws-sdk/client-bedrock-runtime</code>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Database className="h-4 w-4 text-indigo-600" />
                <span>Amazon DynamoDB</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Single-table design with Partition Key <code className="font-mono text-[11px]">userId</code> and Sort Key <code className="font-mono text-[11px]">campaignId</code>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Server className="h-4 w-4 text-emerald-600" />
                <span>Amazon S3</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Encrypted object storage for generated PDF reports and CSV audit exports.
              </p>
            </div>
          </div>

          {/* IAM Least Privilege Policy Preview */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>AWS IAM Least-Privilege Policy Specification</span>
            </h4>
            <pre className="rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-slate-200 overflow-x-auto">
              {JSON.stringify(AWS_BEDROCK_BLUEPRINT.iamPolicy, null, 2)}
            </pre>
          </div>

          {/* Code Adapter Preview */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-purple-600" />
              <span>AWS SDK v3 Invocation Implementation</span>
            </h4>
            <pre className="rounded-xl bg-slate-900 p-4 text-[11px] font-mono text-purple-200 overflow-x-auto">
              {AWS_BEDROCK_BLUEPRINT.backendImplementationSample.trim()}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: Data Persistence */}
      {activeTab === 'data' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Local Data Controls & Migration
          </h3>

          <div className="space-y-4">
            {/* Export & Import */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Backup & Restore Workspace</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export campaign records, diagnoses, and settings to a JSON file, or restore from a previous backup.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Export JSON</span>
                </button>

                <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer">
                  <Upload className="h-3.5 w-3.5 text-purple-600" />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {importStatus && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2.5 text-xs text-indigo-800 font-medium text-center">
                {importStatus}
              </div>
            )}

            {/* Reset Demo Data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/30 p-4">
              <div>
                <h4 className="text-xs font-bold text-amber-900">Reset Demo Data</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Restores the 3 sample campaigns demonstrating normal performance, creative fatigue, and funnel drops.
                </p>
              </div>
              <button
                onClick={onOpenResetConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Demo Campaigns</span>
              </button>
            </div>

            {/* Clear All Data */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/30 p-4">
              <div>
                <h4 className="text-xs font-bold text-red-900">Clear All Workspace Data</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Permanently deletes all campaigns, cached diagnoses, and chat history from localStorage.
                </p>
              </div>
              <button
                onClick={onOpenClearConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
