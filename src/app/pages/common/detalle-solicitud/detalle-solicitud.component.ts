import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HistorialSolicitudesService } from '../../../core/services/historial-solicitudes.service';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { snackbarConfig } from '../../../core/design-system/design-tokens';

interface HistorialEstado {
  id_estado: number;
  estado_actual: string;
  fecha_registro_estado: string;
  comentario?: string | null;
}

interface Documento {
  id_documento: number;
  nombre_documento: string;
  ruta_documento: string;
  tipo_documento: string;
}

interface InformacionAdicional {
  titulo_trabajo_grado?: string;
  director_trabajo_grado?: string;
}

interface DetalleSolicitud {
  id_solicitud: number;
  nombre_solicitud: string;
  periodo_academico: string;
  fecha_registro_solicitud: string;
  fecha_ceremonia?: string | null;
  tipo_solicitud: string;
  tipo_solicitud_display: string;
  estado_actual: string;
  fecha_ultimo_estado: string;
  usuario: {
    id_usuario: number;
    nombre_completo: string;
    codigo: string;
    correo?: string;
    cedula?: string;
  };
  historial_estados: HistorialEstado[];
  total_estados: number;
  documentos: Documento[];
  total_documentos: number;
  informacion_adicional?: InformacionAdicional;
}

@Component({
  selector: 'app-detalle-solicitud',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule,
    CardContainerComponent
  ],
  templateUrl: './detalle-solicitud.component.html',
  styleUrls: ['./detalle-solicitud.component.css']
})
export class DetalleSolicitudComponent implements OnInit {
  solicitud: DetalleSolicitud | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private historialService: HistorialSolicitudesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.cargarHistorial(Number(id));
    } else {
      this.error = 'ID de solicitud no proporcionado';
    }
  }

  cargarHistorial(id: number): void {
    this.loading = true;
    this.error = null;

    this.historialService.obtenerHistorialSolicitud(id).subscribe({
      next: (data) => {
        this.solicitud = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al cargar el historial de la solicitud';
        this.loading = false;
        if (this.error) {
          this.snackBar.open(this.error, 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      }
    });
  }

  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearFechaCorta(fecha: string | Date): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('aprobada')) {
      return 'estado-aprobada';
    } else if (estadoLower.includes('rechazada')) {
      return 'estado-rechazada';
    } else if (estadoLower.includes('enviada')) {
      return 'estado-enviada';
    } else if (estadoLower.includes('proceso') || estadoLower.includes('revisión')) {
      return 'estado-proceso';
    }
    return 'estado-default';
  }

  descargarDocumento(documento: Documento): void {
    // Implementar descarga de documento
    window.open(documento.ruta_documento, '_blank');
  }

  volver(): void {
    const currentPath = this.router.url;
    const basePath = currentPath.split('/').slice(0, -2).join('/'); // Volver a historial-completo
    this.router.navigate([basePath]);
  }
}

