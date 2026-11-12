import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { SolicitudesAprobacionService } from './base/solicitudes-aprobacion.service';

/** Solicitudes de homologación de asignaturas. */
@Injectable({
  providedIn: 'root'
})
export class HomologacionAsignaturasService extends SolicitudesAprobacionService<SolicitudHomologacionDTORespuesta> {
  constructor() {
    super({
      recurso: 'solicitudes-homologacion',
      listar: 'listarSolicitud-Homologacion',
      estado: 'actualizarEstadoSolicitud',
      tipoOficio: 'OFICIO_HOMOLOGACION'
    });
  }

  crearSolicitud(solicitud: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/crearSolicitud-Homologacion`, solicitud);
  }

  listarSolicitudes(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion`);
  }

  /** Todas las bandejas pasan por /porRol con el rol como parámetro. */
  listarSolicitudesPorRol(rol: string, idUsuario?: number, periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams().set('rol', rol);
    if (idUsuario) params = params.set('idUsuario', idUsuario.toString());
    if (periodoAcademico) params = params.set('periodoAcademico', periodoAcademico);
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion/porRol`, { params });
  }

  /** Secretaría sube la resolución firmada. */
  subirResolucion(archivo: File, idSolicitud: number): Observable<unknown> {
    return this.subirPdf(`${this.apiUrl}/${idSolicitud}/subir-resolucion`, archivo);
  }
}
