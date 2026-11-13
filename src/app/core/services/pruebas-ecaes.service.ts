import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SolicitudesBaseService } from './base/solicitudes-base.service';

export interface FechaEcaes {
  idFechaEcaes: number;
  periodoAcademico: string;
  inscripcion_est_by_facultad: string;
  registro_recaudo_ordinario: string;
  registro_recaudo_extraordinario: string;
  citacion: string;
  aplicacion: string;
  resultados_individuales: string;
}

export interface SolicitudEcaesRequest {
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  periodo_academico: string; // Obligatorio, formato YYYY-P
  fecha_ceremonia?: string | null; // Opcional
  objUsuario: {
    id_usuario: number;
    nombre_completo: string;
    codigo: string;
    cedula: string; // Obligatorio
    correo: string;
    estado_usuario: boolean;
    id_rol?: number;
    id_programa?: number;
  };
  tipoDocumento: string;
  numero_documento: string;
  fecha_expedicion: string;
  fecha_nacimiento: string;
  documentos: {
    nombre: string;
    ruta_documento: string;
    fecha_documento: string;
    esValido: boolean;
    comentario: string;
    tipoDocumentoSolicitudPazYSalvo: string;
  }[];
}

export interface SolicitudEcaesResponse {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  periodo_academico: string; // Obligatorio, formato YYYY-P
  fecha_ceremonia?: string | null; // Opcional
  estadosSolicitud: {
    id_estado: number | null;
    estado_actual: string;
    fecha_registro_estado: string;
    comentario?: string | null;
    objSolicitud: any;
  }[];
  objUsuario: {
    id_usuario: number;
    nombre_completo: string;
    rol: {
      id_rol: number;
      nombre: string | null;
    };
    codigo: string;
    cedula: string; // Obligatorio
    correo: string;
    estado_usuario: boolean;
    objPrograma: {
      id_programa: number;
      codigo: string;
      nombre_programa: string;
    };
  };
  documentos: any[];
  tipoDocumento: string;
  numero_documento: string;
  fecha_expedicion: string;
  fecha_nacimiento: string;
}

/** Solicitudes y fechas de las pruebas ECAES (Saber Pro). */
@Injectable({
  providedIn: 'root'
})
export class PruebasEcaesService extends SolicitudesBaseService {
  constructor() {
    super(`${environment.apiUrl}/solicitudes-ecaes`);
  }

  // ---------- Fechas ----------

  listarFechasEcaes(): Observable<FechaEcaes[]> {
    return this.http.get<FechaEcaes[]>(`${this.apiUrl}/listarFechasEcaes`);
  }

  buscarFechasPorPeriodo(periodoAcademico: string): Observable<FechaEcaes> {
    return this.http.get<FechaEcaes>(`${this.apiUrl}/buscarFechasPorPeriodo/${encodeURIComponent(periodoAcademico)}`);
  }

  publicarFechasEcaes(fechas: Omit<FechaEcaes, 'idFechaEcaes'>): Observable<FechaEcaes> {
    return this.http.post<FechaEcaes>(`${this.apiUrl}/publicarFechasEcaes`, fechas);
  }

  actualizarFechasEcaes(fechas: FechaEcaes): Observable<FechaEcaes> {
    return this.http.put<FechaEcaes>(`${this.apiUrl}/actualizarFechasEcaes`, fechas);
  }

  // ---------- Solicitudes ----------

  crearSolicitudEcaes(solicitud: SolicitudEcaesRequest): Observable<SolicitudEcaesResponse> {
    return this.http.post<SolicitudEcaesResponse>(`${this.apiUrl}/crearSolicitud-Ecaes`, solicitud);
  }

  listarSolicitudesPorRol(rol: string, idUsuario?: number, periodoAcademico?: string): Observable<SolicitudEcaesResponse[]> {
    let params = new HttpParams().set('rol', rol);
    if (idUsuario) params = params.set('idUsuario', idUsuario.toString());
    if (periodoAcademico) params = params.set('periodoAcademico', periodoAcademico);
    return this.http.get<SolicitudEcaesResponse[]>(`${this.apiUrl}/listarSolicitud-ecaes/porRol`, { params });
  }

  listarSolicitudesFuncionario(periodoAcademico?: string): Observable<SolicitudEcaesResponse[]> {
    return this.listar<SolicitudEcaesResponse>('listarSolicitudes-Ecaes/Funcionario', periodoAcademico);
  }

  /** El funcionario aprueba: la solicitud pasa directamente a PRE_REGISTRADO. */
  approveRequest(idSolicitud: number): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'PRE_REGISTRADO');
  }

  rejectRequest(idSolicitud: number, motivo?: string): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'Rechazada', motivo || 'Solicitud rechazada por el funcionario');
  }
}
