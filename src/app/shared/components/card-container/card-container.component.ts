import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Componente contenedor de tarjeta reutilizable
 * Muestra una tarjeta con título, subtítulo opcional e ícono
 */
@Component({
  selector: 'app-card-container',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardContainerComponent {
  /** Título principal de la tarjeta */
  readonly title = input('');
  
  /** Subtítulo opcional de la tarjeta */
  readonly subtitle = input<string>();
  
  /** Nombre del ícono Material a mostrar */
  readonly icon = input<string>();
}
