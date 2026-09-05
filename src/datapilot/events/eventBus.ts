/**
 * DataPilot Event Bus & Immutable Event Store
 * Events are past facts: they cannot be modified retrospectively.
 * Full Correlation ID and Causation ID tracing.
 */

import { UUID, ISO8601Timestamp, currentTimestamp, generateUUID } from '../core/types';

export interface DataPilotEvent<T = unknown> {
  eventId: UUID;
  eventType: string; // e.g., "BatteryStateChanged", "DoorOpened", "ConfigurationChanged"
  timestamp: ISO8601Timestamp;
  correlationId: UUID;
  causationId?: UUID;
  actor: string;  // Functional initiator (e.g. "user:andreas")
  issuer: string; // Technical node (e.g. "device:tablet-01")
  payload: T;
  schemaVersion: number;
}

export type EventHandler<T = unknown> = (event: DataPilotEvent<T>) => void | Promise<void>;

export class EventBus {
  private eventStore: DataPilotEvent[] = [];
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();
  private wildcardListeners: Set<EventHandler<any>> = new Set();

  public publish<T>(
    eventType: string,
    payload: T,
    meta: {
      actor: string;
      issuer: string;
      correlationId?: UUID;
      causationId?: UUID;
      schemaVersion?: number;
    }
  ): DataPilotEvent<T> {
    const event: DataPilotEvent<T> = {
      eventId: generateUUID(),
      eventType,
      timestamp: currentTimestamp(),
      correlationId: meta.correlationId || generateUUID(),
      causationId: meta.causationId,
      actor: meta.actor,
      issuer: meta.issuer,
      payload,
      schemaVersion: meta.schemaVersion || 1,
    };

    // Store immutable event
    this.eventStore.push(Object.freeze({ ...event }));

    // Dispatch to specific listeners
    const specific = this.listeners.get(eventType);
    if (specific) {
      for (const handler of specific) {
        try {
          handler(event);
        } catch (err) {
          console.error(`Error in event handler for ${eventType}:`, err);
        }
      }
    }

    // Dispatch to wildcard listeners
    for (const handler of this.wildcardListeners) {
      try {
        handler(event);
      } catch (err) {
        console.error('Error in wildcard event handler:', err);
      }
    }

    return event;
  }

  public subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (eventType === '*') {
      this.wildcardListeners.add(handler);
      return () => this.wildcardListeners.delete(handler);
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const handlers = this.listeners.get(eventType)!;
    handlers.add(handler);
    return () => handlers.delete(handler);
  }

  public getEventHistory(filter?: { eventType?: string; correlationId?: UUID }): DataPilotEvent[] {
    let result = [...this.eventStore];
    if (filter?.eventType) {
      result = result.filter((e) => e.eventType === filter.eventType);
    }
    if (filter?.correlationId) {
      result = result.filter((e) => e.correlationId === filter.correlationId);
    }
    return result;
  }

  public clearHistory(): void {
    this.eventStore = [];
  }
}
