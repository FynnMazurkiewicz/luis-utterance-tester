import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, from, Observable} from 'rxjs';
import {delay, flatMap, map} from 'rxjs/operators';
import {ConfigService} from './config.service';

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
    values: string[] | DateTimeEntity[];
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
  public REQUEST_DELAY_MS = 300;
  public CONCURRENCY_COUNT = 2;
  public isRunning = false;
  public wasRunning = false;
  public allTestCount = 0;
  public doneTestCount = 0;
  public doneSuccessCount = 0;
  public doneFailedCount = 0;
  public doneWarningCount = 0;

  constructor(private http: HttpClient, private configService: ConfigService) {
    this.reset();
    this.extractEntities('Schalte MagentaTV [test2] {test} auf {channel}');
  }

  public parseToTestInputs(utterances: string, intent: string): TestInput[] {
    return utterances.replace(/['"]/g, '')
      .split('\n')
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

  load(utteranceString: string, intent: string): PendingTestCase[] {
    return this.parseToTestInputs(utteranceString, intent)
      .map(input => this.getPendingTestCase(input, new BehaviorSubject<TestResult>(null)));
  }

  public reset() {
    this.isRunning = false;
    this.wasRunning = false;
    this.allTestCount = 0;
    this.doneFailedCount = 0;
    this.doneSuccessCount = 0;
    this.doneTestCount = 0;
    this.doneWarningCount = 0;
  }

  test(testCases: PendingTestCase[]): PendingTestCase[] {
    this.allTestCount += testCases.length;
    this.isRunning = true;
    this.wasRunning = true;

    from(testCases).pipe(flatMap(((testCase, index) => {
      return this.resolveUtterance(testCase.utterance).pipe(delay(this.REQUEST_DELAY_MS), map(r => {
        this.doneTestCount++;
        const isSuccess = r.topScoringIntent.intent === testCase.input.intent;
        const isWarning = r.topScoringIntent.score < 0.99;
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
    }, () => {

    }, () => {
      this.isRunning = false;
    });

    return testCases.map((testcase, index) => {
      return this.getPendingTestCase(testcase.input, testCases[index].result);
    });
  }

  private resolveUtterance(utterance: string): Observable<LUISResponse> {
    const config = this.configService.getCurrentEnvironment();
    const url = config.luisURL;
    const params = new HttpParams()
      .set('verbose', 'true')
      .set('timezoneOffset', '0')
      .set('subscription-key', config.luisKey)
      .set('q', utterance);
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
    return [...utteranceString.matchAll(/\[(\w+?)\]|\{(\w+?)\}/g)].reduce((p, v) => {
      p.push(v.slice(1, 3).filter(x => x !== undefined)[0]);
      return p;
    }, []);
  }
}
