import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { DashboardEstadisticoComponent } from './dashboard-estadistico.component';
import { CursosVeranoDashboardComponent } from './cursos-verano/cursos-verano-dashboard.component';

@Component({
  selector: 'app-modulo-estadistico',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    DashboardEstadisticoComponent,
    CursosVeranoDashboardComponent
  ],
  templateUrl: './modulo-estadistico.component.html',
  styleUrl: './modulo-estadistico.component.css'
})
export class ModuloEstadisticoComponent {

}
