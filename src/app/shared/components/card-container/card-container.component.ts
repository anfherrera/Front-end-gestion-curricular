import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Componente contenedor de tarjeta reutilizable
 * Muestra una tarjeta con título, subtítulo opcional e ícono
 */
@Component({
  selector: 'app-card-container',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardContainerComponent {
  /** Título principal de la tarjeta */
  @Input() title: string = '';
  
  /** Subtítulo opcional de la tarjeta */
  @Input() subtitle?: string;
  
  /** Nombre del ícono Material a mostrar */
  @Input() icon?: string;
}
