import {Component, OnInit} from '@angular/core';
import {UtteranceTestService} from '../../service/utterance-test.service';

@Component({
  selector: 'app-test-bar',
  templateUrl: './test-bar.component.html',
  styleUrls: ['./test-bar.component.css']
})
export class TestBarComponent implements OnInit {

  constructor(public utteranceTestService: UtteranceTestService) {
  }

  ngOnInit(): void {
  }

  togglePause() {
    this.utteranceTestService.setPause();
  }

}
