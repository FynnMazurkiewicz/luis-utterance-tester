import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {BehaviorSubject} from 'rxjs';
import {ToastService} from './toast.service';
import {ExportService} from './export.service';

export interface Config {
  version: number;
  environments: {
    name: string
    luisURL: string
    luisKey: string
    intents: string[];
  }[];
  currentEnvironmentIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  CONFIG_STORAGE_KEY = 'config';
  CONFIG_VERSION = 1;
  DID_INIT = false;

  private currentConfig: BehaviorSubject<Config> = new BehaviorSubject<Config>(null);

  constructor(private exportService: ExportService, private storageService: StorageService, private toastService: ToastService) {
    this.loadConfigFromCache();
    this.currentConfig.subscribe((config) => {
      if (config) {
        if (this.DID_INIT) {
          this.toastService.success('Configuration saved!');
          this.storageService.set(this.CONFIG_STORAGE_KEY, config);
        } else {
          this.DID_INIT = true;
        }
      }
    });
  }

  createEnvironment() {
    const id = this.currentConfig.value.environments.push({
      intents: [],
      luisKey: '',
      luisURL: '',
      name: 'Untitled environment'
    });
    this.currentConfig.value.currentEnvironmentIndex = id - 1;
    this.loadConfig(this.currentConfig.value);
  }

  getDefaultConfig() {
    return {
      version: this.CONFIG_VERSION,
      environments: [],
      currentEnvironmentIndex: 0,
    };
  }

  deleteEnvironment() {
    this.currentConfig.value.environments.splice(this.currentConfig.value.currentEnvironmentIndex, 1);
    this.currentConfig.value.currentEnvironmentIndex = 0;
    this.loadConfig(this.currentConfig.value);
  }

  setIntents(intents) {
    this.currentConfig.value.environments[this.currentConfig.value.currentEnvironmentIndex].intents = intents;
  }

  public loadConfigFromString(configString) {
    this.loadConfig(JSON.parse(configString));
  }

  loadConfig(config: Config) {
    try {
      this.currentConfig.next(config);
    } catch (e) {
      this.toastService.error('Failed to load configuration.');
      console.log(e);
    }
  }

  loadConfigFromCache() {
    const cachedConfig = this.storageService.get(this.CONFIG_STORAGE_KEY);
    if (cachedConfig) {
      this.loadConfig(cachedConfig);
    } else {
      this.loadConfig(this.getDefaultConfig());
    }
  }

  exportConfig() {
    this.exportService.exportConfig(this.currentConfig.value);
  }

  getConfig(): BehaviorSubject<Config> {
    return this.currentConfig || new BehaviorSubject<Config>(null);
  }

  getCurrentEnvironment() {
    const config = this.currentConfig.value;
    return config.environments[config.currentEnvironmentIndex];
  }

  reset() {
    this.loadConfig(this.getDefaultConfig());
    this.setFirstUse(true);
  }

  isFirstUse() {
    return this.storageService.get('isFirstUse', true);
  }

  setFirstUse(v = false) {
    return this.storageService.set('isFirstUse', v);
  }
}
