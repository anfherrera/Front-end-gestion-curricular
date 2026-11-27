import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { PazSalvoService } from '@core/services/paz-salvo.service';
import { SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import {
  ConfigRevisionAprobacion,
  RevisionAprobacionComponent,
  rolRevisionDeRuta,
} from '../../../pages/common/revision-aprobacion/revision-aprobacion.component';
import { aDocumentos } from './paz-salvo-filas';

/**
 * Revisión de paz y salvo para funcionario y coordinador. Secretaría tiene su propio flujo (oficio).
 * El rol llega como dato de la ruta (data.rolRevision) desde gestion.routes.ts.
 */
@Component({
  selector: 'app-paz-salvo-revision',
  imports: [RevisionAprobacionComponent],
  template: '<app-revision-aprobacion [config]="config" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PazSalvoRevisionComponent {
  private readonly rol = rolRevisionDeRuta(inject(ActivatedRoute));
  private readonly servicio = inject(PazSalvoService);

  readonly config: ConfigRevisionAprobacion<SolicitudHomologacionDTORespuesta> = {
    rol: this.rol,
    servicio: this.servicio,
    proceso: 'paz-salvo',
    nombreProceso: 'Paz y Salvo',
    mensajeRechazada: 'Paz y Salvo rechazado',
    // Al coordinador los documentos no le llegan con la lista: los pide por su endpoint
    ...(this.rol === 'coordinador' && {
      documentosAparte: (id: number) => this.servicio.obtenerDocumentosCoordinador(id).pipe(map(aDocumentos)),
      dialogoRechazo: { titulo: 'Rechazar Paz y Salvo', descripcion: 'Indique el motivo de rechazo del paz y salvo:' },
    }),
  };
}
