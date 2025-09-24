// src/app/pages/coordinador/paz-salvo/paz-salvo.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo } from '../../../core/models/procesos.model';
import { ArchivoListComponent } from '../../../shared/components/archivo-list/archivo-list.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';

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
    ArchivoListComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoCoordinadorComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;
  
  solicitudes: Solicitud[] = [];
  selectedSolicitud: Solicitud | undefined;

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // 📌 Cargar solicitudes pendientes según el rol del usuario actual
  cargarSolicitudes(): void {
    this.pazSalvoService.getCoordinatorRequests().subscribe({
      next: (sols) => {
        this.solicitudes = sols;
      },
      error: () => this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 })
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = undefined;
      return;
    }
    this.pazSalvoService.getCoordinatorRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id === solicitudId);
      }
    });
  }

  // 📌 Obtener archivos de la solicitud seleccionada
  get archivosDelEstudiante(): (Archivo & { estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'error' })[] {
    return this.selectedSolicitud?.archivos ?? [];
  }

  // 📌 Ver archivo en nueva pestaña
  verArchivo(archivo: Archivo): void {
    if (archivo.url) {
      window.open(archivo.url, '_blank');
    } else {
      this.snackBar.open(`No hay URL disponible para: ${archivo.originalName}`, 'Cerrar', { duration: 3000 });
    }
  }

  // 📌 Aprobar archivo individual
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

  // 📌 Rechazar archivo individual
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

  // 📌 Aprobar toda la solicitud
  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.approveDefinitively(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Paz y Salvo aprobado definitivamente ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: () => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  // 📌 Rechazar toda la solicitud
  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar Paz y Salvo',
        descripcion: 'Indique el motivo de rechazo del paz y salvo:',
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.pazSalvoService.rejectRequest(this.selectedSolicitud!.id, motivo).subscribe({
          next: () => {
            this.snackBar.open('Paz y Salvo rechazado', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: () => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  añadirComentario(archivo: Archivo): void {
    const dialogRef = this.dialog.open(ComentarioDialogComponent, {
      width: '500px',
      data: <ComentarioDialogData>{
        titulo: 'Añadir Comentario',
        descripcion: 'Agregue un comentario para este documento:',
        nombreDocumento: archivo.nombre,
        placeholder: 'Escriba su comentario aquí...'
      }
    });

    dialogRef.afterClosed().subscribe((comentario: string) => {
      if (comentario) {
        // Aquí implementarías la lógica para guardar el comentario
        this.snackBar.open(`Comentario añadido a ${archivo.nombre}`, 'Cerrar', { duration: 3000 });
      }
    });
  }
}
