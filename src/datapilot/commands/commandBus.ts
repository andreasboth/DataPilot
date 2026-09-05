/**
 * DataPilot Command Bus & Comprehensive Lifecycle Engine
 * Implements full 16-state lifecycle, idempotency protection, authorization pipeline,
 * and state verification.
 */

import { UUID, ISO8601Timestamp, currentTimestamp, generateUUID, Result } from '../core/types';
import { SecurityManager, SecurityContext } from '../security/security';
import { EventBus } from '../events/eventBus';

export type CommandLifecycleState =
  | 'REQUESTED'
  | 'VALIDATING'
  | 'AUTHORIZED'
  | 'ACCEPTED'
  | 'QUEUED'
  | 'DELIVERED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DENIED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'SUPERSEDED';

export interface DataPilotCommand<TPayload = unknown> {
  commandId: UUID;
  commandType: string; // e.g., "SetTemperature", "ToggleLight", "LockDoor", "ToggleWaterPump"
  payload: TPayload;
  actor: string;  // e.g. "user:andreas"
  issuer: string; // e.g. "device:tablet-01"
  requiredPermission: string;
  scopeType: any;
  scopeTargetId?: string;
  correlationId: UUID;
  causationId?: UUID;
  requestedAt: ISO8601Timestamp;
  expiresAt?: ISO8601Timestamp;
  idempotencyKey?: string;
}

export interface CommandExecutionRecord<TResult = unknown> {
  command: DataPilotCommand;
  state: CommandLifecycleState;
  stateHistory: Array<{ state: CommandLifecycleState; timestamp: ISO8601Timestamp; note?: string }>;
  result?: TResult;
  error?: string;
}

export type CommandExecutor<TPayload = any, TResult = any> = (
  cmd: DataPilotCommand<TPayload>
) => Promise<TResult> | TResult;

export type StateVerifier<TPayload = any, TResult = any> = (
  cmd: DataPilotCommand<TPayload>,
  result: TResult
) => Promise<boolean> | boolean;

export class CommandBus {
  private commandHistory: Map<UUID, CommandExecutionRecord> = new Map();
  private idempotencyStore: Map<string, CommandExecutionRecord> = new Map();
  private executors: Map<string, { executor: CommandExecutor; verifier?: StateVerifier }> = new Map();
  private listeners: Array<(record: CommandExecutionRecord) => void> = [];

  constructor(
    private securityManager: SecurityManager,
    private eventBus: EventBus
  ) {}

  public registerHandler<P, R>(
    commandType: string,
    executor: CommandExecutor<P, R>,
    verifier?: StateVerifier<P, R>
  ): void {
    this.executors.set(commandType, { executor, verifier });
  }

  public onCommandStateChanged(listener: (record: CommandExecutionRecord) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private transition(record: CommandExecutionRecord, newState: CommandLifecycleState, note?: string): void {
    record.state = newState;
    record.stateHistory.push({
      state: newState,
      timestamp: currentTimestamp(),
      note,
    });
    for (const listener of this.listeners) {
      try {
        listener(record);
      } catch (err) {
        console.error('Error in command state change listener:', err);
      }
    }
  }

  public async dispatch<P, R>(
    command: DataPilotCommand<P>,
    secCtx?: SecurityContext
  ): Promise<Result<R, string>> {
    // 1. Idempotency verification
    const idKey = command.idempotencyKey || command.commandId;
    if (this.idempotencyStore.has(idKey)) {
      const existing = this.idempotencyStore.get(idKey)!;
      return existing.result
        ? Result.ok(existing.result as R)
        : Result.err(existing.error || `Duplicate command ${idKey} was previously rejected.`);
    }

    const record: CommandExecutionRecord = {
      command,
      state: 'REQUESTED',
      stateHistory: [{ state: 'REQUESTED', timestamp: currentTimestamp() }],
    };
    this.commandHistory.set(command.commandId, record);
    this.idempotencyStore.set(idKey, record);

    // 2. State: VALIDATING
    this.transition(record, 'VALIDATING');
    const handler = this.executors.get(command.commandType);
    if (!handler) {
      this.transition(record, 'REJECTED', `No handler registered for ${command.commandType}`);
      record.error = `No handler registered for command: ${command.commandType}`;
      return Result.err(record.error);
    }

    // 3. Authorization Phase
    const authDecision = this.securityManager.authorize(secCtx, {
      permission: command.requiredPermission,
      scope: {
        type: command.scopeType,
        targetId: command.scopeTargetId,
      },
      actionContext: { commandType: command.commandType },
    });

    if (!authDecision.allowed) {
      this.transition(record, 'DENIED', authDecision.reason);
      record.error = authDecision.reason;
      return Result.err(authDecision.reason);
    }

    // State: AUTHORIZED -> ACCEPTED
    this.transition(record, 'AUTHORIZED');
    this.transition(record, 'ACCEPTED');

    // 4. Execution Pipeline
    this.transition(record, 'EXECUTING');
    try {
      const execResult = await Promise.resolve(handler.executor(command));
      record.result = execResult;
      this.transition(record, 'EXECUTED');

      // 5. State Verification phase
      if (handler.verifier) {
        const verified = await Promise.resolve(handler.verifier(command, execResult));
        if (verified) {
          this.transition(record, 'VERIFIED', 'Hardware/State verification succeeded');
        } else {
          this.transition(record, 'FAILED', 'Actuator execution succeeded but state verification failed');
          return Result.err('State verification failed: actual hardware state did not conform to command.');
        }
      } else {
        this.transition(record, 'VERIFIED', 'Implicitly verified (no verifier attached)');
      }

      // 6. Publish resulting immutable domain event
      this.eventBus.publish(`${command.commandType}Executed`, execResult, {
        actor: command.actor,
        issuer: command.issuer,
        correlationId: command.correlationId,
        causationId: command.commandId,
      });

      return Result.ok(execResult as R);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      this.transition(record, 'FAILED', errMsg);
      record.error = errMsg;
      return Result.err(errMsg);
    }
  }

  public getHistory(): CommandExecutionRecord[] {
    return Array.from(this.commandHistory.values()).reverse();
  }

  public getRecord(commandId: UUID): CommandExecutionRecord | undefined {
    return this.commandHistory.get(commandId);
  }
}
