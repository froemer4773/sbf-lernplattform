import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamMode } from './exam-mode';

describe('ExamMode', () => {
  let component: ExamMode;
  let fixture: ComponentFixture<ExamMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamMode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamMode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
