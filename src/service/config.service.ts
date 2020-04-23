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
  DEFAULT_CONFIG: Config = {
    version: this.CONFIG_VERSION,
    environments: [],
    currentEnvironmentIndex: 0,
  };

  private currentConfig: BehaviorSubject<Config> = new BehaviorSubject<Config>(null);

  constructor(private exportService: ExportService, private storageService: StorageService, private toastService: ToastService) {
    window.addEventListener('drop', (x) => {
      this.toggleOverlay(false);
      this.loadConfigFromFile(x);
    });
    window.addEventListener('dragover', (x) => {
        x.preventDefault();
        this.toggleOverlay(true);
        return false;
      }
    );
    window.addEventListener('dragexit', (x) => {
        x.preventDefault();
        this.toggleOverlay(false);
        return false;
      }
    );
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

  toggleOverlay(show: boolean) {
    document.getElementById('fileDropOverlay').hidden = !show;
  }

  createEnvironment() {
    const id = this.currentConfig.value.environments.push({
      intents: [],
      luisKey: 'REPLACE_ME',
      luisURL: 'REPLACE_ME',
      name: 'Untitled environment'
    });
    this.currentConfig.value.currentEnvironmentIndex = id - 1;
  }

  deleteEnvironment() {
    this.currentConfig.value.environments.splice(this.currentConfig.value.currentEnvironmentIndex, 1);
    this.currentConfig.value.currentEnvironmentIndex = 0;
  }

  loadConfigFromFile(ev) {
    ev.preventDefault();
    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (const item of ev.dataTransfer.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          file.text().then((configText) => {
            this.loadConfig(JSON.parse(configText));
          }).catch(x => {
              this.toastService.error('Could not load configuration from file.');
            }
          );
        }
        // If dropped items aren't files, reject them
      }
    } else {
      this.toastService.error('Your browser is not supported yet.');
    }
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
      this.loadConfig(this.DEFAULT_CONFIG);
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
    this.loadConfig(this.DEFAULT_CONFIG);
  }
}
