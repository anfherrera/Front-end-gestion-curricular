import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicarCursoComponent } from './publicar-curso.component';

describe('PublicarCursoComponent', () => {
  let component: PublicarCursoComponent;
  let fixture: ComponentFixture<PublicarCursoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicarCursoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicarCursoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
