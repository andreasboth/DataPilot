/**
 * DataPilot Configuration Hierarchy & Inheritance Engine
 * Evaluates: Default -> Inherited -> Explicit Overrides -> Policy Constraints = Effective Configuration
 */

import { ISO8601Timestamp, currentTimestamp } from '../core/types';

export type ConfigScopeLevel =
  | 'Platform'
  | 'Tenant'
  | 'Organization'
  | 'Product'
  | 'Asset'
  | 'System'
  | 'Device'
  | 'Module'
  | 'User';

export interface ConfigurationEntry<T = unknown> {
  key: string;
  value: T;
  scope: ConfigScopeLevel;
  source: string; // e.g., "DefaultSystem", "TenantOverride", "UserPreference"
  version: number;
  updatedAt: ISO8601Timestamp;
  isLockedByPolicy?: boolean;
}

export interface EffectiveConfigResult<T = unknown> {
  key: string;
  effectiveValue: T;
  resolvedSource: string;
  chain: Array<{ scope: ConfigScopeLevel; value: T; source: string; applied: boolean }>;
  lockedByPolicy: boolean;
  lockReason?: string;
}

export class ConfigurationManager {
  private entries: Map<string, ConfigurationEntry[]> = new Map();

  public setEntry<T>(key: string, value: T, scope: ConfigScopeLevel, source: string, isLocked = false): void {
    if (!this.entries.has(key)) {
      this.entries.set(key, []);
    }
    const list = this.entries.get(key)!;
    const existingIdx = list.findIndex((e) => e.scope === scope && e.source === source);
    const entry: ConfigurationEntry<T> = {
      key,
      value,
      scope,
      source,
      version: 1,
      updatedAt: currentTimestamp(),
      isLockedByPolicy: isLocked,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = entry;
    } else {
      list.push(entry);
    }
  }

  /**
   * Resolves the Effective Configuration following inheritance hierarchy:
   * Platform -> Tenant -> Organization -> Product -> Asset -> System -> Device -> Module -> User
   * (Subject to policy overrides)
   */
  public resolve<T>(key: string, defaultValue: T): EffectiveConfigResult<T> {
    const list = this.entries.get(key) || [];
    const scopePriority: ConfigScopeLevel[] = [
      'Platform',
      'Tenant',
      'Organization',
      'Product',
      'Asset',
      'System',
      'Device',
      'Module',
      'User',
    ];

    // Check if any level has a policy lock
    const lockedEntry = list.find((e) => e.isLockedByPolicy);

    let effectiveVal = defaultValue;
    let resolvedSource = 'DefaultFallback';
    const chain: EffectiveConfigResult<T>['chain'] = [];

    // Sort list by scope priority
    const sorted = [...list].sort(
      (a, b) => scopePriority.indexOf(a.scope) - scopePriority.indexOf(b.scope)
    );

    for (const entry of sorted) {
      if (lockedEntry && entry !== lockedEntry && scopePriority.indexOf(entry.scope) > scopePriority.indexOf(lockedEntry.scope)) {
        // Lower priority override blocked by higher policy lock
        chain.push({
          scope: entry.scope,
          value: entry.value as T,
          source: entry.source,
          applied: false,
        });
      } else {
        effectiveVal = entry.value as T;
        resolvedSource = `${entry.scope}::${entry.source}`;
        chain.push({
          scope: entry.scope,
          value: entry.value as T,
          source: entry.source,
          applied: true,
        });
      }
    }

    return {
      key,
      effectiveValue: effectiveVal,
      resolvedSource,
      chain,
      lockedByPolicy: !!lockedEntry,
      lockReason: lockedEntry ? `Enforced by ${lockedEntry.scope} policy: ${lockedEntry.source}` : undefined,
    };
  }
}
