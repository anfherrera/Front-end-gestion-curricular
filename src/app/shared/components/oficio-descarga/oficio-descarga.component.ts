import { Component, Input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Solicitud } from '@core/models/procesos.model';
import { EstadosSolicitud } from '@core/enums/estados-solicitud.enum';
import { normalizarEstado } from '@core/utils/estado-solicitud.util';
@Component({
  selector: 'app-oficio-descarga',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './oficio-descarga.component.html',
  styleUrls: ['./oficio-descarga.component.css']
})
export class OficioDescargaComponent {
  @Input() solicitud!: Solicitud;

  get puedeDescargar(): boolean {
    return normalizarEstado(this.solicitud.estado) === EstadosSolicitud.APROBADA && !!this.solicitud.oficioUrl;
  }
}
