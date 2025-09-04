import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CursosIntersemestralesComponent } from './cursos-intersemestrales.component';

describe('CursosIntersemestralesComponent', () => {
  let component: CursosIntersemestralesComponent;
  let fixture: ComponentFixture<CursosIntersemestralesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CursosIntersemestralesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CursosIntersemestralesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
