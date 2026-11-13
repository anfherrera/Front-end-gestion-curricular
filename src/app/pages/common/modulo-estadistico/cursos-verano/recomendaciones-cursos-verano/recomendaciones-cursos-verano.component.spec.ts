import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Recomendacion } from '@core/models/estadisticas/cursos-verano.model';
import { RecomendacionesCursosVeranoComponent } from './recomendaciones-cursos-verano.component';

describe('RecomendacionesCursosVeranoComponent', () => {
  let fixture: ComponentFixture<RecomendacionesCursosVeranoComponent>;
  let el: HTMLElement;

  const rec = (id: string, prioridad: Recomendacion['prioridad']): Recomendacion => ({
    id, tipo: 'DEMANDA', titulo: `Rec ${id}`, descripcion: 'd', prioridad, acciones: ['a'], justificacion: 'porque sí'
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecomendacionesCursosVeranoComponent);
    el = fixture.nativeElement;
  });

  it('ordena de la más a la menos prioritaria y muestra la etiqueta', () => {
    fixture.componentRef.setInput('recomendaciones', [rec('1', 'BAJA'), rec('2', 'CRITICA'), rec('3', 'MEDIA')]);
    fixture.detectChanges();
    const titulos = Array.from(el.querySelectorAll('.rec-card h3')).map(h => h.textContent?.trim());
    expect(titulos).toEqual(['Rec 2', 'Rec 3', 'Rec 1']);
    expect(el.querySelector('.rec-card .badge')?.textContent?.trim()).toBe('Crítica');
  });

  it('abre y cierra los detalles de una recomendación', () => {
    fixture.componentRef.setInput('recomendaciones', [rec('1', 'ALTA')]);
    fixture.detectChanges();
    expect(el.querySelector('.detalles-expandidos')).toBeNull();
    (el.querySelector('.btn-expandir') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.detalles-expandidos')?.textContent).toContain('porque sí');
    (el.querySelector('.btn-expandir') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.detalles-expandidos')).toBeNull();
  });

  it('sin recomendaciones muestra el aviso y solo cuenta críticas si las hay', () => {
    fixture.componentRef.setInput('estadisticas', { prioridadAlta: 2, alertasCriticas: 0 });
    fixture.detectChanges();
    expect(el.querySelector('.no-data-card')).toBeTruthy();
    expect(el.querySelector('.stat.alta .numero')?.textContent?.trim()).toBe('2');
    expect(el.querySelector('.stat.critica')).toBeNull();
  });
});
