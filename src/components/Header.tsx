import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Calendar,
  ChevronDown,
  Sparkles,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';
import { useCampaigns } from '../context/CampaignContext';
import { NavigationPage } from './Sidebar';

interface HeaderProps {
  currentPage: NavigationPage;
  onOpenMobileSidebar: () => void;
  onOpenAddModal: () => void;
  onOpenAssistant: () => void;
  onOpenResetConfirm: () => void;
  onNavigate: (page: NavigationPage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  onOpenAddModal,
  onOpenAssistant,
  onOpenResetConfirm,
  onNavigate,
}) => {
  const {
    campaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    dateRange,
    setDateRange,
    settings,
  } = useCampaigns();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getPageTitle = (page: NavigationPage): string => {
    switch (page) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'analysis':
        return 'Campaign Diagnostic Analysis';
      case 'recommendations':
        return 'AI Recommendations Center';
      case 'channels':
        return 'Channel Breakdown & Comparisons';
      case 'reports':
        return 'Performance Reports & Export';
      case 'settings':
        return 'Workspace Settings & Architecture';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
            {getPageTitle(currentPage)}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500">
            Real-time attribution, diagnosis & optimization recommendations
          </p>
        </div>
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Campaign Switcher (for non-channel pages) */}
        {campaigns.length > 0 && (
          <div className="hidden lg:flex items-center">
            <select
              value={selectedCampaignId || ''}
              onChange={(e) => setSelectedCampaignId(e.target.value || null)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.platform})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range Selector */}
        <div className="relative hidden md:flex items-center">
          <div className="pointer-events-none absolute left-2.5 flex items-center text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-medium text-slate-700 hover:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
          >
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Assistant Quick Button */}
        <button
          onClick={onOpenAssistant}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 sm:px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
          title="Open AI Marketing Assistant"
        >
          <Bot className="h-4 w-4 text-indigo-600" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Add Campaign Button */}
        <button
          onClick={onOpenAddModal}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Campaign</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              {settings.displayName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{settings.displayName}</p>
                  <p className="text-[11px] text-slate-500">{settings.userRole}</p>
                  <p className="text-[10px] text-indigo-600 mt-1 font-mono font-medium">Currency: {settings.preferredCurrency}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>Workspace Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenResetConfirm();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-amber-700 hover:bg-amber-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                    <span>Reset Demo Campaigns</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
