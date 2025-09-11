// src/app/pages/funcionario/paz-salvo/paz-salvo.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PazSalvoService, Solicitud, Documento } from '../../../core/services/paz-salvo.service';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field'; // <-- IMPORTAR
import { MatSelectModule } from '@angular/material/select'; // <-- IMPORTAR

@Component({
  selector: 'app-paz-salvo',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule,  MatFormFieldModule, MatSelectModule  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {

  solicitudes: Solicitud[] = [];
  selectedSolicitud?: Solicitud;

  constructor(private pazSalvoService: PazSalvoService, private snackBar: MatSnackBar) {}

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

  // Archivos del estudiante seleccionado
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
    this.pazSalvoService.reviewDocument(this.selectedSolicitud.id, archivo.id, false).subscribe({
      next: () => this.snackBar.open(`Archivo rechazado: ${archivo.nombre}`, 'Cerrar', { duration: 2000 })
    });
  }

  rechazarSolicitudSeleccionada() {
    if (!this.selectedSolicitud) return;
    this.pazSalvoService.rejectRequest(this.selectedSolicitud.id, 'Motivo de rechazo').subscribe({
      next: () => {
        this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
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
