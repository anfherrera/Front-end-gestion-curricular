import { Component, inject } from '@angular/core';

import { PazSalvoService } from '@core/services/paz-salvo.service';
import { SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { ConfigOficioSecretaria, OficioSecretariaComponent } from '../oficio-secretaria/oficio-secretaria.component';

/** Secretaría: oficio de paz y salvo. */
@Component({
  selector: 'app-secretaria-paz-salvo',
  imports: [OficioSecretariaComponent],
  template: '<app-oficio-secretaria [config]="config" />'
})
export class SecretariaPazSalvoComponent {
  private readonly servicio = inject(PazSalvoService);

  readonly config: ConfigOficioSecretaria<SolicitudHomologacionDTORespuesta> = {
    proceso: 'paz-salvo',
    plantilla: {
      id: 'OFICIO_PAZ_SALVO',
      nombre: 'Oficio de Paz y Salvo',
      descripcion: 'Documento oficial que aprueba el paz y salvo del estudiante',
      camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
      camposOpcionales: []
    },
    pendientes: () => this.servicio.getSecretariaRequests(),
    procesadas: (periodo) => this.servicio.getSolicitudesProcesadasSecretaria(periodo),
    subirPdf: (id, archivo) => this.servicio.subirOficioPdf(id, archivo),
    aprobar: (id) => this.servicio.approveDefinitively(id)
  };
}
