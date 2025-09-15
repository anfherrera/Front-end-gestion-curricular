import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.css']
})
export class ActionButtonComponent {
  @Input() label: string = 'Botón';
  @Input() disabled: boolean = false;
  @Output() click = new EventEmitter<void>();

  onClick() {
    this.click.emit();
  }
}
