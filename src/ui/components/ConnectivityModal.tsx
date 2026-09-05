/**
 * Detailed 9-Tier Connectivity Inspector & Simulator Modal
 * Proves that DataPilot NEVER relies on a simplistic global 'offline = true' boolean.
 */

import React from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import { DetailedConnectivityMatrix, ComputedOperationCapabilities, TierStatus } from '../../datapilot/connectivity/connectivity';
import { DataPilotPlatform } from '../../datapilot/platform';

interface ConnectivityModalProps {
  platform: DataPilotPlatform;
  matrix: DetailedConnectivityMatrix;
  capabilities: ComputedOperationCapabilities;
  onClose: () => void;
}

export const ConnectivityModal: React.FC<ConnectivityModalProps> = ({
  platform,
  matrix,
  capabilities,
  onClose,
}) => {
  const tiers: Array<{ key: keyof DetailedConnectivityMatrix; label: string; description: string }> = [
    {
      key: 'clientNetwork',
      label: '1. Client Network (Tablet Wi-Fi / Cellular)',
      description: 'Physical network interface on the Android / client device',
    },
    {
      key: 'localNetwork',
      label: '2. Local Network (RV Wi-Fi / LAN Access Point)',
      description: 'Local connection to the camper cabin access point',
    },
    {
      key: 'gatewayConnectivity',
      label: '3. Gateway Reachability (Tablet ↔ Local Gateway)',
      description: 'Direct local API communication with the embedded Linux/ESP32 gateway',
    },
    {
      key: 'deviceBusConnectivity',
      label: '4. Physical Device Bus (Gateway ↔ CAN-CI / LIN)',
      description: 'Hardware bus lines to Victron Shunt, Truma Combi, Water tank probes',
    },
    {
      key: 'gatewayInternetAccess',
      label: '5. Gateway Internet Access (4G/LTE Router)',
      description: 'Cellular uplink from the camper rooftop router',
    },
    {
      key: 'clientInternetAccess',
      label: '6. Client Direct Internet Access',
      description: 'Direct cellular fallback on the tablet itself',
    },
    {
      key: 'cloudConnectivity',
      label: '7. DataPilot Cloud Platform Reachability',
      description: 'TLS connection to DataPilot Telemetry & Sync backend',
    },
    {
      key: 'externalApiConnectivity',
      label: '8. External 3rd-Party APIs (Weather, Pitch Maps)',
      description: 'OpenWeatherMap, campsite APIs, external navigation',
    },
  ];

  const handleToggle = (key: keyof DetailedConnectivityMatrix, currentVal: TierStatus) => {
    const next: TierStatus = currentVal === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    platform.connectivityEngine.updateTier(key, next);
  };

  const getStatusBadge = (status: TierStatus) => {
    if (status === 'CONNECTED') {
      return (
        <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CONNECTED
        </span>
      );
    }
    if (status === 'DEGRADED') {
      return (
        <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-400" /> DEGRADED
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 text-rose-400" /> {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 font-mono flex items-center gap-1.5 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              TOPOLOGY & NETWORK TELEMETRY
            </div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Multi-Tier Connectivity Architecture
              </h2>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Computed Capabilities Banner */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 font-mono">
              Computed Local-First Operation Capabilities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800/90">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Local Actuator Control</span>
                <span className={`font-mono font-bold text-xs mt-1 block ${capabilities.localControlAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {capabilities.localControlAvailable ? 'AVAILABLE (Active)' : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800/90">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Cloud Sync Status</span>
                <span className={`font-mono font-bold text-xs mt-1 block ${capabilities.cloudSyncAvailable ? 'text-blue-400' : 'text-amber-400'}`}>
                  {capabilities.cloudSyncAvailable ? 'ONLINE (Direct)' : `QUEUED (${platform.syncEngine.getPendingCount()} items)`}
                </span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800/90 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Overall Topology</span>
                <span className="font-mono font-bold text-xs text-amber-300 mt-1 block">
                  {capabilities.summaryStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Matrix Table */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Independent Tier States (Click status to toggle & test):
            </h3>
            <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/60">
              {tiers.map((t) => {
                const current = matrix[t.key] as TierStatus;
                return (
                  <div key={t.key} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/50 transition">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs sm:text-sm text-slate-200">{t.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
                    </div>
                    <button
                      onClick={() => handleToggle(t.key, current)}
                      className="cursor-pointer transition transform active:scale-95"
                      title="Click to toggle status"
                    >
                      {getStatusBadge(current)}
                    </button>
                  </div>
                );
              })}

              {/* Sync Queue Row */}
              <div className="p-3.5 flex items-center justify-between gap-4 bg-slate-900/40">
                <div>
                  <div className="font-medium text-xs sm:text-sm text-slate-200">9. Offline Synchronization Engine Queue</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Operations buffered locally when cloud uplink is severed
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
                    {matrix.syncState} ({platform.syncEngine.getPendingCount()} buffered)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-xs text-slate-400">
          <span className="font-mono text-[11px]">Local First Principle: Cloud disconnection never disables local living functions.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
