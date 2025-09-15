import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreinscribirEstudiantesComponent } from './preinscribir-estudiantes.component';

describe('PreinscribirEstudiantesComponent', () => {
  let component: PreinscribirEstudiantesComponent;
  let fixture: ComponentFixture<PreinscribirEstudiantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreinscribirEstudiantesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreinscribirEstudiantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
