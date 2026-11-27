import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Título H1 de página (guía, pág. 48): Titillium, color primario y una franja roja
 * de 4px bajo la primera palabra. Lo usa el layout con el `title` de la ruta.
 */
@Component({
  selector: 'app-titulo-pagina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="titulo-pagina">
      <span class="primera-palabra">{{ partes().primera }}</span>
      @if (partes().resto) {
        {{ ' ' + partes().resto }}
      }
    </h1>
  `,
  styles: [
    `
      .titulo-pagina {
        margin: 0 0 24px;
        font-family: var(--font-display);
        font-size: var(--text-h1-size);
        line-height: var(--text-h1-line);
        font-weight: 700;
        color: var(--color-primario);
      }
      .primera-palabra {
        display: inline-block;
        padding-bottom: 4px;
        border-bottom: 4px solid var(--color-secundario);
      }
    `,
  ],
})
export class TituloPaginaComponent {
  readonly titulo = input.required<string>();

  readonly partes = computed(() => {
    const texto = this.titulo().trim();
    const espacio = texto.indexOf(' ');
    return espacio < 0
      ? { primera: texto, resto: '' }
      : { primera: texto.slice(0, espacio), resto: texto.slice(espacio + 1) };
  });
}
