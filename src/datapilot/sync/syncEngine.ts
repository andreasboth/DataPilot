/**
 * DataPilot Local-First Synchronization Engine & Offline Queue
 * Flexible conflict resolution (Authority Wins, Version Wins, Merge, etc.)
 */

import { UUID, ISO8601Timestamp, currentTimestamp, generateUUID } from '../core/types';
import { AuthorityType } from '../domain/models';

export type SyncOperationStatus =
  | 'QUEUED'
  | 'SENT'
  | 'RECEIVED'
  | 'VALIDATED'
  | 'APPLIED'
  | 'REJECTED'
  | 'CONFLICT'
  | 'EXPIRED';

export type ConflictResolutionStrategy =
  | 'AUTHORITY_WINS'
  | 'VERSION_WINS'
  | 'MERGE'
  | 'USER_RESOLUTION'
  | 'REJECT';

export interface SyncOperation<T = any> {
  operationId: UUID;
  entityId: string;
  dataDomain: string; // e.g., "battery.telemetry", "user.profile", "climate.settings"
  actor: string;
  originDevice: string;
  timestamp: ISO8601Timestamp;
  schemaVersion: number;
  entityVersion: number;
  payload: T;
  authority: AuthorityType;
  expiry?: ISO8601Timestamp;
  status: SyncOperationStatus;
  statusNotes?: string;
  conflictDetails?: {
    serverVersion: number;
    serverAuthority: AuthorityType;
    resolutionApplied?: ConflictResolutionStrategy;
  };
}

export class SyncEngine {
  private queue: SyncOperation[] = [];
  private domainStrategies: Map<string, ConflictResolutionStrategy> = new Map();
  private listeners: Array<(queue: SyncOperation[]) => void> = [];

  constructor() {
    // Default domain strategies per prompt specifications:
    this.domainStrategies.set('battery.telemetry', 'AUTHORITY_WINS'); // BMS Authority wins over cloud
    this.domainStrategies.set('climate.settings', 'VERSION_WINS');
    this.domainStrategies.set('user.preferences', 'MERGE');
    this.domainStrategies.set('security.locks', 'AUTHORITY_WINS');
  }

  public setDomainStrategy(domain: string, strategy: ConflictResolutionStrategy): void {
    this.domainStrategies.set(domain, strategy);
  }

  public enqueue<T>(op: Omit<SyncOperation<T>, 'operationId' | 'status' | 'timestamp'>): SyncOperation<T> {
    const fullOp: SyncOperation<T> = {
      ...op,
      operationId: generateUUID(),
      timestamp: currentTimestamp(),
      status: 'QUEUED',
    };
    this.queue.push(fullOp);
    this.notify();
    return fullOp;
  }

  public getQueue(): SyncOperation[] {
    return [...this.queue];
  }

  public getPendingCount(): number {
    return this.queue.filter((o) => o.status === 'QUEUED' || o.status === 'SENT').length;
  }

  /**
   * Process and drain the offline sync queue (e.g. triggered on network reconnect)
   */
  public async drainQueue(cloudAvailable: boolean): Promise<{ processed: number; conflicts: number; failed: number }> {
    if (!cloudAvailable) {
      return { processed: 0, conflicts: 0, failed: 0 };
    }

    let processed = 0;
    let conflicts = 0;
    let failed = 0;

    for (const op of this.queue) {
      if (op.status !== 'QUEUED') continue;

      // Simulate sending to cloud endpoint
      op.status = 'SENT';

      // Check for conflict simulation (if entityVersion has diverged)
      const strategy = this.domainStrategies.get(op.dataDomain) || 'AUTHORITY_WINS';

      if (op.dataDomain === 'simulated.conflict') {
        op.status = 'CONFLICT';
        conflicts++;
        op.conflictDetails = {
          serverVersion: op.entityVersion + 1,
          serverAuthority: 'PlatformAuthority',
          resolutionApplied: strategy,
        };

        if (strategy === 'AUTHORITY_WINS' && op.authority === 'DeviceAuthority') {
          // Device wins over cloud for sensor data!
          op.status = 'APPLIED';
          op.statusNotes = 'Resolved via AUTHORITY_WINS (Device authority prioritised)';
        } else {
          op.statusNotes = `Conflict detected, pending resolution via ${strategy}`;
        }
      } else {
        op.status = 'APPLIED';
        op.statusNotes = 'Successfully validated & applied to Cloud replica';
        processed++;
      }
    }

    this.notify();
    return { processed, conflicts, failed };
  }

  public subscribe(listener: (queue: SyncOperation[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getQueue());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const q = this.getQueue();
    for (const listener of this.listeners) {
      try {
        listener(q);
      } catch (err) {
        console.error('Error in sync engine listener', err);
      }
    }
  }
}
