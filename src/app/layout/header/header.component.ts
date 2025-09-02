import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,   // Para <mat-icon>
    MatButtonModule  // Para mat-icon-button
  ]
})
export class HeaderComponent {}
