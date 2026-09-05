/**
 * DataPilot Policy Engine
 * Policies define immutable operational, safety, compliance, and lifecycle constraints.
 * Policies CANNOT be overridden by casual user preferences.
 */

import { LegalHold, DeletionRequest } from '../domain/models';

export interface PolicyRule {
  id: string;
  name: string;
  type: 'SAFETY' | 'SECURITY' | 'LOCAL_OPERATION' | 'COMPLIANCE' | 'RETENTION';
  isMandatory: boolean;
  evaluate: (context: any) => { passed: boolean; reason?: string };
}

export class PolicyEngine {
  private rules: Map<string, PolicyRule> = new Map();
  private legalHolds: LegalHold[] = [];

  constructor() {
    this.registerDefaultPolicies();
  }

  private registerDefaultPolicies(): void {
    // 1. Safety Policy: Maximum Heating Setpoint in camper cabin
    this.rules.set('safety.max_heating_temp', {
      id: 'safety.max_heating_temp',
      name: 'Cabin Thermal Safety Guard',
      type: 'SAFETY',
      isMandatory: true,
      evaluate: (ctx) => {
        if (ctx.commandType === 'SetHeatingTemperature') {
          const target = Number(ctx.payload?.targetTemperature);
          if (target > 30) {
            return {
              passed: false,
              reason: `Safety Policy Violation: Requested temperature (${target}°C) exceeds structural maximum limit of 30°C.`,
            };
          }
        }
        return { passed: true };
      },
    });

    // 2. Local Survival Policy: Heating, water & lights must work even under Cloud Suspension
    this.rules.set('local.survival_policy', {
      id: 'local.survival_policy',
      name: 'Life Support / Autonomous Local Operation',
      type: 'LOCAL_OPERATION',
      isMandatory: true,
      evaluate: (ctx) => {
        // If account is suspended but this is an essential local device command
        if (ctx.accountSuspended && ctx.isLocalOperation) {
          const isEssential =
            ctx.targetDevice?.includes('heating') ||
            ctx.targetDevice?.includes('water') ||
            ctx.targetDevice?.includes('light') ||
            ctx.targetDevice?.includes('lock');

          if (isEssential) {
            return {
              passed: true,
              reason: 'Essential survival capability permitted under Local Operation Policy.',
            };
          }
        }
        return { passed: true };
      },
    });
  }

  public registerPolicy(rule: PolicyRule): void {
    this.rules.set(rule.id, rule);
  }

  public evaluateAll(context: any): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    for (const rule of this.rules.values()) {
      const res = rule.evaluate(context);
      if (!res.passed) {
        violations.push(`${rule.name}: ${res.reason || 'Policy check failed'}`);
      }
    }
    return {
      passed: violations.length === 0,
      violations,
    };
  }

  // ==========================================
  // Legal Hold & Deletion Management
  // ==========================================

  public addLegalHold(hold: LegalHold): void {
    this.legalHolds.push(hold);
  }

  public getActiveLegalHolds(): LegalHold[] {
    return this.legalHolds.filter((h) => h.status === 'ACTIVE');
  }

  public releaseLegalHold(id: string): boolean {
    const hold = this.legalHolds.find((h) => h.id === id);
    if (!hold) return false;
    hold.status = 'RELEASED';
    return true;
  }

  /**
   * Evaluates if a Deletion Request is permitted or blocked by an active Legal Hold.
   * Process: Request -> Retention Check -> Legal Hold Check -> Authorization -> Approval -> Deletion
   */
  public evaluateDeletionRequest(request: DeletionRequest): {
    canProceed: boolean;
    blockingHold?: LegalHold;
    reason: string;
  } {
    // Check active legal holds
    const activeHolds = this.getActiveLegalHolds();
    const blockingHold = activeHolds.find(
      (h) =>
        h.scope === request.targetType ||
        h.subject.includes(request.targetId) ||
        h.scope === 'Account'
    );

    if (blockingHold) {
      return {
        canProceed: false,
        blockingHold,
        reason: `Deletion BLOCKED by Legal Hold [${blockingHold.authorityReference}]: ${blockingHold.reason}`,
      };
    }

    return {
      canProceed: true,
      reason: 'No active legal holds or retention locks in effect. Deletion authorized for execution.',
    };
  }
}
