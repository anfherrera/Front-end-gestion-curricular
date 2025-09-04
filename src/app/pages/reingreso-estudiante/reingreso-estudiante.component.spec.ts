import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReingresoEstudianteComponent } from './reingreso-estudiante.component';

describe('ReingresoEstudianteComponent', () => {
  let component: ReingresoEstudianteComponent;
  let fixture: ComponentFixture<ReingresoEstudianteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReingresoEstudianteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReingresoEstudianteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
