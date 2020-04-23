import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {LUISResponse} from '../../service/utterance-test.service';
import {ConfigService} from '../../service/config.service';

@Injectable({
  providedIn: 'root'
})
export class LuisInterceptorService {

  intents = [];

  constructor(private configService: ConfigService) {
    this.configService.getConfig().subscribe(config => {
      this.intents = config.environments[config.currentEnvironmentIndex].intents;
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.configService.getCurrentEnvironment().luisKey.trim().length < 3) {
      return of(new HttpResponse<LUISResponse>({
        status: 200,
        body: {
          topScoringIntent: {
            intent: this.intents[Math.floor(Math.random() * this.intents.length)],
            score: Math.random() * (1 - 0.98) + 0.98
          },
          intents: [],
          entities: [],
          query: ''
        }
      }));
    }
    return next.handle(req);
  }
}
