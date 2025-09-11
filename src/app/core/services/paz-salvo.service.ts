// src/app/core/services/paz-salvo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Solicitud, Archivo } from '../models/procesos.model';
import { SolicitudStatusEnum } from '../models/solicitud-status.enum';

@Injectable({
  providedIn: 'root'
})
export class PazSalvoService {
  private solicitudes: Solicitud[] = [];
  private solicitudIdCounter = 1;

  constructor(private http: HttpClient) {}

  // 📌 Subir archivo (solo lo devolvemos, no creamos solicitud todavía)
  uploadDocument(studentId: number, file: File, nombre: string): Observable<Archivo> {
    const archivo: Archivo = {
      nombre,
      originalName: file.name,
      fecha: new Date().toLocaleDateString()
      // ❌ NO lo guardamos en this.solicitudes aquí, solo devolvemos el objeto
    };
    return of(archivo);
  }

  // 📌 Obtener solicitudes del estudiante
  getStudentRequests(studentId: number): Observable<Solicitud[]> {
    return of(this.solicitudes);
  }

  // 📌 Crear y enviar la solicitud con los archivos cargados
  sendRequest(studentId: number, archivos: Archivo[]): Observable<Solicitud> {
    if (!archivos || archivos.length === 0) {
      return throwError(() => 'No hay documentos para enviar');
    }

    const solicitud: Solicitud = {
      id: this.solicitudIdCounter++,
      nombre: 'Solicitud paz y salvo',
      fecha: new Date().toLocaleDateString(),
      estado: SolicitudStatusEnum.EN_REVISION_FUNCIONARIO,
      archivos
    };

    this.solicitudes.push(solicitud);
    return of(solicitud);
  }

  // 📌 Obtener solicitudes pendientes según el rol
  getPendingRequests(role: 'secretaria' | 'funcionario' | 'coordinador'): Observable<Solicitud[]> {
    let estado: SolicitudStatusEnum;
    if (role === 'secretaria') estado = SolicitudStatusEnum.EN_REVISION_SECRETARIA;
    if (role === 'funcionario') estado = SolicitudStatusEnum.EN_REVISION_FUNCIONARIO;
    if (role === 'coordinador') estado = SolicitudStatusEnum.EN_REVISION_COORDINADOR;
    return of(this.solicitudes.filter(s => s.estado === estado));
  }

  // 📌 Completar revisión de funcionario → pasa a coordinador
  completeValidation(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.EN_REVISION_COORDINADOR;
    return of(solicitud);
  }

  // 📌 Aprobar solicitud
  approveRequest(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.APROBADA;
    return of(solicitud);
  }

  // 📌 Rechazar solicitud
  rejectRequest(requestId: number, comentarios: string): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) return throwError(() => 'Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.RECHAZADA;
    solicitud.comentarios = comentarios;
    return of(solicitud);
  }

  // 📌 Generar oficio (simulación)
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
