import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SolicitudReingresoDTOPeticion, SolicitudReingresoDTORespuesta } from '@core/models/procesos.model';
import { RolBandeja, SolicitudesAprobacionService } from '@core/services/base/solicitudes-aprobacion.service';

const BANDEJAS: readonly RolBandeja[] = ['funcionario', 'coordinador', 'secretaria'];

/** Solicitudes de reingreso de estudiantes. */
@Injectable({
  providedIn: 'root',
})
export class ReingresoEstudianteService extends SolicitudesAprobacionService<SolicitudReingresoDTORespuesta> {
  constructor() {
    super('solicitudes-reingreso');
  }

  crearSolicitud(solicitud: SolicitudReingresoDTOPeticion): Observable<unknown> {
    return this.http.post(this.apiUrl, solicitud);
  }

  /** Funcionario, coordinador y secretaría tienen su bandeja de pendientes; los demás, GET /?rol=…. */
  listarSolicitudesPorRol(
    rol: string,
    idUsuario?: number,
    periodoAcademico?: string
  ): Observable<SolicitudReingresoDTORespuesta[]> {
    const rolBandeja = rol.toLowerCase() as RolBandeja;
    if (BANDEJAS.includes(rolBandeja)) return this.bandeja(rolBandeja, 'pendientes', periodoAcademico);

    let params = this.paramsPeriodo(periodoAcademico).set('rol', rol);
    if (idUsuario) params = params.set('idUsuario', idUsuario.toString());
    return this.http.get<SolicitudReingresoDTORespuesta[]>(this.apiUrl, { params });
  }
}
