import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-card-container',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './card-container.component.html',
  styleUrls: ['./card-container.component.css']
})
export class CardContainerComponent {
  @Input() title: string = '';       // Título principal
  @Input() subtitle?: string;        // Subtítulo opcional
  @Input() icon?: string;            // Nombre del ícono Material
}
