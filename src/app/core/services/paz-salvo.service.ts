// src/app/core/services/paz-salvo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SolicitudStatusEnum } from '../models/solicitud-status.enum';

export interface Documento {
  id: number;
  nombre: string;
  fecha: string;
  url: string;
  aprobado?: boolean;
}

export interface Solicitud {
  id: number;
  fecha: string;
  estado: SolicitudStatusEnum;
  documentos: Documento[];
  comentarios?: string;
  oficioUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PazSalvoService {

  private solicitudes: Solicitud[] = [];
  private docIdCounter = 1;
  private solicitudIdCounter = 1;

  constructor(private http: HttpClient) {}

  // Subir documento
  uploadDocument(studentId: number, file: File, nombre: string): Observable<Documento> {
    const doc: Documento = {
      id: this.docIdCounter++,
      nombre,
      fecha: new Date().toLocaleDateString(),
      url: URL.createObjectURL(file)
    };

    // Buscar solicitud en revisión por funcionario o crear una nueva
    let solicitud = this.solicitudes.find(s => s.estado === SolicitudStatusEnum.EN_REVISION_FUNCIONARIO);
    if (!solicitud) {
      solicitud = {
        id: this.solicitudIdCounter++,
        fecha: new Date().toLocaleDateString(),
        estado: SolicitudStatusEnum.EN_REVISION_FUNCIONARIO,
        documentos: []
      };
      this.solicitudes.push(solicitud);
    }

    solicitud.documentos.push(doc);
    return of(doc);
  }

  // Obtener solicitudes de un estudiante
  getStudentRequests(studentId: number): Observable<Solicitud[]> {
    return of(this.solicitudes);
  }

  // Enviar solicitud
  sendRequest(studentId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.estado === SolicitudStatusEnum.EN_REVISION_FUNCIONARIO);
    if (solicitud) {
      solicitud.estado = SolicitudStatusEnum.EN_REVISION_FUNCIONARIO; // ya está en revisión por funcionario
      return of(solicitud);
    }
    throw new Error('No hay documentos para enviar');
  }

  // Obtener solicitudes pendientes por rol
  getPendingRequests(role: 'funcionario' | 'coordinador'): Observable<Solicitud[]> {
    let estado: SolicitudStatusEnum;
    if (role === 'funcionario') estado = SolicitudStatusEnum.EN_REVISION_FUNCIONARIO;
    if (role === 'coordinador') estado = SolicitudStatusEnum.EN_REVISION_COORDINADOR;
    return of(this.solicitudes.filter(s => s.estado === estado));
  }

  // Revisar documento
  reviewDocument(requestId: number, documentId: number, aprobado: boolean): Observable<Documento> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    const doc = solicitud.documentos.find(d => d.id === documentId);
    if (!doc) throw new Error('Documento no encontrado');

    doc.aprobado = aprobado;
    return of(doc);
  }

  // Terminar validación funcionario
  completeValidation(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.EN_REVISION_COORDINADOR;
    return of(solicitud);
  }

  // Aprobar solicitud coordinador
  approveRequest(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.ENVIADA;
    return of(solicitud);
  }

  // Rechazar solicitud
  rejectRequest(requestId: number, comentarios: string): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    solicitud.estado = SolicitudStatusEnum.RECHAZADA;
    solicitud.comentarios = comentarios;
    return of(solicitud);
  }

  // Generar oficio preescrito (mock)
  generateOfficio(requestId: number): Observable<string> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    const oficio = `Oficio preescrito para solicitud #${requestId} del estudiante.`;
    return of(oficio);
  }

  // Enviar oficio
  sendOfficio(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    solicitud.oficioUrl = `https://example.com/oficio/${solicitud.id}.pdf`; // mock
    solicitud.estado = SolicitudStatusEnum.ENVIADA;
    return of(solicitud);
  }

}
