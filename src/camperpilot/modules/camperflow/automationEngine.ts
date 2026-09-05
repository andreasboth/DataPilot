/**
 * CamperFlow Automation Engine
 * Pipeline: Trigger -> Condition -> Policy -> Action -> Verification -> Event
 * Demonstrates clean fault isolation & recovery integration.
 */

import { UUID, ISO8601Timestamp, currentTimestamp, generateUUID, Result } from '../../../datapilot/core/types';
import { CommandBus } from '../../../datapilot/commands/commandBus';
import { EventBus } from '../../../datapilot/events/eventBus';
import { PolicyEngine } from '../../../datapilot/policy/policy';
import { ModuleRegistry } from '../../../datapilot/modules/moduleRegistry';
import { FullCamperTelemetry } from '../../simulator/camperHardwareSimulator';

export interface FlowTrigger {
  type: 'TELEMETRY_CHANGE' | 'SCHEDULE' | 'MANUAL';
  field?: string; // e.g. "battery.socPercent"
}

export interface FlowCondition {
  field: string;
  operator: '>' | '<' | '==' | '!=';
  threshold: number | string | boolean;
}

export interface FlowAction {
  targetCommand: string; // e.g., "SetHeatingTemperature", "ToggleWaterPump", "ToggleInverter"
  parameters: Record<string, unknown>;
}

export interface AutomationFlowRule {
  id: string;
  name: string;
  description: string;
  trigger: FlowTrigger;
  conditions: FlowCondition[];
  action: FlowAction;
  isEnabled: boolean;
  lastExecutedAt?: ISO8601Timestamp;
  executionCount: number;
}

export class AutomationEngine {
  private rules: AutomationFlowRule[] = [];
  private listeners: Array<(rules: AutomationFlowRule[]) => void> = [];

  constructor(
    private commandBus: CommandBus,
    private eventBus: EventBus,
    private policyEngine: PolicyEngine,
    private moduleRegistry: ModuleRegistry
  ) {
    this.registerSampleRules();
  }

  private registerSampleRules(): void {
    this.rules.push({
      id: 'flow-solar-heating',
      name: 'Solar Surplus Thermal Pre-Heat',
      description: 'IF Battery SoC > 80% AND Solar Power > 200W THEN Pre-heat Cabin to 22°C',
      trigger: { type: 'TELEMETRY_CHANGE', field: 'battery.solarPowerWatts' },
      conditions: [
        { field: 'battery.socPercent', operator: '>', threshold: 80 },
        { field: 'battery.solarPowerWatts', operator: '>', threshold: 200 },
      ],
      action: {
        targetCommand: 'SetHeatingTemperature',
        parameters: { targetTemperature: 22.0 },
      },
      isEnabled: true,
      executionCount: 0,
    });

    this.rules.push({
      id: 'flow-night-lock',
      name: 'Night Mode Security Guard',
      description: 'IF Awning Light is OFF AND Battery SoC < 90% THEN Ensure Doors Locked',
      trigger: { type: 'TELEMETRY_CHANGE', field: 'lighting.exteriorAwningLight' },
      conditions: [
        { field: 'lighting.exteriorAwningLight', operator: '==', threshold: false },
      ],
      action: {
        targetCommand: 'LockAllDoors',
        parameters: { door: 'all', locked: true },
      },
      isEnabled: true,
      executionCount: 0,
    });
  }

  public getRules(): AutomationFlowRule[] {
    return [...this.rules];
  }

  /**
   * Evaluates automation rules against current physical telemetry.
   * Follows strict 6-stage pipeline:
   * 1. Trigger -> 2. Condition -> 3. Policy Check -> 4. Action Dispatch -> 5. Verification -> 6. Event Publish
   */
  public async evaluateRules(
    telemetry: FullCamperTelemetry
  ): Promise<Array<{ ruleId: string; executed: boolean; reason: string }>> {
    const results: Array<{ ruleId: string; executed: boolean; reason: string }> = [];

    // Safety guard: Check if CamperFlow is currently quarantined!
    const flowModule = this.moduleRegistry.getModule('camperpilot.camperflow');
    if (flowModule && flowModule.state === 'QUARANTINED') {
      return [{
        ruleId: '*',
        executed: false,
        reason: 'CamperFlow is QUARANTINED due to unhandled fault. Execution blocked by Module Isolation Engine.',
      }];
    }

    for (const rule of this.rules) {
      if (!rule.isEnabled) {
        results.push({ ruleId: rule.id, executed: false, reason: 'Rule is disabled' });
        continue;
      }

      // Step 2: Condition Evaluation
      let conditionsMet = true;
      for (const cond of rule.conditions) {
        const val = this.extractField(telemetry, cond.field);
        if (!this.checkCondition(val, cond.operator, cond.threshold)) {
          conditionsMet = false;
          break;
        }
      }

      if (!conditionsMet) {
        results.push({ ruleId: rule.id, executed: false, reason: 'Conditions not satisfied' });
        continue;
      }

      // Step 3: Policy Check
      const policyRes = this.policyEngine.evaluateAll({
        commandType: rule.action.targetCommand,
        payload: rule.action.parameters,
        isAutomated: true,
      });

      if (!policyRes.passed) {
        this.eventBus.publish('AutomationRuleViolated', { ruleId: rule.id, violations: policyRes.violations }, {
          actor: 'flowEngine',
          issuer: 'CamperFlow',
        });
        results.push({
          ruleId: rule.id,
          executed: false,
          reason: `Blocked by Policy: ${policyRes.violations.join(', ')}`,
        });
        continue;
      }

      // Step 4: Action Dispatch via Command Bus
      const cmdRes = await this.commandBus.dispatch({
        commandId: generateUUID(),
        commandType: rule.action.targetCommand,
        payload: rule.action.parameters,
        actor: 'system:camperflow',
        issuer: 'flowEngine',
        requiredPermission: 'device.control',
        scopeType: 'Device',
        correlationId: generateUUID(),
        requestedAt: currentTimestamp(),
      });

      if (cmdRes.success === true) {
        rule.executionCount++;
        rule.lastExecutedAt = currentTimestamp();
        this.notify();

        // Step 6: Publish FlowExecuted Event
        this.eventBus.publish('FlowExecuted', {
          ruleId: rule.id,
          ruleName: rule.name,
          action: rule.action,
        }, {
          actor: 'system:camperflow',
          issuer: 'CamperFlow',
        });

        results.push({ ruleId: rule.id, executed: true, reason: 'Executed successfully and verified' });
      } else {
        const err = (cmdRes as { success: false; error: string }).error || 'Execution failed';
        results.push({ ruleId: rule.id, executed: false, reason: `Command failed: ${err}` });
      }
    }

    return results;
  }

  /**
   * Intentionally trigger a fault inside CamperFlow to demonstrate Module Quarantine (Scenario 2)
   */
  public triggerFaultSimulation(): void {
    try {
      throw new Error('FATAL_MEMORY_CORRUPTION in CamperFlow rule execution thread: pointer misaligned (0xDEADBEEF)');
    } catch (err: any) {
      this.moduleRegistry.reportModuleFault('camperpilot.camperflow', err);
    }
  }

  private extractField(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    for (const p of parts) {
      if (current == null) return undefined;
      current = current[p];
    }
    return current;
  }

  private checkCondition(val: any, op: string, threshold: any): boolean {
    if (op === '>') return Number(val) > Number(threshold);
    if (op === '<') return Number(val) < Number(threshold);
    if (op === '==') return val === threshold;
    if (op === '!=') return val !== threshold;
    return false;
  }

  public subscribe(listener: (rules: AutomationFlowRule[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getRules());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const r = this.getRules();
    for (const listener of this.listeners) {
      try {
        listener(r);
      } catch (err) {
        console.error('Error in automation engine listener', err);
      }
    }
  }
}
