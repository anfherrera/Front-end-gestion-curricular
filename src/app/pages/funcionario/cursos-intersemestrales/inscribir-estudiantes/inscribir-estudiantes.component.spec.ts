import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscribirEstudiantesComponent } from './inscribir-estudiantes.component';

describe('InscribirEstudiantesComponent', () => {
  let component: InscribirEstudiantesComponent;
  let fixture: ComponentFixture<InscribirEstudiantesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscribirEstudiantesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscribirEstudiantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
