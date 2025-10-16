import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardEstadisticoComponent } from './dashboard-estadistico.component';

@Component({
  selector: 'app-modulo-estadistico',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    DashboardEstadisticoComponent
  ],
  templateUrl: './modulo-estadistico.component.html',
  styleUrl: './modulo-estadistico.component.css'
})
export class ModuloEstadisticoComponent {

}
