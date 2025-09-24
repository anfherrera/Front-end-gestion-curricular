import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo } from '../../../core/models/procesos.model';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';

@Component({
  selector: 'app-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    RequestStatusTableComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;
  
  solicitudes: Solicitud[] = [];
  selectedSolicitud: Solicitud | null = null;

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.pazSalvoService.getPendingRequests().subscribe({
      next: (sols) => {
        this.solicitudes = sols;
      },
      error: (err) => this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 })
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = null;
      return;
    }
    this.pazSalvoService.getPendingRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id === solicitudId) || null;
      }
    });
  }

  get archivosDelEstudiante(): (Archivo & { estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'error' })[] {
    return this.selectedSolicitud?.archivos ?? [];
  }

  verArchivo(archivo: Archivo): void {
    if (archivo.url) {
      window.open(archivo.url, '_blank');
    } else {
      this.snackBar.open(`No hay URL disponible para: ${archivo.originalName}`, 'Cerrar', { duration: 3000 });
    }
  }

  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    // Actualizar estado de todos los documentos a aprobado
    const documentosActualizados = this.archivosDelEstudiante.map(archivo => ({
      id_documento: archivo.id_documento,
      estado: 'aprobado' as const,
      comentario: null
    }));

    this.pazSalvoService.actualizarEstadoDocumentos(this.selectedSolicitud.id, documentosActualizados).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada y documentos actualizados ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        this.snackBar.open('Solicitud aprobada, pero error al actualizar documentos', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      }
    });
  }

  terminarValidacionSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.completeValidation(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Validación completada', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => this.snackBar.open('Error al terminar validación', 'Cerrar', { duration: 3000 })
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar solicitud',
        descripcion: 'Indique el motivo de rechazo de toda la solicitud:',
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.pazSalvoService.rejectRequest(this.selectedSolicitud!.id, motivo).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
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
