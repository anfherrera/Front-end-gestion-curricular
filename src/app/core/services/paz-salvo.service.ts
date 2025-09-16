import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Solicitud, Archivo, Usuario } from '../models/procesos.model';
import { SolicitudStatusEnum } from '../enums/solicitud-status.enum';

export type ArchivoEstado = 'pendiente' | 'aprobado' | 'rechazado';

@Injectable({
  providedIn: 'root'
})
export class PazSalvoService {
  private solicitudes: Solicitud[] = [];
  private solicitudIdCounter = 1;

  private usuarioActual: Usuario = {
    id: 1,
    nombre_completo: 'Juan Pérez',
    rol: { id_rol: 2, nombre_rol: 'Estudiante' },
    codigo: '104612345678',
    correo: 'juan.perez@unicauca.edu.co'
  };

  constructor() {}

  // 📌 Subir archivo temporal
  uploadDocument(studentId: number, file: File, nombre: string): Observable<Archivo> {
    const archivo: Archivo = {
      nombre,
      originalName: file.name,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pendiente'
    };
    return of(archivo);
  }

  // 📌 Obtener solicitudes de un estudiante
  getStudentRequests(studentId: number): Observable<Solicitud[]> {
    return of(this.solicitudes.filter(s => s.usuario?.id === studentId));
  }

  // 📌 Crear y enviar solicitud
  sendRequest(studentId: number, archivos: Archivo[]): Observable<Solicitud> {
    if (!archivos || archivos.length === 0) {
      return throwError(() => 'No hay documentos para enviar');
    }

    const solicitud: Solicitud = {
      id: this.solicitudIdCounter++,
      nombre: 'Solicitud paz y salvo',
      fecha: new Date().toISOString().split('T')[0],
      estado: SolicitudStatusEnum.EN_REVISION_FUNCIONARIO,
      usuario: this.usuarioActual,
      archivos
    };

    this.solicitudes.push(solicitud);
    return of(solicitud);
  }

  // 📌 Obtener solicitudes pendientes según el rol
  getPendingRequests(role: 'secretaria' | 'funcionario' | 'coordinador'): Observable<Solicitud[]> {
    let estado: SolicitudStatusEnum;

    switch (role) {
      case 'secretaria': estado = SolicitudStatusEnum.EN_REVISION_SECRETARIA; break;
      case 'funcionario': estado = SolicitudStatusEnum.EN_REVISION_FUNCIONARIO; break;
      case 'coordinador': estado = SolicitudStatusEnum.EN_REVISION_COORDINADOR; break;
      default: return throwError(() => 'Rol no permitido para solicitudes pendientes');
    }

    return of(this.solicitudes.filter(s => s.estado === estado));
  }

  // 📌 Completar revisión de funcionario → pasa a coordinador
  completeValidation(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.EN_REVISION_COORDINADOR;
    return of(solicitud);
  }

  // 📌 Aprobar solicitud completa
  approveRequest(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.APROBADA;
    return of(solicitud);
  }

  // 📌 Rechazar solicitud completa
  rejectRequest(requestId: number, comentarios: string): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.RECHAZADA;
    solicitud.comentarios = comentarios;
    return of(solicitud);
  }

  // 📌 Aprobar un archivo individual
  approveDocument(requestId: number, nombreArchivo: string): Observable<Archivo> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    const archivo = solicitud.archivos?.find(a => a.nombre === nombreArchivo);
    if (!archivo) return throwError(() => 'Archivo no encontrado');

    archivo.estado = 'aprobado';
    return of(archivo);
  }

  // 📌 Rechazar un archivo individual
  rejectDocument(requestId: number, nombreArchivo: string): Observable<Archivo> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    const archivo = solicitud.archivos?.find(a => a.nombre === nombreArchivo);
    if (!archivo) return throwError(() => 'Archivo no encontrado');

    archivo.estado = 'rechazado';
    return of(archivo);
  }

  // 📌 Generar oficio
  generateOfficio(requestId: number): Observable<string> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    return of(`Oficio generado para solicitud #${requestId}`);
  }

  // 📌 Enviar oficio
  sendOfficio(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    solicitud.oficioUrl = `https://example.com/oficio/${solicitud.id}.pdf`;
    solicitud.estado = SolicitudStatusEnum.ENVIADA;
    return of(solicitud);
  }
}
