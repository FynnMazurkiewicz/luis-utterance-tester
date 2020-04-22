import {Injectable} from '@angular/core';
import storage from 'local-storage-fallback';


@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
  }

  set(key: string, value: any) {
    storage.setItem(key, JSON.stringify(value));
  }

  get(key: string, fallback?: any) {
    try {
      return JSON.parse(storage.getItem(key));
    } catch (e) {
      console.log(e);
      return fallback || undefined;
    }
  }

  del(key: string) {
    storage.removeItem(key);
  }
}
