import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { HomologacionAsignaturasService } from '@features/homologacion/services/homologacion-asignaturas.service';
import { SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import {
  ConfigOficioSecretaria,
  OficioSecretariaComponent,
} from '@features/solicitudes/oficio-secretaria/oficio-secretaria.component';

/** Secretaría: oficio de homologación de asignaturas. */
@Component({
  selector: 'app-homologacion-asignaturas',
  imports: [OficioSecretariaComponent],
  template: '<app-oficio-secretaria [config]="config" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomologacionAsignaturasComponent {
  private readonly servicio = inject(HomologacionAsignaturasService);

  readonly config: ConfigOficioSecretaria<SolicitudHomologacionDTORespuesta> = {
    proceso: 'homologacion',
    plantilla: {
      id: 'OFICIO_HOMOLOGACION',
      nombre: 'Oficio de Homologación',
      descripcion: 'Documento oficial que aprueba la homologación de asignaturas',
      camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
      camposOpcionales: ['observaciones'],
    },
    pendientes: () => this.servicio.getSecretariaRequests(),
    procesadas: (periodo) => this.servicio.getSecretariaApprovedRequests(periodo),
    subirPdf: (id, archivo) => this.servicio.subirResolucion(archivo, id),
    aprobar: (id) => this.servicio.approveDefinitively(id),
    servicioDocumentos: this.servicio,
  };
}
