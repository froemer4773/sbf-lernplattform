import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearningTimeComponent } from './learning-time.component';

describe('LearningTimeComponent', () => {
  let component: LearningTimeComponent;
  let fixture: ComponentFixture<LearningTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearningTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LearningTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
