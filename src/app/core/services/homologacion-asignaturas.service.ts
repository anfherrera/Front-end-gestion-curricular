import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudHomologacionDTOPeticion, SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { SolicitudesAprobacionService } from './base/solicitudes-aprobacion.service';

/** Solicitudes de homologación de asignaturas. */
@Injectable({
  providedIn: 'root',
})
export class HomologacionAsignaturasService extends SolicitudesAprobacionService<SolicitudHomologacionDTORespuesta> {
  constructor() {
    super('solicitudes-homologacion');
  }

  crearSolicitud(solicitud: SolicitudHomologacionDTOPeticion): Observable<unknown> {
    return this.http.post(this.apiUrl, solicitud);
  }

  /** Listado por rol: GET /?rol=…, con el usuario y el período como parámetros opcionales. */
  listarSolicitudesPorRol(
    rol: string,
    idUsuario?: number,
    periodoAcademico?: string
  ): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams().set('rol', rol);
    if (idUsuario) params = params.set('idUsuario', idUsuario.toString());
    if (periodoAcademico) params = params.set('periodoAcademico', periodoAcademico);
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(this.apiUrl, { params });
  }

  /** Secretaría sube la resolución firmada. */
  subirResolucion(archivo: File, idSolicitud: number): Observable<unknown> {
    return this.subirPdf(`${this.apiUrl}/${idSolicitud}/resoluciones`, archivo);
  }
}
