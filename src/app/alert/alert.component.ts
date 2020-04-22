import {Component, OnInit} from '@angular/core';
import {AlertService} from '../../service/alert.service';

export interface Alert {
  type: string;
  message: string;
}

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {

  constructor(public alertService: AlertService) {
  }

  ngOnInit(): void {
  }


  close(alert: Alert) {
    this.alertService.alerts.splice(this.alertService.alerts.indexOf(alert), 1);
  }


}
