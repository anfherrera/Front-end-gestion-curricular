import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuloEstadisticoComponent } from './modulo-estadistico.component';

describe('ModuloEstadisticoComponent', () => {
  let component: ModuloEstadisticoComponent;
  let fixture: ComponentFixture<ModuloEstadisticoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuloEstadisticoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuloEstadisticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
