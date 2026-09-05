/**
 * CamperDeck Telemetry & Control Dashboard
 * Demonstrates:
 * - Dynamic Localization with Politeness Registers (Du vs Sie)
 * - Desired vs Actual State handling (e.g. heating convergence)
 * - Multi-level detail rendering (Minimal, Normal, Nerd, Tech/Dev)
 * - Fine-grained Security & Permission checks on actuators
 */

import React, { useState } from 'react';
import {
  BatteryCharging,
  Sun,
  Flame,
  Droplets,
  Lightbulb,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Sliders,
  Power,
  ChevronUp,
  ChevronDown,
  Cpu,
  Database,
  GitBranch,
} from 'lucide-react';
import { DataPilotPlatform, DetailLevel } from '../../datapilot/platform';
import { FullCamperTelemetry } from '../../camperpilot/simulator/camperHardwareSimulator';
import { generateUUID, currentTimestamp } from '../../datapilot/core/types';

interface CamperDeckViewProps {
  platform: DataPilotPlatform;
  telemetry: FullCamperTelemetry;
  detailLevel: DetailLevel;
  onRefresh: () => void;
}

export const CamperDeckView: React.FC<CamperDeckViewProps> = ({
  platform,
  telemetry,
  detailLevel,
  onRefresh,
}) => {
  const loc = platform.localizationEngine;
  const [targetTempInput, setTargetTempInput] = useState<number>(telemetry.climate.desiredTempCelsius);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showFeedback = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setActionFeedback({ message: msg, type });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Actuator Handlers using Command Bus
  const handleSetTemperature = async (temp: number) => {
    const secCtx = platform.getSecurityContext();
    const res = await platform.commandBus.dispatch({
      commandId: generateUUID(),
      commandType: 'SetHeatingTemperature',
      payload: { targetTemperature: temp },
      actor: secCtx.user?.username || 'unknown',
      issuer: secCtx.device?.name || 'Cabin-Tablet',
      requiredPermission: 'device.control',
      scopeType: 'Device',
      scopeTargetId: 'heating.truma',
      correlationId: generateUUID(),
      requestedAt: currentTimestamp(),
    }, secCtx);

    if (res.success) {
      setTargetTempInput(temp);
      showFeedback(`Heating target updated to ${temp}°C. Verified by Truma bus.`, 'success');
      onRefresh();
    } else {
      const err = (res as any).error || 'Command rejected';
      showFeedback(`Command Denied: ${err}`, 'error');
    }
  };

  const handleToggleWaterPump = async () => {
    const secCtx = platform.getSecurityContext();
    const res = await platform.commandBus.dispatch({
      commandId: generateUUID(),
      commandType: 'ToggleWaterPump',
      payload: {},
      actor: secCtx.user?.username || 'unknown',
      issuer: secCtx.device?.name || 'Cabin-Tablet',
      requiredPermission: 'device.control.pump',
      scopeType: 'Device',
      scopeTargetId: 'water.pump',
      correlationId: generateUUID(),
      requestedAt: currentTimestamp(),
    }, secCtx);

    if (res.success) {
      showFeedback(`Water pump toggled: ${!telemetry.water.pumpActive ? 'ACTIVE' : 'OFF'}`, 'success');
      onRefresh();
    } else {
      const err = (res as any).error || 'Permission denied';
      showFeedback(`Access Denied: ${err}`, 'error');
    }
  };

  const handleToggleDoorLock = async (door: 'habitation' | 'cab' | 'all') => {
    const secCtx = platform.getSecurityContext();
    const currentLocked = door === 'habitation' ? telemetry.security.habitationDoorLocked : telemetry.security.cabDoorsLocked;
    const nextLock = !currentLocked;

    const res = await platform.commandBus.dispatch({
      commandId: generateUUID(),
      commandType: 'LockAllDoors',
      payload: { door, locked: nextLock },
      actor: secCtx.user?.username || 'unknown',
      issuer: secCtx.device?.name || 'Cabin-Tablet',
      requiredPermission: 'asset.edit', // Guest lacks this permission!
      scopeType: 'Asset',
      scopeTargetId: 'camper-hymer-01',
      correlationId: generateUUID(),
      requestedAt: currentTimestamp(),
    }, secCtx);

    if (res.success) {
      showFeedback(`Door lock updated: ${nextLock ? 'LOCKED' : 'UNLOCKED'}`, 'success');
      onRefresh();
    } else {
      const err = (res as any).error || 'Permission denied';
      showFeedback(`Security Guard Blocked: ${err}`, 'error');
    }
  };

  const handleToggleLighting = async (area: 'living' | 'bedroom' | 'awning', value: number | boolean) => {
    const secCtx = platform.getSecurityContext();
    const res = await platform.commandBus.dispatch({
      commandId: generateUUID(),
      commandType: 'SetLight',
      payload: { area, value },
      actor: secCtx.user?.username || 'unknown',
      issuer: secCtx.device?.name || 'Cabin-Tablet',
      requiredPermission: 'device.control.light',
      scopeType: 'Device',
      scopeTargetId: `light.${area}`,
      correlationId: generateUUID(),
      requestedAt: currentTimestamp(),
    }, secCtx);

    if (res.success) {
      onRefresh();
    } else {
      const err = (res as any).error || 'Permission denied';
      showFeedback(`Denied: ${err}`, 'error');
    }
  };

  const isNerd = detailLevel === 'Nerd' || detailLevel === 'NerdPlus' || detailLevel === 'TechDevTest';
  const isTechDev = detailLevel === 'TechDevTest';

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Welcome Greeting (demonstrating register & localization) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-lg bg-[#0f172a] border border-slate-800 border-l-4 border-l-blue-600 text-slate-100 shadow-sm backdrop-blur-sm">
        <div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE VEHICLE DECK
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            {loc.t('greeting')}, {platform.currentActiveUser === 'owner' ? platform.ownerUser.displayName : platform.guestUser.displayName}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {loc.t('deck.title')} • Local Vehicle Gateway: <span className="font-mono text-emerald-400 font-medium">hymer-gateway.local</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-medium">
            Active Role: <strong className="text-blue-400">{platform.currentActiveUser === 'owner' ? 'Owner (Full Access)' : 'Guest (Restricted)'}</strong>
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
            View: <strong className="text-slate-200">{detailLevel}</strong>
          </span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs sm:text-sm flex items-center gap-2.5 shadow-sm transition ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : actionFeedback.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200 font-medium'
              : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          {actionFeedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Primary Dashboard Grid (Material 3 Cards with Professional Polish) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* CARD 1: Battery & Energy */}
        <div className="rounded-lg bg-[#0f172a] border border-slate-800 p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">{loc.t('telemetry.battery')}</h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Victron SmartShunt (CAN-CI)</span>
                </div>
              </div>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {telemetry.battery.socPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-950 border border-slate-800/60 rounded-full h-2 my-4 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${telemetry.battery.socPercent}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider block mb-0.5">Voltage / Current</span>
                <span className="font-mono font-semibold text-slate-200">
                  {telemetry.battery.voltage} V / {telemetry.battery.currentAmps > 0 ? `+${telemetry.battery.currentAmps}` : telemetry.battery.currentAmps} A
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider block mb-0.5 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" /> {loc.t('telemetry.solar')}
                </span>
                <span className="font-mono font-semibold text-amber-300">
                  {telemetry.battery.solarPowerWatts} W
                </span>
              </div>
            </div>

            {/* Nerd / Engineering expansion */}
            {isNerd && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] space-y-1.5 font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Authority Domain:</span>
                  <span className="text-blue-400 font-semibold">{telemetry.battery.authority}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Power / SOH:</span>
                  <span className="text-slate-200">{telemetry.battery.powerNetWatts} W / {telemetry.battery.batteryHealthPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Cell Temps:</span>
                  <span className="text-slate-200">{telemetry.battery.cellTemperatures.join('°C, ')}°C</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/50 flex justify-between uppercase">
            <span>Subsystem: CamperEnergy</span>
            <span className="text-emerald-400">BMS: Nominal</span>
          </div>
        </div>

        {/* CARD 2: Climate & Heating (Truma Combi 6D) */}
        <div className="rounded-lg bg-[#0f172a] border border-slate-800 p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xs">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">{loc.t('telemetry.climate')}</h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Truma Combi 6D (LIN Bus)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-slate-100">
                  {telemetry.climate.cabinTempCelsius}°C
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Actual Temp</span>
              </div>
            </div>

            {/* Desired vs Actual Indicator */}
            <div className="my-4 p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">
                  {loc.t('action.set_temperature')}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${telemetry.climate.heatingActive ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                  {telemetry.climate.heatingActive ? 'HEATING ACTIVE' : 'STANDBY'}
                </span>
              </div>

              {/* Setpoint Stepper */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetTemperature(Math.max(15, targetTempInput - 0.5))}
                    id="btn-temp-minus"
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer transition shadow-xs"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <span className="text-base font-bold font-mono text-amber-300 w-14 text-center">
                    {targetTempInput.toFixed(1)}°C
                  </span>
                  <button
                    onClick={() => handleSetTemperature(Math.min(32, targetTempInput + 0.5))}
                    id="btn-temp-plus"
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 cursor-pointer transition shadow-xs"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleSetTemperature(35)} // Deliberately tests Safety Policy Guard!
                  className="text-[10px] font-mono text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  title="Test Safety Policy limit (> 30°C)"
                >
                  Test &gt;30°C Limit
                </button>
              </div>
            </div>

            {/* Outside temp & Mode */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[10px] font-mono uppercase block mb-0.5">Ambient Outside</span>
                <span className="font-mono font-medium text-slate-200">{telemetry.climate.outsideTempCelsius}°C</span>
              </div>
              <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 text-[10px] font-mono uppercase block mb-0.5">Mode</span>
                <span className="font-medium text-slate-200">{telemetry.climate.heatingMode}</span>
              </div>
            </div>

            {/* Nerd view */}
            {isNerd && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] space-y-1 font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Desired State:</span>
                  <span className="text-amber-400">{telemetry.climate.desiredTempCelsius}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual State:</span>
                  <span className="text-emerald-400">{telemetry.climate.cabinTempCelsius}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Authority:</span>
                  <span className="text-slate-200">{telemetry.climate.authority}</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/50 flex justify-between uppercase">
            <span>Subsystem: CamperClimate</span>
            <span className="text-slate-400">Limit: 30.0°C Max</span>
          </div>
        </div>

        {/* CARD 3: Water System */}
        <div className="rounded-lg bg-[#0f172a] border border-slate-800 p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">{loc.t('telemetry.water')}</h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Shurflo + Capacitive Probes</span>
                </div>
              </div>
              <span className="text-2xl font-bold font-mono text-sky-400">
                {telemetry.water.freshWaterPercent}%
              </span>
            </div>

            {/* Tank Levels */}
            <div className="space-y-3 my-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{loc.t('telemetry.water.fresh')}</span>
                  <span className="font-mono text-sky-400 font-semibold">{telemetry.water.freshWaterPercent}% (82 L)</span>
                </div>
                <div className="w-full bg-slate-950 border border-slate-800/60 rounded-full h-2 overflow-hidden">
                  <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${telemetry.water.freshWaterPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{loc.t('telemetry.water.grey')}</span>
                  <span className="font-mono text-slate-400 font-semibold">{telemetry.water.greyWaterPercent}% (18 L)</span>
                </div>
                <div className="w-full bg-slate-950 border border-slate-800/60 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${telemetry.water.greyWaterPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Water Pump Switch */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs">
                <span className="font-medium text-slate-200 block">{loc.t('telemetry.water.pump')}</span>
                <span className="text-slate-400 text-[10px] font-mono">
                  {telemetry.water.pumpActive ? 'Pumping: 4.2 L/min' : 'Off / Pressure OK'}
                </span>
              </div>
              <button
                onClick={handleToggleWaterPump}
                id="btn-toggle-pump"
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition shadow-xs ${
                  telemetry.water.pumpActive
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                }`}
              >
                {telemetry.water.pumpActive ? 'ACTIVE' : 'TOGGLE ON'}
              </button>
            </div>

            {/* Nerd view */}
            {isNerd && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] space-y-1 font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Flow Rate:</span>
                  <span className="text-slate-200">{telemetry.water.flowRateLitersPerMin} L/min</span>
                </div>
                <div className="flex justify-between">
                  <span>Authority Domain:</span>
                  <span className="text-blue-400">{telemetry.water.authority}</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/50 flex justify-between uppercase">
            <span>Subsystem: CamperWater</span>
            <span className="text-slate-400">Frost Guard: Active</span>
          </div>
        </div>

        {/* CARD 4: Lighting (Living & Exterior Awning) */}
        <div className="rounded-lg bg-[#0f172a] border border-slate-800 p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">{loc.t('telemetry.lighting')}</h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">DALI / PWM Dimmer Channels</span>
                </div>
              </div>
            </div>

            {/* Lighting Sliders */}
            <div className="space-y-4 my-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Living Cabin Dimmer</span>
                  <span className="font-mono text-amber-300 font-semibold">{telemetry.lighting.livingRoomBrightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={telemetry.lighting.livingRoomBrightness}
                  onChange={(e) => handleToggleLighting('living', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-800"
                />
              </div>

              {/* Awning Light Toggle */}
              <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs">
                  <span className="font-medium text-slate-200 block">Exterior Awning Light</span>
                  <span className="text-slate-400 text-[10px] font-mono">LED Strip (12V)</span>
                </div>
                <button
                  onClick={() => handleToggleLighting('awning', !telemetry.lighting.exteriorAwningLight)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition shadow-xs ${
                    telemetry.lighting.exteriorAwningLight
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {telemetry.lighting.exteriorAwningLight ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/50 flex justify-between uppercase">
            <span>Control: Local Active</span>
            <span className="text-slate-400">Channel: DALI-01</span>
          </div>
        </div>

        {/* CARD 5: Security & Access (Central Locking) */}
        <div className="rounded-lg bg-[#0f172a] border border-slate-800 p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">{loc.t('telemetry.security')}</h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">CAN-CI Central Vehicle Locking</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${telemetry.security.habitationDoorLocked && telemetry.security.cabDoorsLocked ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                {telemetry.security.habitationDoorLocked && telemetry.security.cabDoorsLocked ? 'SECURED' : 'UNLOCKED'}
              </span>
            </div>

            {/* Door Locks Status & Actions */}
            <div className="space-y-3 my-4">
              <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs">
                  <span className="font-medium text-slate-200 block">{loc.t('telemetry.security.habitation_door')}</span>
                  <span className="text-slate-400 text-[10px] font-mono">
                    Status: {telemetry.security.habitationDoorLocked ? loc.t('telemetry.security.locked') : loc.t('telemetry.security.unlocked')}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleDoorLock('habitation')}
                  id="btn-lock-habitation"
                  className={`p-2 rounded cursor-pointer transition shadow-xs ${
                    telemetry.security.habitationDoorLocked
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                      : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                  }`}
                  title={loc.t('action.lock_doors')}
                >
                  {telemetry.security.habitationDoorLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs">
                  <span className="font-medium text-slate-200 block">Cab Driver & Passenger Doors</span>
                  <span className="text-slate-400 text-[10px] font-mono">
                    Status: {telemetry.security.cabDoorsLocked ? loc.t('telemetry.security.locked') : loc.t('telemetry.security.unlocked')}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleDoorLock('cab')}
                  className={`p-2 rounded cursor-pointer transition shadow-xs ${
                    telemetry.security.cabDoorsLocked
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                      : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                  }`}
                >
                  {telemetry.security.cabDoorsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Note about permissions */}
            <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-blue-400 font-mono text-[10px] uppercase">RBAC Guard:</span> Only Vehicle Owner can lock/unlock doors. Guests will be rejected.
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/50 flex justify-between uppercase">
            <span>Subsystem: CamperSecurity</span>
            <span className="text-emerald-400">Alarm: Armed</span>
          </div>
        </div>

        {/* CARD 6: System & Module Health (DataPilot Core) */}
        <div className="rounded-lg bg-[#0f172a] border border-slate-800 p-5 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between text-slate-100">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-xs">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-100">DataPilot Core Runtime</h3>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Module Registry & Recovery</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                {platform.recoveryManager.getHealthSnapshot().overallStatus}
              </span>
            </div>

            {/* Modules status list */}
            <div className="space-y-2 my-4 text-xs">
              {platform.moduleRegistry.getAllModules().map((mod) => (
                <div key={mod.manifest.moduleId} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${mod.state === 'ENABLED' ? 'bg-emerald-400' : mod.state === 'QUARANTINED' ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`}></span>
                    <span className="font-medium text-slate-300">{mod.manifest.name}</span>
                  </div>
                  <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${mod.state === 'ENABLED' ? 'bg-slate-900 text-slate-300 border border-slate-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                    {mod.state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/50 flex justify-between uppercase">
            <span>Uptime: {platform.recoveryManager.getHealthSnapshot().uptimeSeconds}s</span>
            <span className="text-blue-400">Boot: SafeStartup OK</span>
          </div>
        </div>
      </div>

      {/* Tech / Dev / Test Deep View (CAN-CI & LIN Bus Raw Frames & Schema View) */}
      {isTechDev && (
        <div className="mt-8 p-5 rounded-lg bg-[#0f172a] border border-slate-800 font-mono text-xs text-slate-300 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <Database className="w-4 h-4" />
              <span>Tech / Dev / Test Mode: Low-Level Physical Hardware Bus Trace</span>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">ISO 11898-2 CAN-CI / LIN 2.2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">CAN-CI Frame Buffer:</h4>
              <div className="text-[11px] space-y-1 text-emerald-400">
                <div>[CAN 0x18FF5001] SHUNT_SOC: {telemetry.battery.socPercent}% | V: {telemetry.battery.voltage}V | I: {telemetry.battery.currentAmps}A (DeviceAuthority: Victron)</div>
                <div>[CAN 0x18FF5002] SOLAR_HARVEST: {telemetry.battery.solarPowerWatts}W (MPPT SmartSolar 100/30)</div>
                <div>[CAN 0x18EA2004] LOCK_ACTUATOR: HAB={telemetry.security.habitationDoorLocked ? 1 : 0} CAB={telemetry.security.cabDoorsLocked ? 1 : 0}</div>
              </div>
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800 space-y-2">
              <h4 className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">LIN Bus Frames & Command Stream:</h4>
              <div className="text-[11px] space-y-1 text-sky-400">
                <div>[LIN 0x3A] TRUMA_COMBI: Desired={telemetry.climate.desiredTempCelsius}°C Actual={telemetry.climate.cabinTempCelsius}°C Mode={telemetry.climate.heatingMode}</div>
                <div>[LIN 0x1B] SHURFLO_PUMP: State={telemetry.water.pumpActive ? 1 : 0} Flow={telemetry.water.flowRateLitersPerMin}L/min</div>
                <div>[SYNC_ENGINE] Offline Queue Depth: {platform.syncEngine.getPendingCount()} operations</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
