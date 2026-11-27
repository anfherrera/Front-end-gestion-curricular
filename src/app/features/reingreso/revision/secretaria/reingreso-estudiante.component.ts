import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ReingresoEstudianteService } from '@features/reingreso/services/reingreso-estudiante.service';
import { SolicitudReingresoDTORespuesta } from '@core/models/procesos.model';
import {
  ConfigOficioSecretaria,
  OficioSecretariaComponent,
} from '@features/solicitudes/oficio-secretaria/oficio-secretaria.component';

/** Secretaría: resolución de reingreso. */
@Component({
  selector: 'app-reingreso-estudiante',
  imports: [OficioSecretariaComponent],
  template: '<app-oficio-secretaria [config]="config" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReingresoEstudianteComponent {
  private readonly servicio = inject(ReingresoEstudianteService);

  readonly config: ConfigOficioSecretaria<SolicitudReingresoDTORespuesta> = {
    proceso: 'reingreso',
    plantilla: {
      id: 'RESOLUCION_REINGRESO',
      nombre: 'Resolución de Reingreso',
      descripcion: 'Genera una resolución oficial para el proceso de reingreso del estudiante',
      camposRequeridos: ['nombreEstudiante', 'codigoEstudiante', 'programa', 'fechaSolicitud', 'motivoReingreso'],
      camposOpcionales: ['observaciones'],
    },
    pendientes: () => this.servicio.getSecretariaRequests(),
    procesadas: (periodo) => this.servicio.getSecretariaApprovedRequests(periodo),
    subirPdf: (id, archivo) => this.servicio.subirArchivoPDF(archivo, id),
    aprobar: (id) => this.servicio.approveDefinitively(id),
    servicioDocumentos: this.servicio,
  };
}
