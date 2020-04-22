import {Component, OnInit} from '@angular/core';
import {Config, ConfigService} from '../../service/config.service';
// @ts-ignore
import pjson from '../../../package.json';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  configModel: Config;
  pjson = pjson;

  constructor(private configService: ConfigService) {
    this.configService.getConfig().subscribe(config => {
      this.configModel = config;
    });
  }

  save() {
    this.configService.loadConfig(this.configModel);
  }

  ngOnInit(): void {
  }
}
