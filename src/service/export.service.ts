import {Injectable} from '@angular/core';
import {PendingTestCase} from './utterance-test.service';
import {saveAs} from 'file-saver';
import {Config} from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() {
  }

  JSONtoCSV(itemArray: any[]): string {
    const fields = Object.keys(itemArray[0]);
    const replacer = (key, value) => {
      return value === null ? '' : value;
    };
    const csv = itemArray.map((row) => {
      return fields.map((fieldName) => {
        return JSON.stringify(row[fieldName], replacer);
      }).join(',');
    });
    csv.unshift(fields.join(',')); // add header column
    return csv.join('\r\n');
  }


  exportTests(tests: PendingTestCase[]) {
    Promise.all(tests.map((test, index) => {
      return new Promise(async resolve => {
        test.result.subscribe((result) => {
          resolve({
            id: index,
            utterance: test.utterance,
            expectedIntent: test.input.intent,
            actualIntent: result?.intent || undefined,
            score: result?.score || undefined
          });
        });
      });
    })).then(data => {
      const now = new Date();
      const dateString = ('' + now.getFullYear()).slice(-2) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2);
      saveAs(new Blob([this.JSONtoCSV(data)], {type: 'text/csv'}), dateString + '_TestedUtterances.csv');
    });
  }

  exportConfig(config: Config) {
    const now = new Date();
    const dateString = ('' + now.getFullYear()).slice(-2) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2);
    saveAs(new Blob([JSON.stringify(config)], {type: 'application/json'}), dateString + '_luisTool.config.json');
  }

}
