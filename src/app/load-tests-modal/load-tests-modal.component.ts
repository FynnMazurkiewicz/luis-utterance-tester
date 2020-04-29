import {Component, OnInit} from '@angular/core';
import {UtteranceTestService} from '../../service/utterance-test.service';
import {ConfigService} from '../../service/config.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Observable} from 'rxjs';
import {AlertService} from '../../service/alert.service';

@Component({
  selector: 'app-load-tests-modal',
  templateUrl: './load-tests-modal.component.html',
  styleUrls: ['./load-tests-modal.component.css']
})
export class LoadTestsModalComponent implements OnInit {

  isComplete = true;
  carrierPhrasesString = '';
  entities = [];
  entityFiles: {} = {};
  allIntents = [];
  selectedIntentIndex = 0;
  entityLimit = 10;
  utteranceCount = 0;

  constructor(private alertService: AlertService, public ngbActiveModal: NgbActiveModal,
              private utteranceTestService: UtteranceTestService, private configService: ConfigService) {
    this.configService.getConfig().subscribe(config => {
      if (config && config.environments.length > 0) {
        this.allIntents = config.environments[config.currentEnvironmentIndex].intents;
      }
    });
  }

  updateUtteranceCount() {
    const validUtterances = this.carrierPhrasesString.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    this.utteranceCount = validUtterances.reduce<number>((utteranceCount, utterance) => {
      // @ts-ignore
      return utteranceCount + this.getEntitiesFromCarrierPhrase(utterance).reduce<number>((entityCount, entity) => {
        return entityCount * (Math.min(this.entityLimit, this.entityFiles[entity].length) || 1);
      }, 1) * (this.getOptionalsFromCarrierPhrase(utterance).length * 2 || 1);
    }, 0);
    this.checkComplete();
  }

  checkComplete() {
    this.isComplete = this.entities.every((e) => this.entityFiles[e].length > 0);
  }

  ngOnInit(): void {
  }

  onFileChange(event) {
    this.readFile(event).subscribe((result => {
      this.carrierPhrasesString += result;
    }));
  }

  readFile(event): Observable<string> {
    return new Observable(subscriber => {
      const reader = new FileReader();
      if (event.target.files && event.target.files.length) {
        const [file] = event.target.files;
        reader.readAsText(file);
        reader.onload = () => {
          subscriber.next(String(reader.result));
        };
      }
    });
  }

  onEntityFileChange(event, entityName) {
    this.readFile(event).subscribe((result => {
      this.entityFiles[entityName] = result.split('\n').map(u => u.trim()).filter(u => u.length > 0);
      this.updateUtteranceCount();
    }));

  }

  clearEntityValue(entity) {
    this.entityFiles[entity] = [];
  }

  getEntitiesFromCarrierPhrase(utterance: string) {
    // @ts-ignore
    return [...new Set([...utterance.matchAll(/\[(\w+?)\]/g)].map(e => e[1]))];
  }

  getOptionalsFromCarrierPhrase(utterance: string) {
    // @ts-ignore
    return [...new Set([...utterance.matchAll(/\((\w+?)\)/g)].map(e => e[1]))];
  }

  generateUtterancesFromCarrierPhrase(carrierPhrases: string[]): string[] {
    const utterancesArray = carrierPhrases.map(cphrase => {
      const utterances = [cphrase];
      const entities = this.getEntitiesFromCarrierPhrase(cphrase);
      // Fill all entity slots
      if (entities.length > 0) {
        for (const entity of entities) {
          for (const utterance of [...utterances]) {
            for (const entityValue of this.entityFiles[entity].slice(0, this.entityLimit)) {
              const newUtterance = utterance.replace(`[${entity}]`, entityValue);
              if (newUtterance !== utterance) {
                utterances.push(newUtterance);
              }
            }
            utterances.splice(utterances.indexOf(utterance), 1);

          }
        }
      }

      // Handle (optionals)
      const finalUtterances = [...utterances];
      for (const optional of this.getOptionalsFromCarrierPhrase(cphrase)) {
        for (const utterance of [...finalUtterances]) {
          const withOptional = utterance.replace(`(${optional})`, optional);
          const withoutOptional = utterance.replace(`(${optional})`, '');
          console.log(utterance, optional, withOptional, withoutOptional);
          if (withOptional !== utterance) {
            finalUtterances.push(withOptional);
          }
          if (withoutOptional !== utterance) {
            finalUtterances.push(withoutOptional);
          }
          finalUtterances.splice(finalUtterances.indexOf(utterance), 1);
        }
      }
      return finalUtterances;
    });
    return utterancesArray.reduce<any>((p, v) => {
      return p.concat(v);
    }, []);
  }

  loadAndClose() {
    const carrierPhrasesArray = this.carrierPhrasesString.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    const cases = this.utteranceTestService.load(
      this.generateUtterancesFromCarrierPhrase(carrierPhrasesArray), this.allIntents[this.selectedIntentIndex]
    );
    this.ngbActiveModal.close(cases);
  }

  parseUtterances() {
    const testInputs = this.utteranceTestService.parseToTestInputs(this.carrierPhrasesString.split('\n'),
      this.allIntents[this.selectedIntentIndex]);
    this.entities = Array.from(new Set(testInputs.reduce((p, v) => (p.concat(v.entities)), [])));
    Object.assign(this.entityFiles, this.entities.reduce((p, c) => {
      p[c] = this.entityFiles[c] || [];
      return p;
    }, {}));
    this.updateUtteranceCount();
  }
}
