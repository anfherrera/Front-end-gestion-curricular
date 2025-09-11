// src/app/pages/coordinador/paz-salvo/paz-salvo.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo } from '../../../core/models/procesos.model';
import { ArchivoListComponent } from '../../../shared/components/archivo-list/archivo-list.component';

@Component({
  selector: 'app-paz-salvo-coordinador',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    ArchivoListComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoCoordinadorComponent implements OnInit {
  solicitudes: Solicitud[] = [];
  selectedSolicitud?: Solicitud;

  displayedColumns: string[] = ['solicitante', 'fecha', 'accion'];

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.pazSalvoService.getPendingRequests('coordinador').subscribe({
      next: (sols) => {
        this.solicitudes = sols;
        if (sols.length) this.selectedSolicitud = sols[0];
      },
      error: () => this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 })
    });
  }

  get archivosDelEstudiante(): (Archivo & { estado?: 'pendiente' | 'aprobado' | 'rechazado' })[] {
    return this.selectedSolicitud?.archivos ?? [];
  }

  seleccionarSolicitud(solicitud: Solicitud): void {
    this.selectedSolicitud = solicitud;
  }

  verArchivo(archivo: Archivo): void {
    if (archivo.url) {
      window.open(archivo.url, '_blank');
    } else {
      this.snackBar.open(`No hay URL disponible para: ${archivo.originalName}`, 'Cerrar', { duration: 3000 });
    }
  }

  aprobarArchivo(index: number): void {
    if (!this.selectedSolicitud) return;
    const archivo = this.archivosDelEstudiante[index];

    this.pazSalvoService.approveDocument(this.selectedSolicitud.id, archivo.nombre).subscribe({
      next: (updated) => {
        archivo.estado = updated.estado;
        this.snackBar.open(`Archivo ${archivo.nombre} aprobado`, 'Cerrar', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al aprobar archivo', 'Cerrar', { duration: 3000 })
    });
  }

  rechazarArchivo(index: number): void {
    if (!this.selectedSolicitud) return;
    const archivo = this.archivosDelEstudiante[index];

    this.pazSalvoService.rejectDocument(this.selectedSolicitud.id, archivo.nombre).subscribe({
      next: (updated) => {
        archivo.estado = updated.estado;
        this.snackBar.open(`Archivo ${archivo.nombre} rechazado`, 'Cerrar', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error al rechazar archivo', 'Cerrar', { duration: 3000 })
    });
  }

  aprobarSolicitud(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.approveRequest(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
      },
      error: () => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  rechazarSolicitud(): void {
    if (!this.selectedSolicitud) return;

    const motivo = prompt('Ingrese el motivo de rechazo de la solicitud:');
    if (!motivo) return;

    this.pazSalvoService.rejectRequest(this.selectedSolicitud.id, motivo).subscribe({
      next: () => {
        this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
      },
      error: () => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
    });
  }
}
