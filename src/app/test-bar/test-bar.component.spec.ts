import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {TestBarComponent} from './test-bar.component';

describe('TestBarComponent', () => {
  let component: TestBarComponent;
  let fixture: ComponentFixture<TestBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TestBarComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
