/**
 * CamperPilot Product Definition & Module Manifests
 * Built on DataPilot Platform
 */

import { ModuleManifest } from '../../datapilot/modules/moduleRegistry';

export const CAMPER_PROFILE_METADATA = {
  profileId: 'profile.camper',
  name: 'Camper & Recreational Vehicle Industry Profile',
  standardBuses: ['LIN', 'CAN-CI', 'BLE', 'MQTT'],
  defaultDataClasses: ['telemetry.energy', 'telemetry.climate', 'telemetry.water', 'security.locks'],
};

export const CAMPERPILOT_PRODUCT_METADATA = {
  productId: 'product.camperpilot',
  profileId: 'profile.camper',
  name: 'CamperPilot',
  version: '1.0.0-prototype',
  description: 'Intelligent Camper Operating System and Local-First Vehicle Telemetry',
  supportedVehicles: ['Motorhome', 'Campervan', 'Caravan', 'Expedition 4x4'],
};

export const CAMPERDECK_MANIFEST: ModuleManifest = {
  moduleId: 'camperpilot.camperdeck',
  name: 'CamperDeck',
  version: '1.0.0',
  schemaVersion: 1,
  moduleType: 'PRODUCT_CORE',
  trustTier: 'OFFICIAL',
  dependencies: [],
  capabilities: ['deck.render', 'deck.telemetry_aggregation'],
  requiredPermissions: ['asset.read', 'device.read'],
  exposedCommands: ['RefreshDeckTelemetry'],
  publishedEvents: ['DeckViewChanged'],
  offlineRequirements: {
    canRunOffline: true,
    requiredOfflineDataClasses: ['telemetry.*'],
  },
  recoveryStrategy: 'RESTART',
};

export const CAMPERFLOW_MANIFEST: ModuleManifest = {
  moduleId: 'camperpilot.camperflow',
  name: 'CamperFlow',
  version: '1.0.0',
  schemaVersion: 1,
  moduleType: 'PRODUCT_FEATURE',
  trustTier: 'OFFICIAL',
  dependencies: ['camperpilot.camperdeck'],
  capabilities: ['flow.automation_engine', 'flow.rule_evaluator'],
  requiredPermissions: ['device.control', 'device.read'],
  exposedCommands: ['ExecuteFlow', 'CreateAutomationRule', 'TriggerFaultSimulation'],
  publishedEvents: ['FlowTriggered', 'FlowExecuted', 'AutomationRuleViolated'],
  offlineRequirements: {
    canRunOffline: true,
    requiredOfflineDataClasses: ['automation.rules'],
  },
  recoveryStrategy: 'QUARANTINE', // If CamperFlow throws an unhandled error, it is quarantined!
};

export const CAMPER_ENERGY_MANIFEST: ModuleManifest = {
  moduleId: 'camperpilot.energy',
  name: 'CamperEnergy',
  version: '1.0.0',
  schemaVersion: 1,
  moduleType: 'PRODUCT_FEATURE',
  trustTier: 'OFFICIAL',
  dependencies: [],
  capabilities: ['bms.read', 'solar.read', 'inverter.control'],
  requiredPermissions: ['device.read', 'device.control'],
  exposedCommands: ['ToggleInverter'],
  publishedEvents: ['BatteryStateChanged', 'SolarPeakReached'],
  offlineRequirements: {
    canRunOffline: true,
    requiredOfflineDataClasses: ['energy.telemetry'],
  },
  recoveryStrategy: 'FALLBACK_DEGRADED',
};

export const CAMPER_CLIMATE_MANIFEST: ModuleManifest = {
  moduleId: 'camperpilot.climate',
  name: 'CamperClimate',
  version: '1.0.0',
  schemaVersion: 1,
  moduleType: 'PRODUCT_FEATURE',
  trustTier: 'OFFICIAL',
  dependencies: [],
  capabilities: ['heating.control', 'climate.read'],
  requiredPermissions: ['device.read', 'device.control'],
  exposedCommands: ['SetHeatingTemperature', 'ToggleHeating'],
  publishedEvents: ['HeatingStateChanged', 'TemperatureTargetReached'],
  offlineRequirements: {
    canRunOffline: true,
    requiredOfflineDataClasses: ['climate.telemetry'],
  },
  recoveryStrategy: 'FALLBACK_DEGRADED',
};

export const CAMPER_WATER_MANIFEST: ModuleManifest = {
  moduleId: 'camperpilot.water',
  name: 'CamperWater',
  version: '1.0.0',
  schemaVersion: 1,
  moduleType: 'PRODUCT_FEATURE',
  trustTier: 'OFFICIAL',
  dependencies: [],
  capabilities: ['pump.control', 'tank.read'],
  requiredPermissions: ['device.read', 'device.control'],
  exposedCommands: ['ToggleWaterPump'],
  publishedEvents: ['PumpStateChanged', 'FreshWaterLowWarning'],
  offlineRequirements: {
    canRunOffline: true,
    requiredOfflineDataClasses: ['water.telemetry'],
  },
  recoveryStrategy: 'FALLBACK_DEGRADED',
};

export const CAMPER_SECURITY_MANIFEST: ModuleManifest = {
  moduleId: 'camperpilot.security',
  name: 'CamperSecurity',
  version: '1.0.0',
  schemaVersion: 1,
  moduleType: 'PRODUCT_FEATURE',
  trustTier: 'OFFICIAL',
  dependencies: [],
  capabilities: ['locks.control', 'motion.read', 'alarm.control'],
  requiredPermissions: ['device.read', 'device.control', 'asset.edit'],
  exposedCommands: ['LockAllDoors', 'UnlockAllDoors', 'ToggleHabitationLock'],
  publishedEvents: ['DoorStateChanged', 'SecurityLockEngaged'],
  offlineRequirements: {
    canRunOffline: true,
    requiredOfflineDataClasses: ['security.state'],
  },
  recoveryStrategy: 'RESTART',
};
