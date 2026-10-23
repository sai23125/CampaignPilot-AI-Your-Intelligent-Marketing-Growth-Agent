import React, { useState } from 'react';
import { CampaignProvider, useCampaigns } from './context/CampaignContext';
import { Sidebar, NavigationPage } from './components/Sidebar';
import { Header } from './components/Header';
import { CampaignModal } from './components/CampaignModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ConfirmModal } from './components/ConfirmModal';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignAnalysisPage } from './pages/CampaignAnalysisPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ChannelBreakdownPage } from './pages/ChannelBreakdownPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Campaign } from './types/campaign';

const MainLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    isDestructive?: boolean;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  const { addCampaign, updateCampaign, deleteCampaign, resetDemoData, clearAllData } = useCampaigns();

  const handleEditCampaign = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setCampaignToEdit(null);
  };

  const handleSaveCampaign = (data: any) => {
    if (campaignToEdit) {
      updateCampaign({
        ...campaignToEdit,
        ...data,
      });
    } else {
      addCampaign(data);
    }
  };

  const handleDeleteCampaign = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Campaign',
      message: 'Are you sure you want to permanently delete this campaign? This action cannot be undone.',
      isDestructive: true,
      confirmLabel: 'Delete',
      action: () => deleteCampaign(id),
    });
  };

  const handleConfirmResetDemo = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Demo Campaigns',
      message: 'This will reset your campaigns back to the 3 default demo records (Google Ads, Meta Ads, and LinkedIn). Any custom campaigns will be replaced.',
      isDestructive: false,
      confirmLabel: 'Reset Demo Data',
      action: () => resetDemoData(),
    });
  };

  const handleConfirmClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Workspace Data',
      message: 'This will erase all campaigns, diagnoses, and assistant conversation history. You can still reload demo data later.',
      isDestructive: true,
      confirmLabel: 'Clear All',
      action: () => clearAllData(),
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAddModal={() => {
            setCampaignToEdit(null);
            setIsAddModalOpen(true);
          }}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onOpenResetConfirm={handleConfirmResetDemo}
          onNavigate={setCurrentPage}
        />

        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentPage}
              onOpenAddModal={() => {
                setCampaignToEdit(null);
                setIsAddModalOpen(true);
              }}
              onEditCampaign={handleEditCampaign}
              onDeleteCampaign={handleDeleteCampaign}
            />
          )}

          {currentPage === 'analysis' && (
            <CampaignAnalysisPage
              onNavigate={setCurrentPage}
              onOpenAddModal={() => {
                setCampaignToEdit(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {currentPage === 'recommendations' && <RecommendationsPage />}

          {currentPage === 'channels' && <ChannelBreakdownPage />}

          {currentPage === 'reports' && <ReportsPage />}

          {currentPage === 'settings' && (
            <SettingsPage
              onOpenResetConfirm={handleConfirmResetDemo}
              onOpenClearConfirm={handleConfirmClearAll}
            />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <CampaignModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCampaign}
        initialData={campaignToEdit}
      />

      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default function App() {
  return (
    <CampaignProvider>
      <MainLayout />
    </CampaignProvider>
  );
}
