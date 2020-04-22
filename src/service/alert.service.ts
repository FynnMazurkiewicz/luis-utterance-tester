import {Injectable} from '@angular/core';
import {Alert} from '../app/alert/alert.component';

@Injectable({providedIn: 'root'})
export class AlertService {
  alerts: Alert[] = [];

  show(alert: Alert) {
    this.alerts.push(alert);
  }

  success(text: string) {
    this.show({
      message: text,
      type: 'success'
    });
  }

  info(text: string) {
    this.show({
      message: text,
      type: 'info'
    });
  }

  danger(text: string) {
    this.show({
      message: text,
      type: 'danger'
    });
  }
}
