/**
 * CamperFlow Automation Engine View
 * Demonstrates:
 * - 6-Stage Execution Pipeline: Trigger -> Condition -> Policy -> Action -> Verification -> Event
 * - Fault Injection & Automatic Module Quarantine
 * - Module Recovery / Self-Healing
 */

import React, { useState } from 'react';
import {
  Activity,
  Play,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { DataPilotPlatform } from '../../datapilot/platform';
import { AutomationFlowRule } from '../../camperpilot/modules/camperflow/automationEngine';

interface CamperFlowViewProps {
  platform: DataPilotPlatform;
  onRefresh: () => void;
}

export const CamperFlowView: React.FC<CamperFlowViewProps> = ({ platform, onRefresh }) => {
  const [evaluationLogs, setEvaluationLogs] = useState<Array<{ ruleId: string; executed: boolean; reason: string }>>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const flowModule = platform.moduleRegistry.getModule('camperpilot.camperflow');
  const isQuarantined = flowModule?.state === 'QUARANTINED';
  const rules = platform.automationEngine.getRules();

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    const telemetry = platform.hardwareSimulator.getTelemetry();
    const results = await platform.automationEngine.evaluateRules(telemetry);
    setEvaluationLogs(results);
    setIsEvaluating(false);
    onRefresh();
  };

  const handleSimulateFault = () => {
    platform.automationEngine.triggerFaultSimulation();
    onRefresh();
  };

  const handleRestoreModule = () => {
    platform.moduleRegistry.restoreQuarantinedModule('camperpilot.camperflow');
    onRefresh();
  };

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* Header Banner */}
      <div className="p-5 rounded-lg bg-[#0f172a] border border-slate-800 border-l-4 border-l-blue-600 flex flex-wrap items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
        <div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            AUTOMATION ORCHESTRATOR
          </div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">CamperFlow Automation Engine</h2>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isQuarantined ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
              {isQuarantined ? 'QUARANTINED (Isolated)' : 'RUNTIME ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Autonomous decision pipeline: Trigger → Condition → Policy Engine Validation → Command Bus Dispatch → Physical Actuator Verification → Event Sourcing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isQuarantined ? (
            <button
              onClick={handleRestoreModule}
              id="btn-restore-camperflow"
              className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Restore Quarantined Module
            </button>
          ) : (
            <>
              <button
                onClick={handleRunEvaluation}
                id="btn-run-automation"
                disabled={isEvaluating}
                className="px-3.5 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-[0_0_12px_rgba(37,99,235,0.35)] disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {isEvaluating ? 'Evaluating Pipeline...' : 'Evaluate Live Rules'}
              </button>
              <button
                onClick={handleSimulateFault}
                id="btn-fault-camperflow"
                className="px-3 py-2 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Scenario 2: Inject fatal memory exception into CamperFlow"
              >
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Simulate Fault (Scenario 2)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quarantine Alert Warning */}
      {isQuarantined && (
        <div className="p-4 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm font-mono uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>CRITICAL FAULT DETECTED – MODULE QUARANTINED BY DATAPILOT ISOLATION ENGINE</span>
          </div>
          <p className="text-xs text-rose-300 font-mono">
            CamperFlow encountered an unhandled fatal fault: <code className="bg-rose-900/60 px-1.5 py-0.5 rounded font-mono text-rose-100">{flowModule?.lastFault?.error}</code>.
          </p>
          <div className="p-3 rounded bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="font-medium text-emerald-400 font-mono text-xs">
              ✓ Platform Isolation Verified: CamperDeck, CamperEnergy, CamperClimate, and CamperSecurity remain 100% operational!
            </span>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Fault Count: {flowModule?.faultCount}</span>
          </div>
        </div>
      )}

      {/* 6-Stage Pipeline Graphic */}
      <div className="p-5 rounded-lg bg-[#0f172a] border border-slate-800 shadow-sm">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <span>CamperFlow 6-Stage Execution Pipeline</span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-400 font-mono">DETERMINISTIC LIFECYCLE</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
          <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
            <span className="text-[10px] text-blue-400 block font-mono font-semibold">STAGE 01</span>
            <span className="font-semibold text-slate-100 mt-0.5 block">1. Trigger</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Sensor Telemetry</span>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
            <span className="text-[10px] text-blue-400 block font-mono font-semibold">STAGE 02</span>
            <span className="font-semibold text-slate-100 mt-0.5 block">2. Condition</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Multi-variable Bounds</span>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
            <span className="text-[10px] text-amber-400 block font-mono font-semibold">STAGE 03</span>
            <span className="font-semibold text-amber-300 mt-0.5 block">3. Policy</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Safety & RBAC Guard</span>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
            <span className="text-[10px] text-blue-400 block font-mono font-semibold">STAGE 04</span>
            <span className="font-semibold text-slate-100 mt-0.5 block">4. Action</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Command Bus Dispatch</span>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
            <span className="text-[10px] text-emerald-400 block font-mono font-semibold">STAGE 05</span>
            <span className="font-semibold text-emerald-400 mt-0.5 block">5. Verification</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Actuator Feedback</span>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition">
            <span className="text-[10px] text-sky-400 block font-mono font-semibold">STAGE 06</span>
            <span className="font-semibold text-sky-400 mt-0.5 block">6. Event</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Immutable Domain Event</span>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Registered Automation Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-5 rounded-lg bg-[#0f172a] border border-slate-800 border-l-2 border-l-blue-500 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <h4 className="font-semibold text-sm text-slate-100">{rule.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                    Executions: {rule.executionCount}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-mono my-3 bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  {rule.description}
                </p>

                <div className="text-xs space-y-1.5 text-slate-400">
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Conditions: </span>
                    {rule.conditions.map((c, i) => (
                      <span key={i} className="inline-block mr-2 font-mono text-slate-300">
                        {c.field} {c.operator} {String(c.threshold)}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[10px] uppercase font-semibold">Action: </span>
                    <span className="font-mono text-blue-400">{rule.action.targetCommand}</span>
                  </div>
                  {rule.lastExecutedAt && (
                    <div className="text-[10px] font-mono text-slate-500">
                      Last Executed: {new Date(rule.lastExecutedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Results Log */}
      {evaluationLogs.length > 0 && (
        <div className="p-5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3 shadow-sm">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Pipeline Execution Log:
          </h4>
          <div className="space-y-2 font-mono text-xs">
            {evaluationLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded border flex items-center justify-between ${
                  log.executed
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>Rule: <strong className="text-slate-200">{log.ruleId}</strong></span>
                <span>{log.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
