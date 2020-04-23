import {Component, OnInit} from '@angular/core';
import {PendingTestCase, UtteranceTestService} from '../../service/utterance-test.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExportService} from '../../service/export.service';
import {ConfigService} from '../../service/config.service';

enum UtteranceFilter {
  All = 1,
  Untested,
  Success,
  Warning,
  Failed
}

@Component({
  selector: 'app-test-result-table',
  templateUrl: './test-result-table.component.html',
  styleUrls: ['./test-result-table.component.css']
})
export class TestResultTableComponent implements OnInit {

  utterances = '';
  entities = [];

  allIntents = [];
  selectedIntentIndex = 0;
  currentFilter = UtteranceFilter.All;
  allTestCases: PendingTestCase[] = [];
  currentTestCases: PendingTestCase[] = [];
  newTestCases: PendingTestCase[] = [];

  public UtteranceFilter = UtteranceFilter;

  constructor(private modalService: NgbModal, public utteranceTestService: UtteranceTestService, private exportService: ExportService,
              private configService: ConfigService) {
    this.configService.getConfig().subscribe(config => {
      if (config && config.environments.length > 0) {
        this.allIntents = config.environments[config.currentEnvironmentIndex].intents;
      }
    });
  }

  testHandler() {
    this.utteranceTestService.test(this.newTestCases);
    this.newTestCases = [];
  }

  onFileChange(event) {
    const reader = new FileReader();
    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsText(file);
      reader.onload = () => {
        this.utterances = String(reader.result);
      };
    }
  }

  exportToCSV() {
    let fileTag = 'AllUtterances';
    switch (this.currentFilter) {
      case UtteranceFilter.Failed:
        fileTag = 'FailedUtterances';
        break;
      case UtteranceFilter.Untested:
        fileTag = 'UntestedUtterances';
        break;
      case UtteranceFilter.Success:
        fileTag = 'SuccessUtterances';
        break;
      case UtteranceFilter.Warning:
        fileTag = 'LowConfidenceUtterances';
        break;
    }
    this.exportService.exportTests(this.currentTestCases, fileTag);
  }

  clearAll() {
    this.currentTestCases = [];
    this.allTestCases = [];
    this.newTestCases = [];
    this.utteranceTestService.reset();
    this.applyFilter(UtteranceFilter.All);
  }

  open(content) {
    this.utterances = '';
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title', size: 'xl'}).result.then(() => {
      const loadedUtterances = this.utteranceTestService.load(this.utterances, this.allIntents[this.selectedIntentIndex]);
      this.newTestCases = this.newTestCases.concat(loadedUtterances);
      this.allTestCases = this.allTestCases.concat(loadedUtterances);
      this.applyFilter(UtteranceFilter.All);
    }).catch(() => {
    });
  }

  parseUtterances() {
    const testInputs = this.utteranceTestService.parseToTestInputs(this.utterances, this.allIntents[this.selectedIntentIndex]);
    this.entities = Array.from(new Set(testInputs.reduce((p, v) => (p.concat(v.entities)), [])));
    // TODO Add entity carrier phrase parsing.
  }

  applyFilter(filter: UtteranceFilter) {
    this.currentFilter = filter;
    this.utteranceTestService.resolveTestCases(this.allTestCases).then(allCases => {
      this.currentTestCases = this.allTestCases.filter((v, i) => {
        switch (filter) {
          case UtteranceFilter.All:
            return true;
          case UtteranceFilter.Failed:
            return allCases[i].result && !allCases[i].result.isSuccess;
          case UtteranceFilter.Untested:
            return !allCases[i].result;
          case UtteranceFilter.Success:
            return allCases[i].result && allCases[i].result.isSuccess && !allCases[i].result.isWarning;
          case UtteranceFilter.Warning:
            return allCases[i].result && allCases[i].result.isSuccess && allCases[i].result.isWarning;
        }
        return false;
      });
    });
  }

  getTooltip(text) {
    return this.utteranceTestService.isRunning ? 'Not available while tests are running' : text;
  }

  ngOnInit(): void {
  }

}
