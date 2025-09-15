import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizarSolicitudesComponent } from './visualizar-solicitudes.component';

describe('VisualizarSolicitudesComponent', () => {
  let component: VisualizarSolicitudesComponent;
  let fixture: ComponentFixture<VisualizarSolicitudesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizarSolicitudesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisualizarSolicitudesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
