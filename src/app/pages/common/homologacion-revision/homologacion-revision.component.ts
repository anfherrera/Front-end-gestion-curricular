import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import {
  ConfigRevisionAprobacion,
  RevisionAprobacionComponent,
  rolRevisionDeRuta
} from '../revision-aprobacion/revision-aprobacion.component';

/**
 * Revisión de homologación de asignaturas para funcionario y coordinador.
 * El rol llega como dato de la ruta (data.rolRevision) desde app.routes.ts.
 */
@Component({
  selector: 'app-homologacion-revision',
  imports: [RevisionAprobacionComponent],
  template: '<app-revision-aprobacion [config]="config" />'
})
export class HomologacionRevisionComponent {
  private readonly rol = rolRevisionDeRuta(inject(ActivatedRoute));

  readonly config: ConfigRevisionAprobacion<SolicitudHomologacionDTORespuesta> = {
    rol: this.rol,
    servicio: inject(HomologacionAsignaturasService),
    proceso: 'homologacion',
    nombreProceso: 'Homologación',
    // El funcionario revisa los documentos: al decidir los marca como válidos o no válidos
    marcarDocumentosAlDecidir: this.rol === 'funcionario'
  };
}
