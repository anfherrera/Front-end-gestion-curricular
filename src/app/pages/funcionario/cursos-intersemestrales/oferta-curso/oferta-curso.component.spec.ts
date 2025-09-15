import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertaCursoComponent } from './oferta-curso.component';

describe('OfertaCursoComponent', () => {
  let component: OfertaCursoComponent;
  let fixture: ComponentFixture<OfertaCursoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertaCursoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfertaCursoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
