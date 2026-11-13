import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ReingresoEstudianteService } from '@core/services/reingreso-estudiante.service';
import { SolicitudReingresoDTORespuesta } from '@core/models/procesos.model';
import {
  ConfigRevisionAprobacion,
  RevisionAprobacionComponent,
  rolRevisionDeRuta
} from '../revision-aprobacion/revision-aprobacion.component';

/**
 * Revisión de reingreso de estudiantes para funcionario y coordinador.
 * El rol llega como dato de la ruta (data.rolRevision) desde app.routes.ts.
 */
@Component({
  selector: 'app-reingreso-revision',
  imports: [RevisionAprobacionComponent],
  template: '<app-revision-aprobacion [config]="config" />'
})
export class ReingresoRevisionComponent {
  readonly config: ConfigRevisionAprobacion<SolicitudReingresoDTORespuesta> = {
    rol: rolRevisionDeRuta(inject(ActivatedRoute)),
    servicio: inject(ReingresoEstudianteService),
    proceso: 'reingreso',
    nombreProceso: 'Reingreso',
    marcarDocumentosAlDecidir: false
  };
}
