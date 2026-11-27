import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DocentesService } from '@features/admin/services/docentes.service';
import { ProgramasService } from '@core/services/programas.service';
import { RolesAdminService } from '@features/admin/services/roles-admin.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private docentesService = inject(DocentesService);
  private programasService = inject(ProgramasService);
  private rolesService = inject(RolesAdminService);

  readonly loading = signal(true);

  readonly totalDocentes = signal(0);
  readonly totalProgramas = signal(0);
  readonly totalRoles = signal(0);

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.loading.set(true);

    // Cargar docentes
    this.docentesService.listarDocentes().subscribe({
      next: (docentes) => {
        this.totalDocentes.set(docentes.length);
        this.verificarCargaCompleta();
      },
      error: () => {
        this.verificarCargaCompleta();
      },
    });

    // Cargar programas
    this.programasService.listarProgramas().subscribe({
      next: (programas) => {
        this.totalProgramas.set(programas.length);
        this.verificarCargaCompleta();
      },
      error: () => {
        this.verificarCargaCompleta();
      },
    });

    // Cargar roles
    this.rolesService.listarRoles().subscribe({
      next: (roles) => {
        this.totalRoles.set(roles.length);
        this.verificarCargaCompleta();
      },
      error: () => {
        this.verificarCargaCompleta();
      },
    });
  }

  private cargasCompletadas = 0;
  private verificarCargaCompleta(): void {
    this.cargasCompletadas++;
    if (this.cargasCompletadas >= 3) {
      this.loading.set(false);
    }
  }
}
