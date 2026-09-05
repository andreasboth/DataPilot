/**
 * CamperPilot Hardware & Sensor Telemetry Simulator
 * Models real physical components (Victron BMS, Truma Heating, Shurflo Pump, Inverter, CAN-CI locks)
 * Demonstrates: Desired vs Actual state, multi-tier Authority mapping, and live sensor loops.
 */

import { ISO8601Timestamp, currentTimestamp } from '../../datapilot/core/types';
import { AuthorityType, StateMeasurement, DesiredState } from '../../datapilot/domain/models';

export interface BatteryTelemetry {
  socPercent: number; // State of Charge (e.g. 86%)
  voltage: number;    // e.g. 13.3 V
  currentAmps: number; // e.g. +14.2 A (charging) or -8.5 A
  solarPowerWatts: number; // e.g. 280 W
  powerNetWatts: number;
  batteryHealthPercent: number;
  cellTemperatures: [number, number, number, number];
  authority: AuthorityType; // 'DeviceAuthority'
}

export interface ClimateTelemetry {
  cabinTempCelsius: number;       // Actual measured temp
  outsideTempCelsius: number;     // Outside ambient
  desiredTempCelsius: number;     // Desired target setpoint
  heatingActive: boolean;
  heatingMode: 'OFF' | 'ECO' | 'COMFORT' | 'BOOST';
  authority: AuthorityType; // 'DeviceAuthority'
}

export interface WaterTelemetry {
  freshWaterPercent: number;
  greyWaterPercent: number;
  pumpActive: boolean;
  flowRateLitersPerMin: number;
  authority: AuthorityType; // 'EdgeAuthority'
}

export interface LightingTelemetry {
  livingRoomBrightness: number; // 0 - 100
  bedroomBrightness: number;    // 0 - 100
  exteriorAwningLight: boolean;
  authority: AuthorityType; // 'EdgeAuthority'
}

export interface SecurityTelemetry {
  habitationDoorLocked: boolean;
  cabDoorsLocked: boolean;
  alarmArmed: boolean;
  motionDetected: boolean;
  authority: AuthorityType; // 'DeviceAuthority'
}

export interface FullCamperTelemetry {
  battery: BatteryTelemetry;
  climate: ClimateTelemetry;
  water: WaterTelemetry;
  lighting: LightingTelemetry;
  security: SecurityTelemetry;
  updatedAt: ISO8601Timestamp;
}

export class CamperHardwareSimulator {
  private telemetry: FullCamperTelemetry;
  private listeners: Array<(t: FullCamperTelemetry) => void> = [];
  private intervalId?: any;

  constructor() {
    this.telemetry = {
      battery: {
        socPercent: 86,
        voltage: 13.35,
        currentAmps: 18.5,
        solarPowerWatts: 310,
        powerNetWatts: 247,
        batteryHealthPercent: 99,
        cellTemperatures: [21.4, 21.6, 21.5, 21.7],
        authority: 'DeviceAuthority', // BMS is hardware authority
      },
      climate: {
        cabinTempCelsius: 20.2,
        outsideTempCelsius: 11.5,
        desiredTempCelsius: 22.0,
        heatingActive: true,
        heatingMode: 'COMFORT',
        authority: 'DeviceAuthority', // Truma is device authority
      },
      water: {
        freshWaterPercent: 82,
        greyWaterPercent: 18,
        pumpActive: false,
        flowRateLitersPerMin: 0.0,
        authority: 'EdgeAuthority', // Local Gateway manages pump
      },
      lighting: {
        livingRoomBrightness: 65,
        bedroomBrightness: 0,
        exteriorAwningLight: false,
        authority: 'EdgeAuthority',
      },
      security: {
        habitationDoorLocked: true,
        cabDoorsLocked: true,
        alarmArmed: true,
        motionDetected: false,
        authority: 'DeviceAuthority',
      },
      updatedAt: currentTimestamp(),
    };

    this.startSimulationLoop();
  }

  public getTelemetry(): FullCamperTelemetry {
    return JSON.parse(JSON.stringify(this.telemetry));
  }

  private startSimulationLoop(): void {
    if (typeof window === 'undefined') return;

    this.intervalId = setInterval(() => {
      // Natural gentle fluctuation
      const t = this.telemetry;

      // 1. Solar fluctuation (subtle drift)
      const solarFluct = (Math.random() - 0.48) * 4;
      t.battery.solarPowerWatts = Math.max(50, Math.min(420, Math.round(t.battery.solarPowerWatts + solarFluct)));
      t.battery.powerNetWatts = t.battery.solarPowerWatts - 70; // baseline 70W internal drain
      t.battery.currentAmps = Number((t.battery.powerNetWatts / t.battery.voltage).toFixed(1));

      // 2. Climate: Heating convergence (Actual -> Desired)
      if (t.climate.heatingActive) {
        if (t.climate.cabinTempCelsius < t.climate.desiredTempCelsius) {
          t.climate.cabinTempCelsius = Number((t.climate.cabinTempCelsius + 0.05).toFixed(2));
        } else {
          // Reached setpoint!
          t.climate.cabinTempCelsius = t.climate.desiredTempCelsius;
        }
      } else {
        // Natural heat loss towards outside ambient
        if (t.climate.cabinTempCelsius > t.climate.outsideTempCelsius) {
          t.climate.cabinTempCelsius = Number((t.climate.cabinTempCelsius - 0.03).toFixed(2));
        }
      }

      t.updatedAt = currentTimestamp();
      this.notify();
    }, 3000);
  }

  public stopSimulationLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // Actuator Commands
  public setDesiredHeating(targetCelsius: number): void {
    this.telemetry.climate.desiredTempCelsius = targetCelsius;
    this.telemetry.climate.heatingActive = targetCelsius > this.telemetry.climate.cabinTempCelsius;
    this.telemetry.updatedAt = currentTimestamp();
    this.notify();
  }

  public toggleHeating(enabled?: boolean): boolean {
    const next = enabled !== undefined ? enabled : !this.telemetry.climate.heatingActive;
    this.telemetry.climate.heatingActive = next;
    this.telemetry.updatedAt = currentTimestamp();
    this.notify();
    return next;
  }

  public toggleWaterPump(active?: boolean): boolean {
    const next = active !== undefined ? active : !this.telemetry.water.pumpActive;
    this.telemetry.water.pumpActive = next;
    this.telemetry.water.flowRateLitersPerMin = next ? 4.2 : 0;
    this.telemetry.updatedAt = currentTimestamp();
    this.notify();
    return next;
  }

  public setLight(area: 'living' | 'bedroom' | 'awning', value: number | boolean): void {
    if (area === 'living') {
      this.telemetry.lighting.livingRoomBrightness = Number(value);
    } else if (area === 'bedroom') {
      this.telemetry.lighting.bedroomBrightness = Number(value);
    } else if (area === 'awning') {
      this.telemetry.lighting.exteriorAwningLight = Boolean(value);
    }
    this.telemetry.updatedAt = currentTimestamp();
    this.notify();
  }

  public setLock(door: 'habitation' | 'cab' | 'all', locked: boolean): void {
    if (door === 'habitation' || door === 'all') {
      this.telemetry.security.habitationDoorLocked = locked;
    }
    if (door === 'cab' || door === 'all') {
      this.telemetry.security.cabDoorsLocked = locked;
    }
    this.telemetry.updatedAt = currentTimestamp();
    this.notify();
  }

  public subscribe(listener: (t: FullCamperTelemetry) => void): () => void {
    this.listeners.push(listener);
    listener(this.getTelemetry());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const t = this.getTelemetry();
    for (const listener of this.listeners) {
      try {
        listener(t);
      } catch (err) {
        console.error('Error in telemetry listener', err);
      }
    }
  }
}
