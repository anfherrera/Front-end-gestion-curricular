import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SolicitudReingresoDTOPeticion, SolicitudReingresoDTORespuesta } from '../models/procesos.model';
import { SolicitudesAprobacionService } from './base/solicitudes-aprobacion.service';

const BANDEJA_POR_ROL: Record<string, string> = {
  funcionario: 'Funcionario',
  coordinador: 'Coordinador',
  secretaria: 'Secretaria'
};

/** Solicitudes de reingreso de estudiantes. */
@Injectable({
  providedIn: 'root'
})
export class ReingresoEstudianteService extends SolicitudesAprobacionService<SolicitudReingresoDTORespuesta> {
  constructor() {
    super({
      recurso: 'solicitudes-reingreso',
      listar: 'listarSolicitud-Reingreso',
      estado: 'actualizarEstadoSolicitud-Reingreso',
      tipoOficio: 'OFICIO_REINGRESO'
    });
  }

  crearSolicitud(solicitud: SolicitudReingresoDTOPeticion): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/crearSolicitud-Reingreso`, solicitud);
  }

  listarSolicitudes(): Observable<SolicitudReingresoDTORespuesta[]> {
    return this.http.get<SolicitudReingresoDTORespuesta[]>(`${this.apiUrl}/listarSolicitudes-Reingreso`);
  }

  /** Funcionario, coordinador y secretaría tienen su bandeja; el estudiante usa /porUser. */
  listarSolicitudesPorRol(rol: string, idUsuario?: number, periodoAcademico?: string): Observable<SolicitudReingresoDTORespuesta[]> {
    const bandeja = BANDEJA_POR_ROL[rol.toLowerCase()];
    if (bandeja) return this.listar<SolicitudReingresoDTORespuesta>(`${this.rutas.listar}/${bandeja}`, periodoAcademico);

    let params = this.paramsPeriodo(periodoAcademico).set('rol', rol);
    if (idUsuario) params = params.set('idUsuario', idUsuario.toString());    return this.http.get<SolicitudReingresoDTORespuesta[]>(`${this.apiUrl}/${this.rutas.listar}/porUser`, { params });
  }
}
