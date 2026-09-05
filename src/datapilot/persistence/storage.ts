/**
 * DataPilot Persistence Abstraction & Storage Adapters
 * Clean layer separation: Domain -> Repository Contract -> Storage Adapter -> Concrete Storage
 */

import { Result } from '../core/types';

export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export class InMemoryStorageAdapter implements StorageAdapter {
  private memoryStore = new Map<string, string>();

  public async getItem<T>(key: string): Promise<T | null> {
    const raw = this.memoryStore.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    this.memoryStore.set(key, JSON.stringify(value));
  }

  public async removeItem(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  public async clear(): Promise<void> {
    this.memoryStore.clear();
  }

  public async getAllKeys(): Promise<string[]> {
    return Array.from(this.memoryStore.keys());
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix = 'datapilot:') {
    this.prefix = prefix;
  }

  public async getItem<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(this.prefix + key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`Error reading from localStorage for key ${key}`, err);
      return null;
    }
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
      }
    } catch (err) {
      console.warn(`Error writing to localStorage for key ${key}`, err);
    }
  }

  public async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.prefix + key);
      }
    } catch (err) {
      console.warn(`Error removing from localStorage for key ${key}`, err);
    }
  }

  public async clear(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith(this.prefix)) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          window.localStorage.removeItem(k);
        }
      }
    } catch (err) {
      console.warn('Error clearing localStorage', err);
    }
  }

  public async getAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keys.push(k.substring(this.prefix.length));
        }
      }
    }
    return keys;
  }
}

/**
 * Cloud Persistence Interface (Abstracted & simulated for Prototype)
 */
export interface CloudPersistenceAdapter {
  syncStateToCloud(entityId: string, state: any): Promise<Result<boolean, string>>;
  fetchCloudBackup(assetId: string): Promise<Result<any, string>>;
}

export class SimulatedCloudAdapter implements CloudPersistenceAdapter {
  public async syncStateToCloud(entityId: string, state: any): Promise<Result<boolean, string>> {
    return Result.ok(true);
  }

  public async fetchCloudBackup(assetId: string): Promise<Result<any, string>> {
    return Result.ok({ assetId, version: 1, backupDate: new Date().toISOString() });
  }
}
