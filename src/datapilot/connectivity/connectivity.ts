/**
 * DataPilot Connectivity Architecture
 * High-dimensional multi-tier connectivity state matrix.
 * Never a simplistic global 'offline = true' boolean.
 */

import { ISO8601Timestamp, currentTimestamp } from '../core/types';

export type TierStatus = 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED' | 'UNREACHABLE' | 'BLOCKED';
export type SyncStatus = 'IDLE' | 'QUEUED' | 'SYNCING' | 'ERROR';

export interface DetailedConnectivityMatrix {
  // Client Level (e.g. Android Tablet / Browser)
  clientNetwork: TierStatus; // Wi-Fi / Cellular on the client itself

  // Local Area Network (Tablet <-> Local RV/Facility AP)
  localNetwork: TierStatus;

  // Local Gateway / Edge Controller (Tablet <-> Gateway)
  gatewayConnectivity: TierStatus;

  // Physical Device Bus (Gateway <-> CAN/LIN/Sensors)
  deviceBusConnectivity: TierStatus;

  // Internet Uplink from the Gateway
  gatewayInternetAccess: TierStatus;

  // Direct Client Internet Access
  clientInternetAccess: TierStatus;

  // Cloud Platform Reachability (Telemetry & Cloud Sync)
  cloudConnectivity: TierStatus;

  // External 3rd Party APIs (Weather, Maps, Partner Services)
  externalApiConnectivity: TierStatus;

  // Data Synchronization Engine State
  syncState: SyncStatus;

  updatedAt: ISO8601Timestamp;
}

export interface ComputedOperationCapabilities {
  localControlAvailable: boolean;
  localTelemetryAvailable: boolean;
  cloudSyncAvailable: boolean;
  cloudApiAvailable: boolean;
  emergencyLocalOverride: boolean;
  summaryStatus: 'FULLY_CONNECTED' | 'LOCAL_ONLY' | 'DEGRADED_LOCAL' | 'AIR_GAPPED' | 'ISOLATED';
}

export class ConnectivityEngine {
  private matrix: DetailedConnectivityMatrix;
  private listeners: Array<(matrix: DetailedConnectivityMatrix, capabilities: ComputedOperationCapabilities) => void> = [];

  constructor(initialMatrix?: Partial<DetailedConnectivityMatrix>) {
    this.matrix = {
      clientNetwork: 'CONNECTED',
      localNetwork: 'CONNECTED',
      gatewayConnectivity: 'CONNECTED',
      deviceBusConnectivity: 'CONNECTED',
      gatewayInternetAccess: 'CONNECTED',
      clientInternetAccess: 'CONNECTED',
      cloudConnectivity: 'CONNECTED',
      externalApiConnectivity: 'CONNECTED',
      syncState: 'IDLE',
      updatedAt: currentTimestamp(),
      ...initialMatrix,
    };
  }

  public getMatrix(): DetailedConnectivityMatrix {
    return { ...this.matrix };
  }

  public getCapabilities(): ComputedOperationCapabilities {
    const m = this.matrix;

    // Local control is available if client can reach local gateway and device bus is connected
    const localControlAvailable =
      m.localNetwork === 'CONNECTED' &&
      m.gatewayConnectivity === 'CONNECTED' &&
      (m.deviceBusConnectivity === 'CONNECTED' || m.deviceBusConnectivity === 'DEGRADED');

    const localTelemetryAvailable =
      m.gatewayConnectivity === 'CONNECTED' && m.localNetwork === 'CONNECTED';

    const cloudSyncAvailable =
      m.cloudConnectivity === 'CONNECTED' &&
      (m.clientInternetAccess === 'CONNECTED' || m.gatewayInternetAccess === 'CONNECTED');

    const cloudApiAvailable = cloudSyncAvailable;
    const emergencyLocalOverride = m.deviceBusConnectivity !== 'DISCONNECTED';

    let summaryStatus: ComputedOperationCapabilities['summaryStatus'] = 'FULLY_CONNECTED';
    if (!cloudSyncAvailable && localControlAvailable) {
      summaryStatus = 'LOCAL_ONLY';
    } else if (!cloudSyncAvailable && !localControlAvailable && emergencyLocalOverride) {
      summaryStatus = 'DEGRADED_LOCAL';
    } else if (m.clientNetwork === 'DISCONNECTED') {
      summaryStatus = 'AIR_GAPPED';
    } else if (!localControlAvailable && !cloudSyncAvailable) {
      summaryStatus = 'ISOLATED';
    }

    return {
      localControlAvailable,
      localTelemetryAvailable,
      cloudSyncAvailable,
      cloudApiAvailable,
      emergencyLocalOverride,
      summaryStatus,
    };
  }

  public updateTier(key: keyof DetailedConnectivityMatrix, status: any): void {
    (this.matrix as any)[key] = status;
    this.matrix.updatedAt = currentTimestamp();
    this.notify();
  }

  public setMatrix(newMatrix: Partial<DetailedConnectivityMatrix>): void {
    this.matrix = {
      ...this.matrix,
      ...newMatrix,
      updatedAt: currentTimestamp(),
    };
    this.notify();
  }

  public subscribe(listener: (matrix: DetailedConnectivityMatrix, capabilities: ComputedOperationCapabilities) => void): () => void {
    this.listeners.push(listener);
    listener(this.getMatrix(), this.getCapabilities());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const matrix = this.getMatrix();
    const capabilities = this.getCapabilities();
    for (const listener of this.listeners) {
      try {
        listener(matrix, capabilities);
      } catch (err) {
        console.error('Error in connectivity listener', err);
      }
    }
  }
}
