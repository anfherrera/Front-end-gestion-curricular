import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  DetalleSolicitud,
  DocumentoDetalle,
  HistorialSolicitudesService,
} from '@core/services/historial-solicitudes.service';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { ArchivosService } from '@core/services/archivos.service';
import { mensajeDeError } from '@core/utils/http-error.utils';
import { descargarBlob } from '@core/utils/download.util';
import { EstadoClasePipe, EstadoIconoPipe, EstadoLabelPipe } from '@shared/pipes/estado.pipes';
import { FechaPipe } from '@shared/pipes/fecha.pipe';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-detalle-solicitud',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatListModule,
    MatTooltipModule,
    CardContainerComponent,
    EstadoClasePipe,
    EstadoLabelPipe,
    EstadoIconoPipe,
    FechaPipe,
  ],
  templateUrl: './detalle-solicitud.component.html',
  styleUrls: ['../estados-solicitud-comun.css', './detalle-solicitud.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleSolicitudComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private historialService = inject(HistorialSolicitudesService);
  private archivosService = inject(ArchivosService);
  private snackbar = inject(SnackbarService);

  readonly solicitud = signal<DetalleSolicitud | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.cargarHistorial(Number(id));
    } else {
      this.error.set('ID de solicitud no proporcionado');
    }
  }

  cargarHistorial(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.historialService.obtenerDetalleSolicitud(id).subscribe({
      next: (data) => {
        this.solicitud.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        const mensaje: string = err.error?.error || 'Error al cargar el historial de la solicitud';
        this.error.set(mensaje);
        this.loading.set(false);
        this.snackbar.error(mensaje);
      },
    });
  }

  descargarDocumento(documento: DocumentoDetalle): void {
    // Blob por el servicio en lugar de window.open: así pasa por el interceptor y envía el JWT
    this.archivosService.descargarPDF(documento.nombre_documento).subscribe({
      next: (blob) => descargarBlob(blob, documento.nombre_documento),
      error: (error) => {
        this.snackbar.error(mensajeDeError(error, 'Error al descargar el documento'));
      },
    });
  }

  volver(): void {
    const currentPath = this.router.url;
    const basePath = currentPath.split('/').slice(0, -2).join('/'); // Volver a historial-completo
    this.router.navigate([basePath]);
  }
}
