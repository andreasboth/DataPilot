/**
 * DataPilot Module Contract & Module Lifecycle Engine
 * Strict module isolation & quarantine protection.
 */

import { UUID, ISO8601Timestamp, currentTimestamp } from '../core/types';
import { EventBus } from '../events/eventBus';

export type ModuleLifecycleState =
  | 'DISCOVERED'
  | 'INSTALLED'
  | 'VALIDATING'
  | 'ENABLED'
  | 'DISABLED'
  | 'DEGRADED'
  | 'QUARANTINED'
  | 'UPDATING'
  | 'ROLLBACK'
  | 'UNINSTALLED';

export type PluginTrustTier =
  | 'OFFICIAL'
  | 'VERIFIED'
  | 'COMMUNITY'
  | 'PRIVATE'
  | 'UNTRUSTED';

export interface ModuleManifest {
  moduleId: string; // e.g., "datapilot.core", "camperpilot.camperdeck", "camperpilot.camperflow"
  name: string;
  version: string;
  schemaVersion: number;
  moduleType: 'SYSTEM' | 'PRODUCT_CORE' | 'PRODUCT_FEATURE' | 'INTEGRATION';
  trustTier: PluginTrustTier;
  dependencies: string[]; // required module IDs
  capabilities: string[];
  requiredPermissions: string[];
  exposedCommands: string[];
  publishedEvents: string[];
  offlineRequirements: {
    canRunOffline: boolean;
    requiredOfflineDataClasses: string[];
  };
  recoveryStrategy: 'QUARANTINE' | 'RESTART' | 'FALLBACK_DEGRADED';
}

export interface ModuleRuntimeInstance {
  manifest: ModuleManifest;
  state: ModuleLifecycleState;
  health: 'HEALTHY' | 'DEGRADED' | 'FAULTED' | 'QUARANTINED';
  faultCount: number;
  lastFault?: {
    timestamp: ISO8601Timestamp;
    error: string;
    stack?: string;
  };
  installedAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export class ModuleRegistry {
  private modules: Map<string, ModuleRuntimeInstance> = new Map();
  private listeners: Array<(instances: ModuleRuntimeInstance[]) => void> = [];

  constructor(private eventBus?: EventBus) {}

  public registerModule(manifest: ModuleManifest, initialState: ModuleLifecycleState = 'INSTALLED'): ModuleRuntimeInstance {
    const instance: ModuleRuntimeInstance = {
      manifest,
      state: initialState,
      health: 'HEALTHY',
      faultCount: 0,
      installedAt: currentTimestamp(),
      updatedAt: currentTimestamp(),
    };
    this.modules.set(manifest.moduleId, instance);
    this.notify();
    return instance;
  }

  public enableModule(moduleId: string): boolean {
    const mod = this.modules.get(moduleId);
    if (!mod) return false;

    // Check dependencies
    for (const depId of mod.manifest.dependencies) {
      const dep = this.modules.get(depId);
      if (!dep || dep.state !== 'ENABLED') {
        console.warn(`Cannot enable ${moduleId}: missing enabled dependency ${depId}`);
        return false;
      }
    }

    mod.state = 'ENABLED';
    mod.health = 'HEALTHY';
    mod.updatedAt = currentTimestamp();
    this.notify();
    this.eventBus?.publish('ModuleEnabled', { moduleId }, { actor: 'system', issuer: 'ModuleRegistry' });
    return true;
  }

  public disableModule(moduleId: string, reason?: string): boolean {
    const mod = this.modules.get(moduleId);
    if (!mod) return false;

    mod.state = 'DISABLED';
    mod.updatedAt = currentTimestamp();
    this.notify();
    this.eventBus?.publish('ModuleDisabled', { moduleId, reason }, { actor: 'system', issuer: 'ModuleRegistry' });
    return true;
  }

  /**
   * Fault Isolation & Quarantine:
   * When an error occurs in a module, isolate it without taking down the core.
   */
  public reportModuleFault(moduleId: string, error: Error | string): void {
    const mod = this.modules.get(moduleId);
    if (!mod) return;

    mod.faultCount++;
    const errMsg = typeof error === 'string' ? error : error.message;
    mod.lastFault = {
      timestamp: currentTimestamp(),
      error: errMsg,
      stack: typeof error !== 'string' ? error.stack : undefined,
    };

    if (mod.manifest.recoveryStrategy === 'QUARANTINE' || mod.faultCount >= 2) {
      mod.state = 'QUARANTINED';
      mod.health = 'QUARANTINED';
      console.warn(`[DataPilot Isolation Engine] Module ${moduleId} has been QUARANTINED! Error: ${errMsg}`);
      this.eventBus?.publish('ModuleQuarantined', { moduleId, error: errMsg }, { actor: 'system', issuer: 'ModuleRegistry' });
    } else {
      mod.state = 'DEGRADED';
      mod.health = 'DEGRADED';
    }

    mod.updatedAt = currentTimestamp();
    this.notify();
  }

  public restoreQuarantinedModule(moduleId: string): boolean {
    const mod = this.modules.get(moduleId);
    if (!mod) return false;

    mod.faultCount = 0;
    mod.state = 'ENABLED';
    mod.health = 'HEALTHY';
    mod.updatedAt = currentTimestamp();
    this.notify();
    this.eventBus?.publish('ModuleRestored', { moduleId }, { actor: 'system', issuer: 'ModuleRegistry' });
    return true;
  }

  public getAllModules(): ModuleRuntimeInstance[] {
    return Array.from(this.modules.values());
  }

  public getModule(moduleId: string): ModuleRuntimeInstance | undefined {
    return this.modules.get(moduleId);
  }

  public subscribe(listener: (instances: ModuleRuntimeInstance[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getAllModules());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const all = this.getAllModules();
    for (const listener of this.listeners) {
      try {
        listener(all);
      } catch (err) {
        console.error('Error in module registry listener', err);
      }
    }
  }
}
