import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DocentesService } from '../services/docentes.service';
import { ProgramasService } from '../services/programas.service';
import { RolesAdminService } from '../services/roles-admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  loading = true;
  
  totalDocentes = 0;
  totalProgramas = 0;
  totalRoles = 0;

  constructor(
    private docentesService: DocentesService,
    private programasService: ProgramasService,
    private rolesService: RolesAdminService
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.loading = true;

    // Cargar docentes
    this.docentesService.listarDocentes().subscribe({
      next: (docentes) => {
        this.totalDocentes = docentes.length;
        this.verificarCargaCompleta();
      },
      error: (err) => {
        console.error('Error al cargar docentes:', err);
        this.verificarCargaCompleta();
      }
    });

    // Cargar programas
    this.programasService.listarProgramas().subscribe({
      next: (programas) => {
        this.totalProgramas = programas.length;
        this.verificarCargaCompleta();
      },
      error: (err) => {
        console.error('Error al cargar programas:', err);
        this.verificarCargaCompleta();
      }
    });

    // Cargar roles
    this.rolesService.listarRoles().subscribe({
      next: (roles) => {
        this.totalRoles = roles.length;
        this.verificarCargaCompleta();
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.verificarCargaCompleta();
      }
    });
  }

  private cargasCompletadas = 0;
  private verificarCargaCompleta(): void {
    this.cargasCompletadas++;
    if (this.cargasCompletadas >= 3) {
      this.loading = false;
    }
  }
}
