import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LoadTestsModalComponent} from './load-tests-modal.component';

describe('LoadTestsModalComponent', () => {
  let component: LoadTestsModalComponent;
  let fixture: ComponentFixture<LoadTestsModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LoadTestsModalComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadTestsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
