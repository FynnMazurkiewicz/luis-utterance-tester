import {TestBed} from '@angular/core/testing';

import {LuisInterceptorService} from './luis-interceptor.service';

describe('LuisInterceptorService', () => {
  let service: LuisInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LuisInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
