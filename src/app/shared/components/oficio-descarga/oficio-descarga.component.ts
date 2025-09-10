import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Solicitud } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/models/solicitud-status.enum';
@Component({
  selector: 'app-oficio-descarga',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './oficio-descarga.component.html',
  styleUrls: ['./oficio-descarga.component.css']
})
export class OficioDescargaComponent {
  @Input() solicitud!: Solicitud;

  get puedeDescargar(): boolean {
    return this.solicitud.estado === SolicitudStatusEnum.APROBADA && !!this.solicitud.oficioUrl;
  }
}
