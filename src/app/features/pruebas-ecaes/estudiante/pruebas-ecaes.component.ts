import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { PruebasEcaesService, SolicitudEcaesResponse } from '@core/services/pruebas-ecaes.service';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { Solicitud } from '@core/models/procesos.model';
import { ESTADOS_SOLICITUD_LABELS, EstadosSolicitud } from '@core/enums/estados-solicitud.enum';
import { normalizarEstado } from '@core/utils/estado-solicitud.util';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '@shared/components/request-status/request-status.component';
import { InfoPreregistroDialogComponent } from './info-preregistro-dialog/info-preregistro-dialog.component';
import { FechasEcaesComponent } from './fechas-ecaes/fechas-ecaes.component';
import { PreregistroEcaesComponent } from './preregistro-ecaes/preregistro-ecaes.component';
import { SeguimientoSolicitudesBase } from '../../../pages/estudiante/seguimiento-solicitudes.base';

/**
 * Pruebas ECAES del estudiante: el calendario (`app-fechas-ecaes`), el preregistro
 * (`app-preregistro-ecaes`) y el seguimiento de sus solicitudes, que se recarga al enviar una.
 */
@Component({
  selector: 'app-pruebas-ecaes',
  imports: [
    MatIconModule,
    MatDialogModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    FechasEcaesComponent,
    PreregistroEcaesComponent,
  ],
  templateUrl: './pruebas-ecaes.component.html',
  styleUrl: './pruebas-ecaes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PruebasEcaesComponent extends SeguimientoSolicitudesBase<SolicitudEcaesResponse> {
  private pruebasEcaesService = inject(PruebasEcaesService);

  protected listar(usuario: UsuarioSesion) {
    return this.pruebasEcaesService.listarSolicitudesPorRol('ESTUDIANTE', usuario.id_usuario);
  }

  /**
   * Fila de la tabla: el estado se lleva a un código conocido. El nombre se deja como llega:
   * `nombre_solicitud` ya trae el del estudiante ("Solicitud ECAES - <nombre>").
   */
  protected override aFila(sol: SolicitudEcaesResponse): Solicitud {
    const fila = super.aFila(sol);
    return {
      ...fila,
      estado: this.mapearEstado(fila.estado),
      oficioUrl: '',
    };
  }

  mostrarInfoPreregistro(): void {
    this.dialog.open(InfoPreregistroDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      data: {},
    });
  }

  /** Código del backend; si no es un estado conocido (p. ej. "Pendiente") se muestra como enviada. */
  private mapearEstado(estadoString: string): string {
    const codigo = normalizarEstado(estadoString);
    return codigo in ESTADOS_SOLICITUD_LABELS ? codigo : EstadosSolicitud.ENVIADA;
  }
}
