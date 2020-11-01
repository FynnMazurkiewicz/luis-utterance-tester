import {Component, OnInit} from '@angular/core';
import {PendingTestCase, UtteranceTestService} from '../../service/utterance-test.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ExportService} from '../../service/export.service';
import {LoadTestsModalComponent} from '../load-tests-modal/load-tests-modal.component';

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

  currentFilter = UtteranceFilter.All;
  allTestCases: PendingTestCase[] = [];
  currentTestCases: PendingTestCase[] = [];
  newTestCases: PendingTestCase[] = [];

  public UtteranceFilter = UtteranceFilter;

  constructor(private modalService: NgbModal, public utteranceTestService: UtteranceTestService, private exportService: ExportService) {
  }

  testHandler() {
    this.utteranceTestService.test(this.newTestCases);
    this.newTestCases = [];
  }

  retestHandler() {
    this.newTestCases = this.allTestCases;
    this.utteranceTestService.reset();
    this.utteranceTestService.test(this.newTestCases);
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

  openLoadModal() {
    this.modalService.open(LoadTestsModalComponent, {
      ariaLabelledBy: 'Load Utterances Modal',
      size: 'xl',
    }).result.then((loadedUtterances: PendingTestCase[]) => {
      this.newTestCases = this.newTestCases.concat(loadedUtterances);
      this.allTestCases = this.allTestCases.concat(loadedUtterances);
      this.applyFilter(UtteranceFilter.All);
    }).catch(() => {
    });
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

  getTooltipRunning(text) {
    return this.utteranceTestService.isRunning ? 'Not available while tests are running.' : text;
  }

  getTooltipPaused(text) {
    return this.utteranceTestService.isRunning && !this.utteranceTestService.isPaused.getValue()
      ? 'Pause testing to use this function.' : text;
  }

  ngOnInit(): void {
  }

}
