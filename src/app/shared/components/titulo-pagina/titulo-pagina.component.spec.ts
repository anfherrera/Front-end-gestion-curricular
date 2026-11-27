import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TituloPaginaComponent } from './titulo-pagina.component';

describe('TituloPaginaComponent', () => {
  let fixture: ComponentFixture<TituloPaginaComponent>;

  function crear(titulo: string): HTMLElement {
    fixture = TestBed.createComponent(TituloPaginaComponent);
    fixture.componentRef.setInput('titulo', titulo);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('pinta un h1 con la primera palabra aparte (lleva la franja roja)', () => {
    const el = crear('Gestión de roles');
    expect(el.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Gestión de roles');
    expect(el.querySelector('.primera-palabra')?.textContent).toBe('Gestión');
  });

  it('acepta títulos de una sola palabra', () => {
    const el = crear('Notificaciones');
    expect(el.querySelector('.primera-palabra')?.textContent).toBe('Notificaciones');
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Notificaciones');
  });
});
