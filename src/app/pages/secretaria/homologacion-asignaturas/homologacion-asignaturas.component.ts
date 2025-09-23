import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { OficioResolucionComponent } from '../../../shared/components/oficio-resolucion/oficio-resolucion.component';

@Component({
  selector: 'app-homologacion-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    OficioResolucionComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;

  get solicitudParaOficio() {
    if (!this.selectedSolicitud) return null;
    return {
      id: this.selectedSolicitud.id_solicitud,
      nombre: this.selectedSolicitud.objUsuario.nombre_completo || '',
      fecha: this.selectedSolicitud.fecha_registro_solicitud,
      estado: 'APROBADA_COORDINADOR' as any
    };
  }

  constructor(
    private homologacionService: HomologacionAsignaturasService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  /**
   * Cargar solicitudes pendientes para secretaría (solo las aprobadas por coordinador)
   */
  cargarSolicitudes(): void {
    this.homologacionService.getSecretariaRequests().subscribe({
      next: (sols) => {
        // Transformar datos para RequestStatusTableComponent
        this.solicitudes = sols.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(sol),
          rutaArchivo: '', // Para oficios
          comentarios: ''
        }));
        console.log('📋 Solicitudes cargadas para secretaría:', this.solicitudes);
      },
      error: (err) => {
        console.error('❌ Error al cargar solicitudes:', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Obtener el estado actual de la solicitud
   */
  getEstadoActual(solicitud: SolicitudHomologacionDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual;
    }
    return 'Pendiente';
  }

  /**
   * Seleccionar solicitud (evento del RequestStatusTableComponent)
   */
  onSolicitudSeleccionada(solicitudId: number): void {
    // Buscar la solicitud original por ID
    this.homologacionService.getSecretariaRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        console.log('✅ Solicitud seleccionada:', this.selectedSolicitud);
      }
    });
  }

  /**
   * Generar oficio/resolución
   */
  generarOficio(contenido: string): void {
    if (!this.selectedSolicitud) return;

    console.log('📄 Generando oficio para solicitud:', this.selectedSolicitud.id_solicitud);
    console.log('📄 Contenido del oficio:', contenido);

    this.homologacionService.generarOficio(this.selectedSolicitud.id_solicitud, contenido).subscribe({
      next: (response) => {
        console.log('✅ Oficio generado:', response);
        this.snackBar.open('Oficio generado correctamente ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes(); // Recargar para actualizar estados
      },
      error: (err) => {
        console.error('❌ Error al generar oficio:', err);
        this.snackBar.open('Error al generar oficio', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
