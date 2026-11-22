import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { TipoDocumento, TiposDocumentoRespuesta } from '../models/tipo-documento.model';
import { UsuarioDTOPeticion } from '../models/usuario.interface';
import { DocumentoHomologacion } from '../models/procesos.model';
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
  objUsuario: UsuarioDTOPeticion;
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
    objSolicitud: unknown;
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
  documentos: DocumentoHomologacion[];
  tipoDocumento: string;
  numero_documento: string;
  fecha_expedicion: string;
  fecha_nacimiento: string;
}

/** Solicitudes y fechas de las pruebas ECAES (Saber Pro). */
@Injectable({
  providedIn: 'root',
})
export class PruebasEcaesService extends SolicitudesBaseService {
  constructor() {
    super(`${environment.apiUrl}/solicitudes-ecaes`);
  }

  // ---------- Fechas ----------

  listarFechasEcaes(): Observable<FechaEcaes[]> {
    return this.http.get<FechaEcaes[]>(`${this.apiUrl}/fechas`);
  }

  buscarFechasPorPeriodo(periodoAcademico: string): Observable<FechaEcaes> {
    return this.http.get<FechaEcaes>(`${this.apiUrl}/fechas/${encodeURIComponent(periodoAcademico)}`);
  }

  publicarFechasEcaes(fechas: Omit<FechaEcaes, 'idFechaEcaes'>): Observable<FechaEcaes> {
    return this.http.post<FechaEcaes>(`${this.apiUrl}/fechas`, fechas);
  }

  /** Actualiza (o crea) las fechas de su período: el backend toma el período de la ruta. */
  actualizarFechasEcaes(fechas: FechaEcaes): Observable<FechaEcaes> {
    return this.http.put<FechaEcaes>(`${this.apiUrl}/fechas/${encodeURIComponent(fechas.periodoAcademico)}`, fechas);
  }

  /** Tipos de documento de identidad registrados (lista vacía si el backend no responde bien). */
  listarTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http
      .get<TiposDocumentoRespuesta>(`${this.api}/tipos-documento`)
      .pipe(map((respuesta) => (respuesta.success && respuesta.data ? respuesta.data : [])));
  }

  // ---------- Solicitudes ----------

  crearSolicitudEcaes(solicitud: SolicitudEcaesRequest): Observable<SolicitudEcaesResponse> {
    return this.http.post<SolicitudEcaesResponse>(this.apiUrl, solicitud);
  }

  listarSolicitudesPorRol(
    rol: string,
    idUsuario?: number,
    periodoAcademico?: string
  ): Observable<SolicitudEcaesResponse[]> {
    let params = new HttpParams().set('rol', rol);
    if (idUsuario) params = params.set('idUsuario', idUsuario.toString());
    if (periodoAcademico) params = params.set('periodoAcademico', periodoAcademico);
    return this.http.get<SolicitudEcaesResponse[]>(this.apiUrl, { params });
  }

  /** Pendientes del funcionario; sin período, el backend usa el actual. */
  listarSolicitudesFuncionario(periodoAcademico?: string): Observable<SolicitudEcaesResponse[]> {
    let params = new HttpParams().set('rol', 'funcionario').set('bandeja', 'pendientes');
    if (periodoAcademico) params = params.set('periodoAcademico', periodoAcademico);
    return this.http.get<SolicitudEcaesResponse[]>(this.apiUrl, { params });
  }

  /** ECAES usa PUT /{id}/estado (EST-7, paso 6): el id va en la ruta y no en el cuerpo. */
  protected override cambiarEstado(idSolicitud: number, nuevoEstado: string, comentario?: string): Observable<unknown> {
    const body: { nuevoEstado: string; comentario?: string } = { nuevoEstado };
    if (comentario !== undefined) body.comentario = comentario;
    return this.http.put(`${this.apiUrl}/${idSolicitud}/estado`, body);
  }

  /** El funcionario aprueba: la solicitud pasa directamente a PRE_REGISTRADO. */
  approveRequest(idSolicitud: number): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'PRE_REGISTRADO');
  }

  rejectRequest(idSolicitud: number, motivo?: string): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'Rechazada', motivo || 'Solicitud rechazada por el funcionario');
  }
}
