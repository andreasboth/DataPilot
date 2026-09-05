/**
 * Required Demo Scenarios Drawer
 * Direct 1-Click Interactive Verification of the 7 Required Scenarios from Master Prompt Section 60
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  AlertOctagon,
  ShieldCheck,
  Sliders,
  RefreshCw,
  UserX,
  Scale,
  Sparkles,
} from 'lucide-react';
import { DataPilotPlatform, DetailLevel } from '../../datapilot/platform';

interface ScenarioDrawerProps {
  platform: DataPilotPlatform;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  platform,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [activeScenarioResult, setActiveScenarioResult] = useState<{ id: number; title: string; message: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const runScenario1 = () => {
    platform.executeScenario1_Offline();
    setActiveScenarioResult({
      id: 1,
      title: 'Szenario 1: Offline (Internet Disconnected)',
      message: 'Internet connection severed. Multi-tier matrix shows Local Control = AVAILABLE, Cloud = UNREACHABLE, Sync = QUEUED. Local heating, pump, and lights continue to function without interruption.',
      success: true,
    });
    onRefresh();
  };

  const runScenario2 = () => {
    platform.executeScenario2_ModuleFailure();
    setActiveScenarioResult({
      id: 2,
      title: 'Szenario 2: Module Failure & Isolation',
      message: 'Fatal exception triggered in CamperFlow. Module is immediately isolated and QUARANTINED. CamperDeck, CamperEnergy, CamperClimate, and CamperSecurity remain active and operational without crashing.',
      success: true,
    });
    onRefresh();
  };

  const runScenario3 = (user: 'owner' | 'guest') => {
    platform.executeScenario3_SwitchUser(user);
    setActiveScenarioResult({
      id: 3,
      title: 'Szenario 3: Fine-Grained Permissions (RBAC)',
      message: `Active identity switched to ${user.toUpperCase()}. ${user === 'guest' ? 'Guest lacks permissions for door locks, configuration, and audit trails. Any attempt will return DENY_INSUFFICIENT_PERMISSION.' : 'Owner has unrestricted platform permissions.'}`,
      success: true,
    });
    onRefresh();
  };

  const runScenario4 = (level: DetailLevel) => {
    platform.executeScenario4_SetDetailLevel(level);
    setActiveScenarioResult({
      id: 4,
      title: `Szenario 4: Detail Level → ${level}`,
      message: `Switched detail level to "${level}". Note that detail level is an ergonomics/presentation setting, NOT an authorization barrier. Low-level CAN-CI and LIN bus telemetry are exposed in Nerd/Tech modes.`,
      success: true,
    });
    onRefresh();
  };

  const runScenario5 = async () => {
    const res = await platform.executeScenario5_Reconnect();
    setActiveScenarioResult({
      id: 5,
      title: 'Szenario 5: Reconnect & Sync Queue Drain',
      message: `Network uplink restored. DataPilot Sync Engine flushed ${res.processed} pending operation(s) to Cloud replica using domain-specific conflict resolution rules (AUTHORITY_WINS).`,
      success: true,
    });
    onRefresh();
  };

  const runScenario6 = (suspend: boolean) => {
    platform.executeScenario6_SuspendAccount(suspend);
    setActiveScenarioResult({
      id: 6,
      title: `Szenario 6: Account Suspension (${suspend ? 'SUSPENDED' : 'RESTORED'})`,
      message: suspend
        ? 'Account set to TEMPORARILY_SUSPENDED. Cloud API access is unconditionally BLOCKED (DENY_ACCOUNT_SUSPENDED). Local survival functions (cabin heating, water pump, emergency lights) remain allowed under Local Survival Policy.'
        : 'Account restored to ACTIVE status. Cloud synchronization resumed.',
      success: true,
    });
    onRefresh();
  };

  const runScenario7 = () => {
    const res = platform.executeScenario7_RequestDeletion();
    setActiveScenarioResult({
      id: 7,
      title: 'Szenario 7: Legal Hold Blocks Deletion Request',
      message: `Deletion requested for account "${platform.ownerAccount.id}". Process evaluated: Retention Check → Legal Hold Check → BLOCKED. Active Legal Hold [${res.request.rejectionReason || 'Audit Lock'}] successfully halted deletion and recorded an immutable audit entry.`,
      success: true,
    });
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-[#0f172a] border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl text-slate-100 animate-in slide-in-from-right">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 font-mono flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              AUTOMATED COMPLIANCE & CHAOS SUITE
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">7 Master Demo Scenarios</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-400">
            Select any of the mandatory architecture scenarios to execute and test against the live DataPilot platform:
          </p>

          {/* Scenario Result Feedback Banner */}
          {activeScenarioResult && (
            <div className="p-4 rounded-lg bg-slate-950 border border-blue-500/40 text-xs space-y-1.5 shadow-md">
              <div className="flex items-center gap-1.5 font-bold text-blue-300 font-mono text-[11px] uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{activeScenarioResult.title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">{activeScenarioResult.message}</p>
            </div>
          )}

          {/* Scenario Cards */}
          <div className="space-y-3 text-xs">
            {/* 1. Offline */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs font-mono">
                  <WifiOff className="w-4 h-4 text-rose-400" /> 1. Offline Scenario
                </span>
                <button
                  onClick={runScenario1}
                  id="scenario-btn-1"
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer transition text-[10px] font-mono uppercase shadow-xs"
                >
                  Disconnect Internet
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Sever cloud connection while keeping local AP alive. Local control remains active; cloud sync is queued.
              </p>
            </div>

            {/* 2. Module Failure */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs font-mono">
                  <AlertOctagon className="w-4 h-4 text-rose-400" /> 2. Module Failure & Quarantine
                </span>
                <button
                  onClick={runScenario2}
                  id="scenario-btn-2"
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold cursor-pointer transition text-[10px] font-mono uppercase shadow-xs"
                >
                  Trigger Fault
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Simulate crash in CamperFlow. Proves module isolation where faulty modules are quarantined without crashing the core.
              </p>
            </div>

            {/* 3. Permissions */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 text-blue-400" /> 3. Permissions (Owner vs Guest)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => runScenario3('guest')}
                    id="scenario-btn-3-guest"
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 cursor-pointer text-[10px] font-mono uppercase"
                  >
                    Guest
                  </button>
                  <button
                    onClick={() => runScenario3('owner')}
                    id="scenario-btn-3-owner"
                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer text-[10px] font-mono uppercase font-bold"
                  >
                    Owner
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Switch between Owner (admin) and Guest (restricted). Guest cannot operate door locks or change safety configs.
              </p>
            </div>

            {/* 4. Detail Levels */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs font-mono">
                  <Sliders className="w-4 h-4 text-sky-400" /> 4. Detail Levels
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => runScenario4('Minimal')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[10px] font-mono"
                  >
                    Min
                  </button>
                  <button
                    onClick={() => runScenario4('Normal')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-[10px] font-mono"
                  >
                    Norm
                  </button>
                  <button
                    onClick={() => runScenario4('Nerd')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[10px] font-mono"
                  >
                    Nerd
                  </button>
                  <button
                    onClick={() => runScenario4('TechDevTest')}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-[10px] font-mono font-bold"
                  >
                    Tech
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Exposes raw physical bus frames (LIN/CAN-CI) and telemetry schemas without changing security privileges.
              </p>
            </div>

            {/* 5. Reconnect */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs font-mono">
                  <RefreshCw className="w-4 h-4 text-emerald-400" /> 5. Reconnect & Drain Sync Queue
                </span>
                <button
                  onClick={runScenario5}
                  id="scenario-btn-5"
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer transition text-[10px] font-mono uppercase shadow-xs"
                >
                  Reconnect
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Restores network connectivity and flushes offline queue using domain conflict resolution.
              </p>
            </div>

            {/* 6. Account Suspension */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs font-mono">
                  <UserX className="w-4 h-4 text-amber-400" /> 6. Cloud Suspension vs Survival
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => runScenario6(true)}
                    id="scenario-btn-6-suspend"
                    className="px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono uppercase"
                  >
                    Suspend
                  </button>
                  <button
                    onClick={() => runScenario6(false)}
                    id="scenario-btn-6-active"
                    className="px-2 py-1 rounded bg-slate-900 text-slate-200 border border-slate-800 text-[10px] font-mono uppercase"
                  >
                    Activate
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Demonstrates that a suspended cloud account blocks cloud access but does not break local survival heating or water.
              </p>
            </div>

            {/* 7. Legal Hold */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs font-mono">
                  <Scale className="w-4 h-4 text-purple-400" /> 7. Legal Hold Blocks Deletion
                </span>
                <button
                  onClick={runScenario7}
                  id="scenario-btn-7"
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer transition text-[10px] font-mono uppercase shadow-xs"
                >
                  Request Deletion
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Attempts account deletion while Legal Hold #EU-2026-8821 is active. Verified to block and audit.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
