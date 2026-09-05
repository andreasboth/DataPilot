/**
 * DataPilot Platform Orchestrator
 * Integrates Core, Domain, Security, Policy, Modules, Connectivity, and CamperPilot Product Layer
 */

import { generateUUID, currentTimestamp } from './core/types';
import { User, Account, Role, Session, DeviceIdentity, LegalHold, DeletionRequest } from './domain/models';
import { SecurityManager, SecurityContext } from './security/security';
import { EventBus } from './events/eventBus';
import { CommandBus } from './commands/commandBus';
import { PolicyEngine } from './policy/policy';
import { ConfigurationManager } from './configuration/configuration';
import { ModuleRegistry } from './modules/moduleRegistry';
import { ConnectivityEngine } from './connectivity/connectivity';
import { SyncEngine } from './sync/syncEngine';
import { LocalizationEngine } from './localization/localizationEngine';
import { LocalStorageAdapter, InMemoryStorageAdapter, StorageAdapter } from './persistence/storage';
import { RecoveryManager } from './recovery/recovery';

// CamperPilot Product imports
import {
  CAMPERDECK_MANIFEST,
  CAMPERFLOW_MANIFEST,
  CAMPER_ENERGY_MANIFEST,
  CAMPER_CLIMATE_MANIFEST,
  CAMPER_WATER_MANIFEST,
  CAMPER_SECURITY_MANIFEST,
  CAMPERPILOT_PRODUCT_METADATA,
} from '../camperpilot/product/manifest';
import { CamperHardwareSimulator } from '../camperpilot/simulator/camperHardwareSimulator';
import { AutomationEngine } from '../camperpilot/modules/camperflow/automationEngine';

export type DetailLevel =
  | 'Reduced'
  | 'Minimal'
  | 'Normal'
  | 'Extended'
  | 'Nerd'
  | 'NerdPlus'
  | 'TechDevTest';

export class DataPilotPlatform {
  public eventBus: EventBus;
  public securityManager: SecurityManager;
  public commandBus: CommandBus;
  public policyEngine: PolicyEngine;
  public configManager: ConfigurationManager;
  public moduleRegistry: ModuleRegistry;
  public connectivityEngine: ConnectivityEngine;
  public syncEngine: SyncEngine;
  public localizationEngine: LocalizationEngine;
  public storageAdapter: StorageAdapter;
  public recoveryManager: RecoveryManager;

  // CamperPilot subsystem
  public hardwareSimulator: CamperHardwareSimulator;
  public automationEngine: AutomationEngine;

  // Users & Sessions
  public ownerUser: User;
  public guestUser: User;
  public ownerAccount: Account;
  public guestAccount: Account;
  public ownerRole: Role;
  public guestRole: Role;
  public currentActiveUser: 'owner' | 'guest' = 'owner';
  public currentDetailLevel: DetailLevel = 'Normal';

  // Deletion requests store
  public deletionRequests: DeletionRequest[] = [];

  constructor() {
    // 1. Core Primitives
    this.storageAdapter = new LocalStorageAdapter('datapilot:');
    this.eventBus = new EventBus();
    this.securityManager = new SecurityManager();
    this.policyEngine = new PolicyEngine();
    this.commandBus = new CommandBus(this.securityManager, this.eventBus);
    this.configManager = new ConfigurationManager();
    this.moduleRegistry = new ModuleRegistry(this.eventBus);
    this.connectivityEngine = new ConnectivityEngine();
    this.syncEngine = new SyncEngine();
    this.localizationEngine = new LocalizationEngine();
    this.recoveryManager = new RecoveryManager(this.moduleRegistry, this.storageAdapter);

    // 2. Mock Users, Roles, and Accounts
    const tenantId = 'tenant-europe-rv-01';

    this.ownerUser = {
      id: 'usr-owner-01',
      tenantId,
      username: 'andreas',
      displayName: 'Andreas Both (Owner)',
      email: 'andreasboth79@gmail.com',
      createdAt: currentTimestamp(),
    };

    this.guestUser = {
      id: 'usr-guest-02',
      tenantId,
      username: 'max',
      displayName: 'Max Mustermann (Guest)',
      email: 'guest.max@example.com',
      createdAt: currentTimestamp(),
    };

    this.ownerAccount = {
      id: 'acc-owner-01',
      userId: this.ownerUser.id,
      tenantId,
      state: 'ACTIVE',
      createdAt: currentTimestamp(),
      updatedAt: currentTimestamp(),
    };

    this.guestAccount = {
      id: 'acc-guest-02',
      userId: this.guestUser.id,
      tenantId,
      state: 'ACTIVE',
      createdAt: currentTimestamp(),
      updatedAt: currentTimestamp(),
    };

    this.ownerRole = {
      id: 'role.owner',
      name: 'Vehicle Owner',
      permissions: [
        'asset.*',
        'device.*',
        'module.*',
        'user.*',
        'backup.*',
        'audit.read',
        'legalhold.*',
      ],
      scope: { type: 'Platform' },
    };

    this.guestRole = {
      id: 'role.guest',
      name: 'Guest Passenger',
      // Fine-grained limited permissions: Can read telemetry and toggle basic lights/pump, cannot alter heating limit, config, locks or legal holds!
      permissions: ['asset.read', 'device.read', 'device.control.light', 'device.control.pump'],
      scope: { type: 'Asset', targetId: 'camper-hymer-01' },
    };

    // 3. Register Modules
    this.moduleRegistry.registerModule(CAMPERDECK_MANIFEST, 'ENABLED');
    this.moduleRegistry.registerModule(CAMPERFLOW_MANIFEST, 'ENABLED');
    this.moduleRegistry.registerModule(CAMPER_ENERGY_MANIFEST, 'ENABLED');
    this.moduleRegistry.registerModule(CAMPER_CLIMATE_MANIFEST, 'ENABLED');
    this.moduleRegistry.registerModule(CAMPER_WATER_MANIFEST, 'ENABLED');
    this.moduleRegistry.registerModule(CAMPER_SECURITY_MANIFEST, 'ENABLED');

    // 4. Camper Hardware & Sensor Simulator
    this.hardwareSimulator = new CamperHardwareSimulator();

    // 5. Automation Engine
    this.automationEngine = new AutomationEngine(
      this.commandBus,
      this.eventBus,
      this.policyEngine,
      this.moduleRegistry
    );

    // 6. Connect Command Bus to Hardware Actuators & Verification
    this.registerDeviceCommandHandlers();

    // 7. Initialize sample Legal Hold
    const sampleHold: LegalHold = {
      id: 'hold-court-8821',
      subject: 'Account acc-owner-01 & Asset camper-hymer-01',
      scope: 'Account',
      reason: 'Statutory financial audit and warranty compliance check (Civil Code § 257)',
      authorityReference: 'Official Notice #EU-2026-8821',
      effectiveFrom: currentTimestamp(),
      reviewAt: new Date(Date.now() + 90 * 86400000).toISOString(),
      status: 'ACTIVE',
      auditReference: 'audit-hold-init',
    };
    this.policyEngine.addLegalHold(sampleHold);

    // Run Safe Startup in background
    this.recoveryManager.executeSafeStartup();
  }

  public getSecurityContext(): SecurityContext {
    const isOwner = this.currentActiveUser === 'owner';
    const user = isOwner ? this.ownerUser : this.guestUser;
    const account = isOwner ? this.ownerAccount : this.guestAccount;
    const role = isOwner ? this.ownerRole : this.guestRole;

    const device: DeviceIdentity = {
      id: 'dev-tablet-01',
      hardwareFingerprint: 'hw-samsung-galaxy-tab-active4',
      name: 'Android Cabin Touchscreen (10.1")',
      platform: 'android',
      trustLevel: 'VERIFIED',
      lastSeenAt: currentTimestamp(),
    };

    const session: Session = {
      id: 'sess-active-01',
      userId: user.id,
      accountId: account.id,
      deviceId: device.id,
      token: 'tok-valid-' + user.username,
      createdAt: currentTimestamp(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      isRevoked: false,
    };

    const isCloud = this.connectivityEngine.getMatrix().cloudConnectivity === 'CONNECTED';

    return {
      user,
      account,
      session,
      device,
      roles: [role],
      activeTenantId: user.tenantId,
      isCloudRequest: isCloud,
    };
  }

  private registerDeviceCommandHandlers(): void {
    // Climate: SetHeatingTemperature
    this.commandBus.registerHandler<{ targetTemperature: number }, { newTemperature: number }>(
      'SetHeatingTemperature',
      (cmd) => {
        this.hardwareSimulator.setDesiredHeating(cmd.payload.targetTemperature);
        // Also queue sync operation if offline
        const isCloudSync = this.connectivityEngine.getCapabilities().cloudSyncAvailable;
        if (!isCloudSync) {
          this.syncEngine.enqueue({
            entityId: 'camper.climate',
            dataDomain: 'climate.settings',
            actor: cmd.actor,
            originDevice: cmd.issuer,
            schemaVersion: 1,
            entityVersion: 2,
            payload: { desiredTemp: cmd.payload.targetTemperature },
            authority: 'DeviceAuthority',
          });
        }
        return { newTemperature: cmd.payload.targetTemperature };
      },
      (cmd, res) => {
        // State verification: target set in hardware simulator
        return this.hardwareSimulator.getTelemetry().climate.desiredTempCelsius === res.newTemperature;
      }
    );

    // Climate: ToggleHeating
    this.commandBus.registerHandler<void, boolean>(
      'ToggleHeating',
      () => {
        return this.hardwareSimulator.toggleHeating();
      }
    );

    // Water: ToggleWaterPump
    this.commandBus.registerHandler<void, boolean>(
      'ToggleWaterPump',
      () => {
        return this.hardwareSimulator.toggleWaterPump();
      }
    );

    // Lighting: SetLight
    this.commandBus.registerHandler<{ area: 'living' | 'bedroom' | 'awning'; value: number | boolean }, boolean>(
      'SetLight',
      (cmd) => {
        this.hardwareSimulator.setLight(cmd.payload.area, cmd.payload.value);
        return true;
      }
    );

    // Security: LockAllDoors
    this.commandBus.registerHandler<{ door?: 'habitation' | 'cab' | 'all'; locked: boolean }, boolean>(
      'LockAllDoors',
      (cmd) => {
        this.hardwareSimulator.setLock(cmd.payload.door || 'all', cmd.payload.locked);
        return true;
      }
    );
  }

  // ==========================================
  // Demo Scenario Implementations
  // ==========================================

  /**
   * Scenario 1: Disconnect Internet
   * Tablet & Gateway are local. Local control stays available. Cloud is marked unreachable.
   */
  public executeScenario1_Offline(): void {
    this.connectivityEngine.setMatrix({
      gatewayInternetAccess: 'DISCONNECTED',
      clientInternetAccess: 'DISCONNECTED',
      cloudConnectivity: 'UNREACHABLE',
      externalApiConnectivity: 'UNREACHABLE',
      localNetwork: 'CONNECTED',
      gatewayConnectivity: 'CONNECTED',
      deviceBusConnectivity: 'CONNECTED',
      syncState: 'QUEUED',
    });
  }

  /**
   * Scenario 2: Module Failure / Quarantine
   * CamperFlow experiences unhandled error -> is quarantined -> other modules keep running.
   */
  public executeScenario2_ModuleFailure(): void {
    this.automationEngine.triggerFaultSimulation();
  }

  /**
   * Scenario 3: Switch between Owner and Guest
   */
  public executeScenario3_SwitchUser(user: 'owner' | 'guest'): void {
    this.currentActiveUser = user;
  }

  /**
   * Scenario 4: Change Detail Level
   */
  public executeScenario4_SetDetailLevel(level: DetailLevel): void {
    this.currentDetailLevel = level;
  }

  /**
   * Scenario 5: Reconnect and Drain Offline Sync Queue
   */
  public async executeScenario5_Reconnect(): Promise<{ processed: number; conflicts: number }> {
    this.connectivityEngine.setMatrix({
      gatewayInternetAccess: 'CONNECTED',
      clientInternetAccess: 'CONNECTED',
      cloudConnectivity: 'CONNECTED',
      externalApiConnectivity: 'CONNECTED',
      syncState: 'SYNCING',
    });

    const res = await this.syncEngine.drainQueue(true);
    this.connectivityEngine.updateTier('syncState', 'IDLE');
    return res;
  }

  /**
   * Scenario 6: Temporarily Suspend Account
   */
  public executeScenario6_SuspendAccount(suspend: boolean): void {
    this.ownerAccount.state = suspend ? 'TEMPORARILY_SUSPENDED' : 'ACTIVE';
    this.ownerAccount.suspendedUntil = suspend
      ? new Date(Date.now() + 14 * 86400000).toISOString()
      : undefined;
    this.ownerAccount.suspensionReason = suspend
      ? 'Subscription billing cycle dispute (Resolution in progress)'
      : undefined;
    this.ownerAccount.updatedAt = currentTimestamp();
  }

  /**
   * Scenario 7: Request Account/Asset Deletion while Legal Hold is active
   */
  public executeScenario7_RequestDeletion(): { request: DeletionRequest; canProceed: boolean; reason: string } {
    const req: DeletionRequest = {
      id: generateUUID(),
      targetId: this.ownerAccount.id,
      targetType: 'Account',
      requestedBy: this.ownerUser.username,
      requestedAt: currentTimestamp(),
      status: 'LEGAL_HOLD_CHECK',
    };

    const evalRes = this.policyEngine.evaluateDeletionRequest(req);
    if (!evalRes.canProceed) {
      req.status = 'BLOCKED_BY_LEGAL_HOLD';
      req.rejectionReason = evalRes.reason;
    } else {
      req.status = 'APPROVED';
    }

    this.deletionRequests.unshift(req);
    this.securityManager.recordAudit({
      actor: this.ownerUser.username,
      issuer: 'Tablet-Client',
      action: 'account.deletion_request',
      target: req.targetId,
      decision: evalRes.canProceed ? 'ALLOW' : 'BLOCKED',
      reason: evalRes.reason,
    });

    return {
      request: req,
      canProceed: evalRes.canProceed,
      reason: evalRes.reason,
    };
  }
}

// Global Singleton Instance for easy UI binding
export const dataPilotPlatform = new DataPilotPlatform();
