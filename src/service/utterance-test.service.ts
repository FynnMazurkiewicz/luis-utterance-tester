import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, from, Observable, of} from 'rxjs';
import {catchError, delay, delayWhen, first, flatMap, map, skipWhile} from 'rxjs/operators';
import {ConfigService} from './config.service';
import {ToastService} from './toast.service';


export function waitFor<T>(signal: Observable<any>) {
  return (source: Observable<T>) =>
    new Observable<T>(observer =>
      signal.pipe(first())
        .subscribe(_ =>
          source.subscribe(observer)
        )
    );
}

interface DateTimeEntity {
  timex: string;
  value: string;
  type: 'datetime';
}

function isDateTime(entityValue: any): entityValue is DateTimeEntity {
  return typeof entityValue === 'object' && 'type' in entityValue && entityValue.type === 'datetime';
}

export function getEntityValue(e: LUISResponseEntity): string {
  if (!e.resolution) {
    return e.entity;
  }
  if (e.resolution.value) {
    return e.resolution.value;
  }
  const value = e.resolution.values[0];
  if (isDateTime(value)) {
    return value.value;
  }
  return value as string;
}

export interface LUISResponseEntity {
  entity: string;
  type: string;
  resolution: {
    value?: string;
    values?: string[] | DateTimeEntity[];
  };
}

export interface LUISResponse {
  entities: LUISResponseEntity[];
  intents: {
    intent: string;
    score: number;
  }[];
  query: string;
  topScoringIntent: {
    intent: string;
    score: number;
  };
}

export interface TestResult {
  intent: string;
  score: number;
  entities: {
    value: string;
    type: string;
    literal: string;
  }[];
  isSuccess: boolean;
  isWarning: boolean;
}

export interface TestInput {
  utterance: string;
  intent: string;
  entities?: string[];
}

export interface PendingTestCase {
  input: TestInput;
  result: BehaviorSubject<TestResult>;
  utterance: string;
}

export interface TestCase {
  input: TestInput;
  result: TestResult;
  utterance: string;
}

@Injectable({
  providedIn: 'root'
})
export class UtteranceTestService {
  public REQUEST_DELAY_MS = 500;
  public CONCURRENCY_COUNT = 1;
  public isRunning = false;
  public isPaused = new BehaviorSubject(false);
  public wasRunning = false;
  public allTestCount = 0;
  public doneTestCount = 0;
  public doneSuccessCount = 0;
  public doneFailedCount = 0;
  public doneWarningCount = 0;

  constructor(private http: HttpClient, private configService: ConfigService, private toastService: ToastService) {
    this.reset();
    if (!this.configService.isFirstUse()) {
      this.fetchIntents();
    }
  }

  public parseToTestInputs(utterances: string[], intent: string): TestInput[] {
    return utterances.map(u => u.replace(/['"]/g, ''))
      .map(line => line.trim())
      .filter(line => !!line)
      .map(utterance => {
        const entities = this.extractEntities(utterance);
        return {
          intent,
          utterance,
          entities
        };
      });
  }

  async resolveTestCases(tests: PendingTestCase[]): Promise<TestCase[]> {
    return Promise.all(tests.map((test, index) => {
      return new Promise<TestCase>(async resolve => {
        test.result.subscribe((result) => {
          return resolve({
            input: test.input,
            result,
            utterance: test.utterance
          });
        });
      });
    }));
  }

  load(utteranceString: string[], intent: string): PendingTestCase[] {
    return this.parseToTestInputs(utteranceString, intent)
      .map(input => this.getPendingTestCase(input, new BehaviorSubject<TestResult>(null)));
  }

  public reset() {
    this.isPaused.next(false);
    this.isRunning = false;
    this.wasRunning = false;
    this.allTestCount = 0;
    this.doneFailedCount = 0;
    this.doneSuccessCount = 0;
    this.doneTestCount = 0;
    this.doneWarningCount = 0;
  }

  fetchIntents() {
    if (this.configService.getCurrentEnvironment()) {
      return this.resolveUtterance('You found an easter egg').pipe(map(value => {
        this.configService.setIntents(value.intents.map(v => v.intent).filter(intent => intent !== 'None'));
      })).subscribe(v => {
        this.toastService.success('Loaded intents from model successfully.');
      }, error => {
        this.toastService.error('Failed to load intents, please check your model configuration: ' + error.statusText || '');
      });

    }
  }

  setPause(v?: boolean) {

    this.isPaused.next(v || !this.isPaused.getValue());
  }

  test(testCases: PendingTestCase[]): PendingTestCase[] {
    this.allTestCount += testCases.length;
    this.isRunning = true;
    this.wasRunning = true;

    from(testCases).pipe(flatMap(((testCase, index) => {
      if (!this.isRunning) {
        return of(null);
      }
      return this.resolveUtterance(testCase.utterance).pipe(
        catchError((e, o) => {
          this.toastService.error('Failed to test an utterance: ' + e.statusText || 'Unknown error');
          console.log(e, o);
          return of(null);
        }),
        delay(this.REQUEST_DELAY_MS),
        delayWhen(() => this.isPaused.pipe(skipWhile(x => x === true))),
        map(r => {
          if (!r || !this.isRunning) {
            return;
          }
          this.doneTestCount++;
          const isSuccess = r.topScoringIntent.intent === testCase.input.intent;
          const isWarning = r.topScoringIntent.score < ConfigService.CONFIDENCE_THRESHOLD;
          if (!isSuccess) {
            this.doneFailedCount++;
          } else if (isWarning) {
            this.doneWarningCount++;
          } else {
            this.doneSuccessCount++;
          }


          testCase.result.next({
            intent: r.topScoringIntent.intent,
            score: r.topScoringIntent.score,
            entities: r.entities.map(e => ({
              literal: e.entity,
              type: e.type,
              value: getEntityValue(e)
            })),
            isSuccess,
            isWarning
          });
        }));
    }), this.CONCURRENCY_COUNT)).subscribe(() => {
    }, (e) => {
      this.toastService.error('The test suite crashed unrecoverably. Please export your configuration and utterances and contact a developer.');
      console.error(e);
    }, () => {
      console.info('All tests finished.');
      this.isRunning = false;
    });

    return testCases.map((testcase, index) => {
      return this.getPendingTestCase(testcase.input, testCases[index].result);
    });
  }

  private resolveUtterance(utterance: string): Observable<LUISResponse> {
    const environment = this.configService.getCurrentEnvironment();
    if (!environment) {
      return of(null);
    }
    const url = environment.luisURL;
    const params = new HttpParams()
      .set('verbose', 'true')
      .set('timezoneOffset', '0')
      .set('subscription-key', environment.luisKey)
      .set('q', encodeURIComponent(utterance));
    return this.http.get<LUISResponse>(url, {params});
  }

  private getPendingTestCase(expected: TestInput, actual?: BehaviorSubject<TestResult>): PendingTestCase {
    return {
      input: expected,
      result: actual,
      utterance: expected.utterance,
    };
  }

  private extractEntities(utteranceString: string): string[] {
    // @ts-ignore
    return [...utteranceString.matchAll(/\[(\w+?)\]/g)].reduce((p, v) => {
      p.push(v.slice(1, 3).filter(x => x !== undefined)[0]);
      return p;
    }, []);
  }
}
