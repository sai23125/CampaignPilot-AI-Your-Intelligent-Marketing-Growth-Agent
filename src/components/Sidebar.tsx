import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Layers,
  FileText,
  Settings,
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';

export type NavigationPage = 
  | 'dashboard' 
  | 'analysis' 
  | 'recommendations' 
  | 'channels' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenAssistant: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenAssistant,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { recommendations, settings, aiStatus } = useCampaigns();

  const pendingRecsCount = recommendations.filter((r) => r.status === 'pending').length;

  const navItems: {
    id: NavigationPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Campaign Analysis', icon: BarChart3 },
    {
      id: 'recommendations',
      label: 'AI Recommendations',
      icon: Sparkles,
      badge: pendingRecsCount > 0 ? pendingRecsCount : undefined,
    },
    { id: 'channels', label: 'Channel Breakdown', icon: Layers },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-[#090D16] border-r border-slate-800/80 text-slate-300 transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white tracking-tight">CampaignPilot AI</span>
            <span className="text-[10px] text-slate-400 font-medium">Growth Diagnosis Agent</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-white font-semibold shadow-xs border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-purple-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Assistant Quick Launcher */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              onOpenAssistant();
              onCloseMobile();
            }}
            className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-700/40 p-3 text-left hover:border-indigo-500 transition-all shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Ask AI Assistant</div>
                <div className="text-[10px] text-indigo-300/80">Ask questions on data</div>
              </div>
            </div>
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          </button>
        </div>

        {/* AI Status / Architecture Footer */}
        <div className="px-4 py-3 bg-[#070A11] border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-slate-400 font-medium">AI Engine</span>
            <div className="flex items-center gap-1.5">
              {aiStatus.aiConfigured ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-300 font-mono text-[10px]">Gemini 3.8</span>
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span className="text-amber-300 font-mono text-[10px]">Rule Engine</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">AWS Readiness</span>
            <span className="text-indigo-400 font-mono text-[10px]">Bedrock Ready</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090D16]">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-white">
              {settings.displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">{settings.displayName}</span>
              <span className="text-[10px] text-slate-400 truncate">{settings.userRole}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
