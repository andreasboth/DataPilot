/**
 * DataPilot Security Architecture & Fine-Grained Authorization
 * Identity -> Authentication -> Device Trust -> Tenant Context -> Role -> Permission -> Scope -> Policy -> Decision -> Audit
 */

import { UUID, ISO8601Timestamp, currentTimestamp, Result } from '../core/types';
import {
  User,
  Account,
  Session,
  DeviceIdentity,
  Role,
  PermissionScope,
  AuditEntry,
} from '../domain/models';

export interface SecurityContext {
  user?: User;
  account?: Account;
  session?: Session;
  device?: DeviceIdentity;
  roles: Role[];
  activeTenantId: UUID;
  isCloudRequest: boolean; // Flag to indicate if operation is through Cloud or Local Edge
}

export interface AuthorizationRequest {
  permission: string; // e.g. "device.control", "module.configure", "legalhold.create"
  scope: PermissionScope;
  actionContext?: Record<string, unknown>;
}

export interface AuthorizationDecision {
  allowed: boolean;
  code:
    | 'ALLOW'
    | 'DENY_ANONYMOUS'
    | 'DENY_TENANT_MISMATCH'
    | 'DENY_SESSION_EXPIRED'
    | 'DENY_DEVICE_REVOKED'
    | 'DENY_ACCOUNT_SUSPENDED'
    | 'DENY_INSUFFICIENT_PERMISSION'
    | 'DENY_SCOPE_MISMATCH'
    | 'DENY_LEGAL_HOLD_LOCKED';
  reason: string;
  auditEntry?: AuditEntry;
}

export class SecurityManager {
  private auditLog: AuditEntry[] = [];
  private onAuditCallback?: (entry: AuditEntry) => void;

  public setAuditCallback(cb: (entry: AuditEntry) => void): void {
    this.onAuditCallback = cb;
  }

  public getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  public recordAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const fullEntry: AuditEntry = {
      id: 'audit-' + Math.random().toString(36).substring(2, 9),
      timestamp: currentTimestamp(),
      ...entry,
    };
    this.auditLog.unshift(fullEntry);
    if (this.onAuditCallback) {
      this.onAuditCallback(fullEntry);
    }
    return fullEntry;
  }

  public authorize(
    secCtx: SecurityContext | undefined,
    request: AuthorizationRequest
  ): AuthorizationDecision {
    const actor = secCtx?.user?.username || 'anonymous';
    const issuer = secCtx?.device?.name || 'unknown-device';

    // 1. Identity & Session verification
    if (!secCtx || !secCtx.user || !secCtx.session) {
      const decision: AuthorizationDecision = {
        allowed: false,
        code: 'DENY_ANONYMOUS',
        reason: 'Authentication required. No valid security context or session.',
      };
      decision.auditEntry = this.recordAudit({
        actor,
        issuer,
        action: request.permission,
        target: `${request.scope.type}:${request.scope.targetId || '*'}`,
        decision: 'DENY',
        reason: decision.reason,
      });
      return decision;
    }

    // 2. Session Expiration check
    if (secCtx.session.isRevoked || new Date(secCtx.session.expiresAt) < new Date()) {
      const decision: AuthorizationDecision = {
        allowed: false,
        code: 'DENY_SESSION_EXPIRED',
        reason: 'Session has expired or was explicitly revoked.',
      };
      decision.auditEntry = this.recordAudit({
        actor,
        issuer,
        action: request.permission,
        target: `${request.scope.type}:${request.scope.targetId || '*'}`,
        decision: 'DENY',
        reason: decision.reason,
      });
      return decision;
    }

    // 3. Device Trust check
    if (secCtx.device && secCtx.device.trustLevel === 'REVOKED') {
      const decision: AuthorizationDecision = {
        allowed: false,
        code: 'DENY_DEVICE_REVOKED',
        reason: 'Device identity is revoked and cannot issue authorized commands.',
      };
      decision.auditEntry = this.recordAudit({
        actor,
        issuer,
        action: request.permission,
        target: `${request.scope.type}:${request.scope.targetId || '*'}`,
        decision: 'DENY',
        reason: decision.reason,
      });
      return decision;
    }

    // 4. Tenant Context Isolation
    if (secCtx.user.tenantId !== secCtx.activeTenantId) {
      const decision: AuthorizationDecision = {
        allowed: false,
        code: 'DENY_TENANT_MISMATCH',
        reason: `Tenant mismatch: User belongs to ${secCtx.user.tenantId} but operation requested on ${secCtx.activeTenantId}.`,
      };
      decision.auditEntry = this.recordAudit({
        actor,
        issuer,
        action: request.permission,
        target: `${request.scope.type}:${request.scope.targetId || '*'}`,
        decision: 'DENY',
        reason: decision.reason,
      });
      return decision;
    }

    // 5. Account Lifecycle & Suspension
    if (secCtx.account) {
      const accState = secCtx.account.state;
      const isSuspended =
        accState === 'TEMPORARILY_SUSPENDED' ||
        accState === 'PERMANENTLY_SUSPENDED' ||
        accState === 'DEACTIVATED' ||
        accState === 'FROZEN';

      if (isSuspended) {
        // If it's a Cloud API request, suspension unconditionally blocks!
        if (secCtx.isCloudRequest) {
          const decision: AuthorizationDecision = {
            allowed: false,
            code: 'DENY_ACCOUNT_SUSPENDED',
            reason: `Cloud operation denied: Account is in lifecycle state ${accState}. Reason: ${secCtx.account.suspensionReason || 'N/A'}`,
          };
          decision.auditEntry = this.recordAudit({
            actor,
            issuer,
            action: request.permission,
            target: `${request.scope.type}:${request.scope.targetId || '*'}`,
            decision: 'DENY',
            reason: decision.reason,
          });
          return decision;
        }

        // For Local Operations: Local Safety & Survival Policy applies!
        // Safety critical operations (e.g. basic heating, lights, water pump, emergency lock) are allowed locally even if cloud account is suspended
        const isSafetyCritical =
          request.permission.startsWith('device.control') &&
          (request.scope.targetId?.includes('heating') ||
            request.scope.targetId?.includes('light') ||
            request.scope.targetId?.includes('water') ||
            request.scope.targetId?.includes('lock'));

        if (!isSafetyCritical && request.permission !== 'device.read') {
          const decision: AuthorizationDecision = {
            allowed: false,
            code: 'DENY_ACCOUNT_SUSPENDED',
            reason: `Local non-essential command restricted under account suspension policy (${accState}).`,
          };
          decision.auditEntry = this.recordAudit({
            actor,
            issuer,
            action: request.permission,
            target: `${request.scope.type}:${request.scope.targetId || '*'}`,
            decision: 'DENY',
            reason: decision.reason,
          });
          return decision;
        }
      }
    }

    // 6. Role & Permission matching across scopes
    const hasPermission = secCtx.roles.some((role) => {
      // Check if role contains the permission or wildcard
      const matchesPerm =
        role.permissions.includes('*') ||
        role.permissions.includes(request.permission) ||
        role.permissions.some((p) => p.endsWith('.*') && request.permission.startsWith(p.slice(0, -2)));

      if (!matchesPerm) return false;

      // Check scope matching
      if (role.scope.type === 'Platform') return true;
      if (role.scope.type === request.scope.type) {
        if (!role.scope.targetId || role.scope.targetId === '*' || role.scope.targetId === request.scope.targetId) {
          return true;
        }
      }
      return false;
    });

    if (!hasPermission) {
      const decision: AuthorizationDecision = {
        allowed: false,
        code: 'DENY_INSUFFICIENT_PERMISSION',
        reason: `Insufficient permission for '${request.permission}' on scope ${request.scope.type}:${request.scope.targetId || '*'}.`,
      };
      decision.auditEntry = this.recordAudit({
        actor,
        issuer,
        action: request.permission,
        target: `${request.scope.type}:${request.scope.targetId || '*'}`,
        decision: 'DENY',
        reason: decision.reason,
      });
      return decision;
    }

    // ALLOW Decision
    const decision: AuthorizationDecision = {
      allowed: true,
      code: 'ALLOW',
      reason: 'Authorized by role permission policy.',
    };
    decision.auditEntry = this.recordAudit({
      actor,
      issuer,
      action: request.permission,
      target: `${request.scope.type}:${request.scope.targetId || '*'}`,
      decision: 'ALLOW',
      reason: decision.reason,
    });
    return decision;
  }
}
