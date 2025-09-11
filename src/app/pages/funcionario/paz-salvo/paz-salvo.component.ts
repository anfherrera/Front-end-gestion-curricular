import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog'; // 👈 IMPORTAR
import { PazSalvoService, Solicitud, Documento } from '../../../core/services/paz-salvo.service';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

// 👇 Importar tu dialogo standalone
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog';

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
    MatTableModule
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {

  solicitudes: Solicitud[] = [];
  selectedSolicitud?: Solicitud;

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog // 👈 INYECTAR DIALOG
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.pazSalvoService.getPendingRequests('funcionario').subscribe({
      next: (sols) => {
        this.solicitudes = sols;
        if (this.solicitudes.length) this.selectedSolicitud = this.solicitudes[0];
      },
      error: (err) => console.error('Error al cargar solicitudes', err)
    });
  }

  get archivosDelEstudiante(): Documento[] {
    return this.selectedSolicitud?.documentos || [];
  }

  seleccionarSolicitud(solicitud: Solicitud): void {
    this.selectedSolicitud = solicitud;
  }

  verArchivo(archivo: Documento) {
    alert(`Visualizando: ${archivo.nombre}`);
  }

  aprobarArchivo(archivo: Documento) {
    if (!this.selectedSolicitud) return;
    this.pazSalvoService.reviewDocument(this.selectedSolicitud.id, archivo.id, true).subscribe({
      next: () => this.snackBar.open(`Archivo aprobado: ${archivo.nombre}`, 'Cerrar', { duration: 2000 })
    });
  }

  rechazarArchivo(archivo: Documento) {
    if (!this.selectedSolicitud) return;

    // 👇 Abrir diálogo antes de rechazar
    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '400px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar archivo',
        descripcion: `Indique el motivo para rechazar el archivo "${archivo.nombre}"`,
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.pazSalvoService.reviewDocument(this.selectedSolicitud!.id, archivo.id, false).subscribe({
          next: () => this.snackBar.open(`Archivo rechazado: ${archivo.nombre}`, 'Cerrar', { duration: 2000 })
        });
      }
    });
  }

  rechazarSolicitudSeleccionada() {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar solicitud',
        descripcion: 'Por favor indique el motivo de rechazo de toda la solicitud.',
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.pazSalvoService.rejectRequest(this.selectedSolicitud!.id, motivo).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
          }
        });
      }
    });
  }

  terminarValidacionSeleccionada() {
    if (!this.selectedSolicitud) return;
    this.pazSalvoService.completeValidation(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Validación completada', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
      }
    });
  }
}
