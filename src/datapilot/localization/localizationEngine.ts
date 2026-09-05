/**
 * DataPilot Localization Framework
 * Hierarchy: Language -> Region -> Language Variant -> Dialect -> Register / Politeness Profile
 * Explicit German (Hochdeutsch: formal "Sie" / informal "Du") and English (formal / informal) with guaranteed fallback.
 */

export type SupportedLanguage =
  | 'de'
  | 'en'
  | 'nl'
  | 'fr'
  | 'es'
  | 'sv'
  | 'fi'
  | 'da'
  | 'no'
  | 'it'
  | 'pt'
  | 'tlh'; // Klingon (Experimental / Easter Egg)

export type PolitenessRegister = 'formal' | 'informal';

export interface LocalizationLocale {
  language: SupportedLanguage;
  region?: string; // e.g. "DE", "AT", "CH", "US", "GB"
  variant?: string; // e.g. "hochdeutsch", "schweizerdeutsch"
  register: PolitenessRegister; // "formal" (Sie / vous) vs "informal" (Du / tu)
}

export interface TranslationDictionary {
  [key: string]: {
    formal?: string;
    informal?: string;
    default: string;
    isSafetyCritical?: boolean; // If safety critical, experimental packs (like Klingon) are forbidden!
  };
}

export class LocalizationEngine {
  private currentLocale: LocalizationLocale;
  private dictionaries: Map<SupportedLanguage, TranslationDictionary> = new Map();
  private listeners: Array<(locale: LocalizationLocale) => void> = [];

  constructor() {
    this.currentLocale = {
      language: 'de',
      region: 'DE',
      variant: 'hochdeutsch',
      register: 'informal', // Default to Du for camper app, but can switch to Sie
    };

    this.initializeDictionaries();
  }

  private initializeDictionaries(): void {
    // 1. German (Hochdeutsch) Dictionary
    const deDict: TranslationDictionary = {
      // Platform & Dashboard
      'platform.title': {
        default: 'DataPilot Plattform',
      },
      'product.camperpilot': {
        default: 'CamperPilot',
      },
      'deck.title': {
        default: 'CamperDeck Telemetrie & Steuerung',
      },
      'flow.title': {
        default: 'CamperFlow Automations-Engine',
      },
      'greeting': {
        formal: 'Willkommen an Bord Ihres Fahrzeugs',
        informal: 'Willkommen an Bord deines Campers',
        default: 'Willkommen an Bord',
      },
      'status.local_control': {
        default: 'Lokale Steuerung',
      },
      'status.local_control.available': {
        default: 'Verfügbar (Lokal aktiv)',
      },
      'status.cloud_sync': {
        default: 'Cloud-Synchronisation',
      },
      'status.cloud_sync.queued': {
        default: 'In Warteschlange (Lokal gepuffert)',
      },
      'status.cloud_sync.connected': {
        default: 'Verbunden & Synchronisiert',
      },
      // Telemetry Labels
      'telemetry.battery': {
        default: 'Bordbatterie (LiFePO4)',
      },
      'telemetry.battery.soc': {
        default: 'Ladezustand (SoC)',
      },
      'telemetry.solar': {
        default: 'Solar-Einspeisung',
      },
      'telemetry.climate': {
        default: 'Klima & Heizung (Truma)',
      },
      'telemetry.climate.temp': {
        default: 'Innenraumtemperatur',
      },
      'telemetry.climate.desired': {
        default: 'Solltemperatur',
      },
      'telemetry.climate.actual': {
        default: 'Ist-Temperatur',
      },
      'telemetry.water': {
        default: 'Wassersystem',
      },
      'telemetry.water.fresh': {
        default: 'Frischwassertank',
      },
      'telemetry.water.grey': {
        default: 'Grauwassertank',
      },
      'telemetry.water.pump': {
        default: 'Druckwasserpumpe',
      },
      'telemetry.lighting': {
        default: 'Ambientebeleuchtung',
      },
      'telemetry.security': {
        default: 'Sicherheit & Verriegelung',
      },
      'telemetry.security.habitation_door': {
        default: 'Aufbautür',
      },
      'telemetry.security.locked': {
        default: 'Verriegelt',
      },
      'telemetry.security.unlocked': {
        default: 'Entriegelt',
      },
      // Actions & Prompts (showing register differences)
      'action.set_temperature': {
        formal: 'Möchten Sie die Zieltemperatur anpassen?',
        informal: 'Möchtest du die Zieltemperatur anpassen?',
        default: 'Temperatur anpassen',
      },
      'action.lock_doors': {
        formal: 'Bitte bestätigen Sie die Verriegelung des Fahrzeugs',
        informal: 'Bitte bestätige die Verriegelung deines Fahrzeugs',
        default: 'Fahrzeug verriegeln',
      },
      'action.toggle_pump': {
        default: 'Wasserpumpe schalten',
      },
      // Safety & Emergency (Must NOT fall back to Klingon or informal ambiguity)
      'safety.emergency_stop': {
        default: 'NOT-AUS / SICHERHEITSABSCHALTUNG',
        isSafetyCritical: true,
      },
      'safety.overheat_warning': {
        formal: 'Achtung: Die Heizungsgrenze wurde erreicht. Prüfen Sie das System.',
        informal: 'Achtung: Die Heizungsgrenze wurde erreicht. Bitte prüfe das System.',
        default: 'Achtung: Heizungsgrenze erreicht!',
        isSafetyCritical: true,
      },
    };

    // 2. English Dictionary (Fallback Language)
    const enDict: TranslationDictionary = {
      'platform.title': {
        default: 'DataPilot Platform',
      },
      'product.camperpilot': {
        default: 'CamperPilot',
      },
      'deck.title': {
        default: 'CamperDeck Telemetry & Control',
      },
      'flow.title': {
        default: 'CamperFlow Automation Engine',
      },
      'greeting': {
        formal: 'Welcome aboard your vehicle',
        informal: 'Welcome aboard your camper',
        default: 'Welcome aboard',
      },
      'status.local_control': {
        default: 'Local Control',
      },
      'status.local_control.available': {
        default: 'Available (Locally Active)',
      },
      'status.cloud_sync': {
        default: 'Cloud Synchronization',
      },
      'status.cloud_sync.queued': {
        default: 'Queued (Locally Buffered)',
      },
      'status.cloud_sync.connected': {
        default: 'Connected & Synchronized',
      },
      'telemetry.battery': {
        default: 'Leisure Battery (LiFePO4)',
      },
      'telemetry.battery.soc': {
        default: 'State of Charge (SoC)',
      },
      'telemetry.solar': {
        default: 'Solar Harvest',
      },
      'telemetry.climate': {
        default: 'Climate & Heating (Truma)',
      },
      'telemetry.climate.temp': {
        default: 'Cabin Temperature',
      },
      'telemetry.climate.desired': {
        default: 'Desired Setpoint',
      },
      'telemetry.climate.actual': {
        default: 'Actual Temperature',
      },
      'telemetry.water': {
        default: 'Water System',
      },
      'telemetry.water.fresh': {
        default: 'Fresh Water Tank',
      },
      'telemetry.water.grey': {
        default: 'Grey Water Tank',
      },
      'telemetry.water.pump': {
        default: 'Pressure Water Pump',
      },
      'telemetry.lighting': {
        default: 'Ambient Lighting',
      },
      'telemetry.security': {
        default: 'Security & Access',
      },
      'telemetry.security.habitation_door': {
        default: 'Habitation Door',
      },
      'telemetry.security.locked': {
        default: 'Locked',
      },
      'telemetry.security.unlocked': {
        default: 'Unlocked',
      },
      'action.set_temperature': {
        formal: 'Would you like to adjust the target temperature?',
        informal: 'Do you want to adjust the target temperature?',
        default: 'Adjust Temperature',
      },
      'action.lock_doors': {
        formal: 'Please confirm vehicle lock status',
        informal: 'Please confirm locking your vehicle',
        default: 'Lock Vehicle',
      },
      'action.toggle_pump': {
        default: 'Toggle Water Pump',
      },
      'safety.emergency_stop': {
        default: 'EMERGENCY SHUTDOWN',
        isSafetyCritical: true,
      },
      'safety.overheat_warning': {
        formal: 'Warning: Heating safety limit reached. Please inspect the heating unit.',
        informal: 'Warning: Heating safety limit reached. Check your heating unit.',
        default: 'Warning: Heating safety limit reached!',
        isSafetyCritical: true,
      },
    };

    // 3. Klingon Easter Egg (Demonstrates experimental pack isolation)
    const tlhDict: TranslationDictionary = {
      'platform.title': { default: 'DataPilot Quv' },
      'product.camperpilot': { default: 'CamperDuj' },
      'deck.title': { default: 'CamperDeck RaQ' },
      'telemetry.battery': { default: 'HoS qan (Battery)' },
      'telemetry.security': { default: 'Hub (Defense)' },
      // Note: safety critical keys are deliberately absent in Klingon to trigger safety fallback!
    };

    this.dictionaries.set('de', deDict);
    this.dictionaries.set('en', enDict);
    this.dictionaries.set('tlh', tlhDict);
  }

  public setLocale(locale: Partial<LocalizationLocale>): void {
    this.currentLocale = {
      ...this.currentLocale,
      ...locale,
    };
    this.notify();
  }

  public getLocale(): LocalizationLocale {
    return { ...this.currentLocale };
  }

  /**
   * Translates a key according to:
   * 1. Requested Language dictionary
   * 2. Register selection (formal / informal)
   * 3. Fallback to English if missing
   * 4. Safety Guard: safety critical keys NEVER use Klingon/experimental packs!
   */
  public t(key: string, overrideRegister?: PolitenessRegister): string {
    const reg = overrideRegister || this.currentLocale.register;
    const lang = this.currentLocale.language;

    const dict = this.dictionaries.get(lang);
    const entry = dict ? dict[key] : undefined;

    // Safety critical check: If safety critical and experimental language (like Klingon), force English fallback
    if (lang === 'tlh' && (key.startsWith('safety.') || entry?.isSafetyCritical)) {
      const enDict = this.dictionaries.get('en')!;
      const fallbackEntry = enDict[key];
      return fallbackEntry ? (fallbackEntry[reg] || fallbackEntry.default) : key;
    }

    if (entry) {
      if (reg === 'formal' && entry.formal) return entry.formal;
      if (reg === 'informal' && entry.informal) return entry.informal;
      return entry.default;
    }

    // Fallback to English
    const fallbackDict = this.dictionaries.get('en');
    if (fallbackDict && fallbackDict[key]) {
      const fbEntry = fallbackDict[key];
      if (reg === 'formal' && fbEntry.formal) return fbEntry.formal;
      if (reg === 'informal' && fbEntry.informal) return fbEntry.informal;
      return fbEntry.default;
    }

    // Default key name if not found in English
    return key;
  }

  public subscribe(listener: (locale: LocalizationLocale) => void): () => void {
    this.listeners.push(listener);
    listener(this.getLocale());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const loc = this.getLocale();
    for (const listener of this.listeners) {
      try {
        listener(loc);
      } catch (err) {
        console.error('Error in localization listener', err);
      }
    }
  }
}
