import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';

@Component({
  selector: 'app-homologacion-asignaturas',
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
    MatTooltipModule
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  solicitudes: SolicitudHomologacionDTORespuesta[] = [];
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;

  displayedColumns: string[] = ['nombre_solicitud', 'solicitante', 'fecha', 'accion'];

  constructor(
    private homologacionService: HomologacionAsignaturasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.homologacionService.getPendingRequests().subscribe({
      next: (sols) => {
        this.solicitudes = sols;
        if (sols.length) this.selectedSolicitud = sols[0];
      },
      error: (err) => this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 })
    });
  }

  get documentosDelEstudiante(): DocumentoHomologacion[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  seleccionarSolicitud(solicitud: SolicitudHomologacionDTORespuesta): void {
    this.selectedSolicitud = solicitud;
  }

  verDocumento(documento: DocumentoHomologacion): void {
    if (documento.ruta_documento) {
      // Aquí puedes implementar la lógica para abrir el documento
      // Por ejemplo, abrir en una nueva ventana o descargar
      window.open(documento.ruta_documento, '_blank');
    } else {
      this.snackBar.open(`No hay ruta disponible para: ${documento.nombre}`, 'Cerrar', { duration: 3000 });
    }
  }

  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.homologacionService.approveRequest(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
      },
      error: (err) => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  terminarValidacionSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.homologacionService.completeValidation(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Validación completada', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
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
        this.homologacionService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
          },
          error: (err) => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
