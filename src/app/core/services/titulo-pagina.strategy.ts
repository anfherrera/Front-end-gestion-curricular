import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const TITULO_APLICACION = 'Sistema de Gestión Curricular - Universidad del Cauca';

/**
 * Título de cada página (GUIA-UI.md, títulos de página): sale del `title` de la ruta.
 * Lo pinta el layout con `app-titulo-pagina` y también va a la pestaña del navegador.
 */
@Injectable({ providedIn: 'root' })
export class TituloPaginaStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  /** Título de la ruta activa; `undefined` en páginas sin título (bienvenida, login). */
  readonly titulo = signal<string | undefined>(undefined);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const titulo = this.buildTitle(snapshot);
    this.titulo.set(titulo);
    this.title.setTitle(titulo ? `${titulo} | ${TITULO_APLICACION}` : TITULO_APLICACION);
  }
}
