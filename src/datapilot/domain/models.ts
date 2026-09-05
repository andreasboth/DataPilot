/**
 * DataPilot Domain Model Entities & Value Objects
 * Strict separation of Ownership, Authority, and Responsibility.
 */

import { UUID, ISO8601Timestamp } from '../core/types';

// ==========================================
// 1. Identity & Organization
// ==========================================

export interface Tenant {
  id: UUID;
  name: string;
  code: string;
  createdAt: ISO8601Timestamp;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
}

export interface User {
  id: UUID;
  tenantId: UUID;
  username: string;
  displayName: string;
  email: string;
  createdAt: ISO8601Timestamp;
}

export type AccountLifecycleState =
  | 'ACTIVE'
  | 'TEMPORARILY_SUSPENDED'
  | 'PERMANENTLY_SUSPENDED'
  | 'DEACTIVATED'
  | 'PENDING_DELETION'
  | 'DELETED'
  | 'LEGAL_HOLD'
  | 'FROZEN';

export interface Account {
  id: UUID;
  userId: UUID;
  tenantId: UUID;
  state: AccountLifecycleState;
  suspendedUntil?: ISO8601Timestamp;
  suspensionReason?: string;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
}

export interface DeviceIdentity {
  id: UUID;
  hardwareFingerprint: string;
  name: string;
  platform: 'android' | 'ios' | 'web' | 'linux' | 'embedded';
  trustLevel: 'UNTRUSTED' | 'PROVISIONED' | 'AUTHENTICATED' | 'VERIFIED' | 'REVOKED';
  lastSeenAt: ISO8601Timestamp;
}

export interface Session {
  id: UUID;
  userId: UUID;
  accountId: UUID;
  deviceId: UUID;
  token: string;
  createdAt: ISO8601Timestamp;
  expiresAt: ISO8601Timestamp;
  isRevoked: boolean;
}

// ==========================================
// 2. Security, Roles & Permissions
// ==========================================

export type PermissionScopeType =
  | 'Platform'
  | 'Tenant'
  | 'Organization'
  | 'Asset'
  | 'System'
  | 'Device'
  | 'Component'
  | 'Module'
  | 'Submodule'
  | 'DataClass'
  | 'Entity'
  | 'Field'
  | 'Function'
  | 'Operation';

export interface PermissionScope {
  type: PermissionScopeType;
  targetId?: string; // e.g. "camper-01", "module.camperflow"
}

export interface Permission {
  id: string; // e.g. "asset.read", "device.control", "module.configure", "legalhold.create"
  description: string;
  category: 'asset' | 'device' | 'module' | 'user' | 'backup' | 'audit' | 'legalhold' | 'system';
}

export interface Role {
  id: string; // e.g. "role.owner", "role.guest", "role.technician", "role.admin"
  name: string;
  permissions: string[]; // list of permission IDs
  scope: PermissionScope;
}

// ==========================================
// 3. Ownership / Authority / Responsibility
// STRICTLY SEPARATED CONCEPTS
// ==========================================

/** Ownership: Who legally/contractually owns something? */
export interface Ownership {
  id: UUID;
  targetType: 'Asset' | 'System' | 'DataClass' | 'Device';
  targetId: string;
  ownerId: string; // e.g., "Company A" or "User 123"
  ownerType: 'User' | 'Organization' | 'Tenant' | 'ThirdParty';
  assignedAt: ISO8601Timestamp;
}

/** Authority: Who is technically/substantively authoritative for a data or state domain? */
export type AuthorityType =
  | 'DeviceAuthority'
  | 'EdgeAuthority'
  | 'PlatformAuthority'
  | 'UserAuthority'
  | 'ExternalAuthority'
  | 'PolicyBasedSharedAuthority';

export interface Authority {
  id: UUID;
  domain: string; // e.g., "battery.soc", "account.status", "local.network"
  authorityType: AuthorityType;
  entityName: string; // e.g. "BMS-Hardware", "DataPilot-Cloud", "Local-Gateway"
  notes?: string;
}

/** Responsibility: Who is responsible for operational, maintenance or safety tasks? */
export interface Responsibility {
  id: UUID;
  targetId: string; // e.g., "asset.chassis", "heating.service"
  type: 'OPERATIONAL' | 'TECHNICAL' | 'SAFETY' | 'COMPLIANCE' | 'MAINTENANCE';
  assigneeName: string; // e.g., "Fleet Operator", "Owner", "Certified Workshop"
  effectiveFrom: ISO8601Timestamp;
}

// ==========================================
// 4. Asset, System, Device & Component Model
// ==========================================

export interface Asset {
  id: UUID;
  tenantId: UUID;
  name: string; // e.g. "Grand Canyon S 4x4"
  industryProfile: string; // e.g. "camper", "marine", "home", "fleet"
  serialNumber?: string;
  createdAt: ISO8601Timestamp;
}

export interface SystemEntity {
  id: UUID;
  assetId: UUID;
  name: string; // e.g. "Electrical System", "Climate System"
  category: string;
}

export interface DeviceEntity {
  id: UUID;
  systemId: UUID;
  name: string; // e.g. "Victron SmartShunt", "Truma Combi 6D"
  hardwareModel: string;
  firmwareVersion: string;
  busType: 'LIN' | 'CAN' | 'BLE' | 'MODBUS' | 'MQTT' | 'VIRTUAL';
  isOnline: boolean;
}

export interface ComponentCapability {
  id: string; // e.g. "telemetry.temperature", "actuator.heating", "actuator.valve"
  name: string;
  canRead: boolean;
  canWrite: boolean;
  valueType: 'number' | 'boolean' | 'string' | 'object';
  unit?: string;
}

export interface ComponentEntity {
  id: UUID;
  deviceId: UUID;
  name: string;
  capabilities: ComponentCapability[];
}

// Desired vs Actual State
export interface StateMeasurement<T = unknown> {
  componentId: string;
  capabilityId: string;
  value: T;
  unit?: string;
  measuredAt: ISO8601Timestamp;
  authority: AuthorityType;
  quality: 'VALID' | 'STALE' | 'ESTIMATED' | 'ERROR';
}

export interface DesiredState<T = unknown> {
  componentId: string;
  capabilityId: string;
  desiredValue: T;
  requestedAt: ISO8601Timestamp;
  requestedBy: string;
  expiresAt?: ISO8601Timestamp;
}

// ==========================================
// 5. Legal Hold & Deletion Request
// ==========================================

export type LegalHoldScope = 'Account' | 'DataClass' | 'Asset' | 'Document' | 'TimeRange';

export interface LegalHold {
  id: UUID;
  subject: string; // e.g. "Account 48a-...", "Asset 991-..."
  scope: LegalHoldScope;
  reason: string;
  authorityReference: string; // e.g., "Court Order #8821" or "Internal Legal Ref"
  effectiveFrom: ISO8601Timestamp;
  reviewAt: ISO8601Timestamp;
  releaseAt?: ISO8601Timestamp;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED';
  auditReference: UUID;
}

export interface DeletionRequest {
  id: UUID;
  targetId: string; // user, account, or asset
  targetType: 'User' | 'Account' | 'Asset' | 'Data';
  requestedBy: string;
  requestedAt: ISO8601Timestamp;
  status:
    | 'REQUESTED'
    | 'RETENTION_CHECK'
    | 'LEGAL_HOLD_CHECK'
    | 'BLOCKED_BY_LEGAL_HOLD'
    | 'AUTHORIZED'
    | 'APPROVED'
    | 'DELETED'
    | 'REJECTED';
  rejectionReason?: string;
  completedAt?: ISO8601Timestamp;
  auditId?: UUID;
}

// ==========================================
// 6. Audit Entry
// ==========================================

export interface AuditEntry {
  id: UUID;
  timestamp: ISO8601Timestamp;
  actor: string; // e.g. "user:andreas", "system:policyEngine"
  issuer: string; // e.g. "device:tablet-android-01"
  action: string;
  target: string;
  decision?: 'ALLOW' | 'DENY' | 'BLOCKED';
  reason?: string;
  correlationId?: UUID;
  metadata?: Record<string, unknown>;
}
