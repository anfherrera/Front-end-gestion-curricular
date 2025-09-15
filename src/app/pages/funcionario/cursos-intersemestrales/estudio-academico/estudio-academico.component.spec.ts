import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudioAcademicoComponent } from './estudio-academico.component';

describe('EstudioAcademicoComponent', () => {
  let component: EstudioAcademicoComponent;
  let fixture: ComponentFixture<EstudioAcademicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudioAcademicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudioAcademicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
