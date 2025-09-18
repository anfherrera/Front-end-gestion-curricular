// src/app/pages/secretaria/paz-salvo/secretaria-paz-salvo.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud } from '../../../core/models/procesos.model';
import { OficioResolucionComponent } from '../../../shared/components/oficio-resolucion/oficio-resolucion.component';

@Component({
  selector: 'app-secretaria-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    OficioResolucionComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css'] // ✅ corregido
})
export class SecretariaPazSalvoComponent implements OnInit {
  solicitudes: Solicitud[] = [];
  selectedSolicitud?: Solicitud;

  displayedColumns: string[] = ['estudiante', 'solicitud', 'estado', 'seleccionar'];

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // 📌 Cargar solicitudes pendientes (solo las que pasaron por coordinador)
  cargarSolicitudes(): void {
    this.pazSalvoService.getPendingRequests().subscribe({ // ✅ sin argumento
      next: (sols) => this.solicitudes = sols,
      error: () => this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 })
    });
  }

  // 📌 Seleccionar solicitud de la tabla
  seleccionarSolicitud(solicitud: Solicitud): void {
    this.selectedSolicitud = solicitud;
  }

  // 📌 Generar oficio/resolución
  generarOficio(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.generateOfficio(this.selectedSolicitud.id).subscribe({
      next: (url) => this.snackBar.open(`Oficio generado: ${url}`, 'Cerrar', { duration: 4000 }),
      error: () => this.snackBar.open('Error al generar oficio', 'Cerrar', { duration: 3000 })
    });
  }
}
