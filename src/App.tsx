/**
 * DataPilot Platform Main Application Root
 * Hosts CamperPilot product prototype (CamperDeck & CamperFlow)
 */

import React, { useState, useEffect } from 'react';
import { dataPilotPlatform } from './datapilot/platform';
import { HeaderBar } from './ui/components/HeaderBar';
import { CamperDeckView } from './ui/components/CamperDeckView';
import { CamperFlowView } from './ui/components/CamperFlowView';
import { TestRunnerView } from './ui/components/TestRunnerView';
import { ArchitectureDocsView } from './ui/components/ArchitectureDocsView';
import { ConnectivityModal } from './ui/components/ConnectivityModal';
import { ScenarioDrawer } from './ui/components/ScenarioDrawer';

export default function App() {
  const platform = dataPilotPlatform;

  const [activeTab, setActiveTab] = useState<'deck' | 'flow' | 'tests' | 'architecture' | 'audit'>('deck');
  const [isConnectivityOpen, setIsConnectivityOpen] = useState(false);
  const [isScenarioDrawerOpen, setIsScenarioDrawerOpen] = useState(false);

  // Reactive State
  const [telemetry, setTelemetry] = useState(platform.hardwareSimulator.getTelemetry());
  const [connectivityMatrix, setConnectivityMatrix] = useState(platform.connectivityEngine.getMatrix());
  const [capabilities, setCapabilities] = useState(platform.connectivityEngine.getCapabilities());
  const [currentLocale, setCurrentLocale] = useState(platform.localizationEngine.getLocale());
  const [currentDetail, setCurrentDetail] = useState(platform.currentDetailLevel);
  const [activeUser, setActiveUser] = useState(platform.currentActiveUser);
  const [, setModuleList] = useState(platform.moduleRegistry.getAllModules());

  // Subscribe to reactive platform streams
  useEffect(() => {
    const unsubTelemetry = platform.hardwareSimulator.subscribe((t) => setTelemetry(t));
    const unsubConn = platform.connectivityEngine.subscribe((m, c) => {
      setConnectivityMatrix(m);
      setCapabilities(c);
    });
    const unsubLoc = platform.localizationEngine.subscribe((l) => setCurrentLocale(l));
    const unsubMod = platform.moduleRegistry.subscribe((mods) => setModuleList(mods));

    return () => {
      unsubTelemetry();
      unsubConn();
      unsubLoc();
      unsubMod();
    };
  }, [platform]);

  // Sync active user & detail level when scenarios trigger changes
  const handleRefresh = () => {
    setTelemetry(platform.hardwareSimulator.getTelemetry());
    setConnectivityMatrix(platform.connectivityEngine.getMatrix());
    setCapabilities(platform.connectivityEngine.getCapabilities());
    setCurrentDetail(platform.currentDetailLevel);
    setActiveUser(platform.currentActiveUser);
  };

  return (
    <div className="min-h-screen bg-[#020617] bg-dot-grid text-slate-200 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Android Cabin Tablet Header */}
      <HeaderBar
        platform={platform}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConnectivity={() => setIsConnectivityOpen(true)}
        onOpenScenarioDrawer={() => setIsScenarioDrawerOpen(true)}
        connectivityMatrix={connectivityMatrix}
        capabilities={capabilities}
        currentLanguage={currentLocale.language}
        currentRegister={currentLocale.register}
        currentDetail={currentDetail}
        activeUser={activeUser}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-8">
        {activeTab === 'deck' && (
          <CamperDeckView
            platform={platform}
            telemetry={telemetry}
            detailLevel={currentDetail}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'flow' && (
          <CamperFlowView platform={platform} onRefresh={handleRefresh} />
        )}

        {activeTab === 'tests' && <TestRunnerView />}

        {activeTab === 'architecture' && <ArchitectureDocsView />}
      </main>

      {/* Professional Polish Status Ticker Footer */}
      <footer className="h-10 bg-[#020617]/95 border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono text-slate-500 sticky bottom-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEMS NOMINAL
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="hidden sm:inline">LATENCY: &lt;1ms (LOCAL BUS)</span>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-400">CHANNEL: CAN-BUS / LIN</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:inline">LOCAL-FIRST ARBITER ACTIVE</span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 font-semibold">DATAPILOT ENTERPRISE</span>
        </div>
      </footer>

      {/* Multi-Tier Connectivity Inspector Modal */}
      {isConnectivityOpen && (
        <ConnectivityModal
          platform={platform}
          matrix={connectivityMatrix}
          capabilities={capabilities}
          onClose={() => setIsConnectivityOpen(false)}
        />
      )}

      {/* 7 Demo Scenarios Drawer */}
      <ScenarioDrawer
        platform={platform}
        isOpen={isScenarioDrawerOpen}
        onClose={() => setIsScenarioDrawerOpen(false)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
