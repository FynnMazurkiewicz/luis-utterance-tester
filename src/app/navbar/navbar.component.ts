import {Component, OnInit} from '@angular/core';
import {Config, ConfigService} from '../../service/config.service';
// @ts-ignore
import pjson from '../../../package.json';
import {UtteranceTestService} from '../../service/utterance-test.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  configModel: Config;
  pjson = pjson;

  constructor(private configService: ConfigService, private utteranceTestService: UtteranceTestService) {
    this.configService.getConfig().subscribe(config => {
      this.configModel = config;
    });
  }

  save() {
    this.utteranceTestService.fetchIntents();
  }

  ngOnInit(): void {
  }
}
