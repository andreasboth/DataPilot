/**
 * Android Tablet / Touchscreen Top Status Bar & App Header
 * Displays multi-tier connectivity, Active User, Language/Register, Detail Level, and Quick Actions.
 */

import React from 'react';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  User,
  Shield,
  Layers,
  Languages,
  Activity,
  AlertTriangle,
  PlayCircle,
  FileCode2,
  Terminal,
} from 'lucide-react';
import { DataPilotPlatform, DetailLevel } from '../../datapilot/platform';
import { PolitenessRegister, SupportedLanguage } from '../../datapilot/localization/localizationEngine';
import { DetailedConnectivityMatrix, ComputedOperationCapabilities } from '../../datapilot/connectivity/connectivity';

interface HeaderBarProps {
  platform: DataPilotPlatform;
  activeTab: 'deck' | 'flow' | 'tests' | 'architecture' | 'audit';
  setActiveTab: (tab: 'deck' | 'flow' | 'tests' | 'architecture' | 'audit') => void;
  onOpenConnectivity: () => void;
  onOpenScenarioDrawer: () => void;
  connectivityMatrix: DetailedConnectivityMatrix;
  capabilities: ComputedOperationCapabilities;
  currentLanguage: SupportedLanguage;
  currentRegister: PolitenessRegister;
  currentDetail: DetailLevel;
  activeUser: 'owner' | 'guest';
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  platform,
  activeTab,
  setActiveTab,
  onOpenConnectivity,
  onOpenScenarioDrawer,
  connectivityMatrix,
  capabilities,
  currentLanguage,
  currentRegister,
  currentDetail,
  activeUser,
}) => {
  const loc = platform.localizationEngine;

  return (
    <header className="bg-[#0f172a] text-slate-100 border-b border-slate-800 shadow-sm sticky top-0 z-30 select-none backdrop-blur-md">
      {/* Top Telemetry & Status Ticker */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 bg-[#020617]/70">
        <div className="flex items-center gap-3">
          {/* Professional Polish Brand Mark */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-[10px] tracking-tighter shadow-[0_0_10px_rgba(37,99,235,0.5)]">
              DP
            </div>
            <div className="flex items-center gap-1.5 font-bold tracking-wider text-white text-xs uppercase">
              DATAPILOT
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
          <span className="text-slate-700">|</span>
          <span className="font-medium text-slate-300">
            {loc.t('product.camperpilot')} <span className="text-slate-500 font-normal">v1.0 (Hymer Grand Canyon 4x4)</span>
          </span>
          {platform.ownerAccount.state !== 'ACTIVE' && (
            <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[11px] font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Account: {platform.ownerAccount.state}
            </span>
          )}
        </div>

        {/* Multi-tier Connectivity Status Summary */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onOpenConnectivity}
            id="btn-connectivity-inspector"
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer text-slate-300 shadow-xs"
            title="Click to view full 9-tier Connectivity Matrix"
          >
            {capabilities.localControlAvailable ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Local Bus:</span> OK
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                Local: Degraded
              </span>
            )}

            <span className="text-slate-700">•</span>

            {capabilities.cloudSyncAvailable ? (
              <span className="flex items-center gap-1 text-sky-400 font-medium">
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cloud:</span> Sync
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <CloudOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cloud:</span> Queued ({platform.syncEngine.getPendingCount()})
              </span>
            )}

            <span className="text-blue-400 text-[10px] font-medium ml-1">Inspect</span>
          </button>

          {/* Quick Scenario Runner Trigger */}
          <button
            onClick={onOpenScenarioDrawer}
            id="btn-scenarios-drawer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.35)]"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>7 Demo Scenarios</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation & Control Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('deck')}
            id="tab-camperdeck"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm transition ${
              activeTab === 'deck'
                ? 'bg-blue-600/15 border border-blue-500/50 text-blue-200 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            CamperDeck
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            id="tab-camperflow"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm transition ${
              activeTab === 'flow'
                ? 'bg-blue-600/15 border border-blue-500/50 text-blue-200 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-400" />
            CamperFlow
            {platform.moduleRegistry.getModule('camperpilot.camperflow')?.state === 'QUARANTINED' && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            id="tab-tests"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm transition ${
              activeTab === 'tests'
                ? 'bg-blue-600/15 border border-blue-500/50 text-blue-200 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-blue-400" />
            Test Runner (18)
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            id="tab-architecture"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm transition ${
              activeTab === 'architecture'
                ? 'bg-blue-600/15 border border-blue-500/50 text-blue-200 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-blue-400" />
            Architecture & Contracts
          </button>
        </nav>

        {/* User Context, Language & Detail Level Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active User Switcher (Owner vs Guest) */}
          <div className="flex items-center rounded-md bg-slate-900 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => platform.executeScenario3_SwitchUser('owner')}
              id="btn-user-owner"
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
                activeUser === 'owner'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" />
              Owner
            </button>
            <button
              onClick={() => platform.executeScenario3_SwitchUser('guest')}
              id="btn-user-guest"
              className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition ${
                activeUser === 'guest'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3" />
              Guest
            </button>
          </div>

          {/* Language & Register Switcher */}
          <div className="flex items-center rounded-md bg-slate-900 p-0.5 border border-slate-800 text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <select
              value={currentLanguage}
              onChange={(e) => platform.localizationEngine.setLocale({ language: e.target.value as any })}
              id="select-language"
              aria-label="Language selection"
              className="bg-transparent text-slate-300 py-1 pr-2 focus:outline-none cursor-pointer"
            >
              <option value="de" className="bg-slate-900 text-white">DE (Hochdeutsch)</option>
              <option value="en" className="bg-slate-900 text-white">EN (English)</option>
              <option value="tlh" className="bg-slate-900 text-white">tlh (Klingon 🖖)</option>
            </select>

            <span className="text-slate-700 mr-1">|</span>

            {/* Politeness Register (Du vs Sie) */}
            <select
              value={currentRegister}
              onChange={(e) => platform.localizationEngine.setLocale({ register: e.target.value as any })}
              id="select-register"
              aria-label="Politeness register selection"
              className="bg-transparent text-blue-400 font-medium py-1 pr-2 focus:outline-none cursor-pointer"
              title="Politeness Profile: Du (informal) vs Sie (formal)"
            >
              <option value="informal" className="bg-slate-900 text-blue-300">Du (Informal)</option>
              <option value="formal" className="bg-slate-900 text-blue-300">Sie (Formal)</option>
            </select>
          </div>

          {/* Detail Level Selector */}
          <div className="flex items-center rounded-md bg-slate-900 px-2 py-1 border border-slate-800 text-xs">
            <span className="text-slate-400 mr-1.5 hidden sm:inline font-mono uppercase text-[10px]">Detail:</span>
            <select
              value={currentDetail}
              onChange={(e) => platform.executeScenario4_SetDetailLevel(e.target.value as any)}
              id="select-detail-level"
              aria-label="Dashboard detail level"
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Minimal" className="bg-slate-900 text-white">Minimal</option>
              <option value="Normal" className="bg-slate-900 text-white">Normal</option>
              <option value="Nerd" className="bg-slate-900 text-white">Nerd (Telemetry)</option>
              <option value="TechDevTest" className="bg-slate-900 text-white">Tech / Dev / Test</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
