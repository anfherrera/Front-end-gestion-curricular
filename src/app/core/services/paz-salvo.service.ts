// src/app/core/services/paz-salvo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SolicitudStatus } from '../models/solicitud-status.enum'; // tu enum actualizado

export interface Documento {
  id: number;
  nombre: string;
  fecha: string;
  url: string;
  aprobado?: boolean; // opcional
}

export interface Solicitud {
  id: number;
  fecha: string;
  estado: SolicitudStatus;
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

    // Buscar solicitud pendiente o crear una nueva
    let solicitud = this.solicitudes.find(s => s.estado === SolicitudStatus.Pendiente);
    if (!solicitud) {
      solicitud = {
        id: this.solicitudIdCounter++,
        fecha: new Date().toLocaleDateString(),
        estado: SolicitudStatus.Pendiente,
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
    const solicitud = this.solicitudes.find(s => s.estado === SolicitudStatus.Pendiente);
    if (solicitud) {
      solicitud.estado = SolicitudStatus.EnRevisionFuncionario;
      return of(solicitud);
    }
    throw new Error('No hay documentos para enviar');
  }

  // Obtener solicitudes pendientes por rol
  getPendingRequests(role: 'funcionario' | 'coordinador'): Observable<Solicitud[]> {
    let estado: SolicitudStatus;
    if (role === 'funcionario') estado = SolicitudStatus.EnRevisionFuncionario;
    if (role === 'coordinador') estado = SolicitudStatus.ValidacionCoordinador;
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

    solicitud.estado = SolicitudStatus.ValidacionCoordinador;
    return of(solicitud);
  }

  // Aprobar solicitud coordinador
  approveRequest(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    solicitud.estado = SolicitudStatus.EnviadoSecretaria;
    return of(solicitud);
  }

  // Rechazar solicitud
  rejectRequest(requestId: number, comentarios: string): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    solicitud.estado = SolicitudStatus.Rechazada;
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

    solicitud.estado = SolicitudStatus.Finalizada;
    solicitud.oficioUrl = `https://example.com/oficio/${solicitud.id}.pdf`; // mock
    return of(solicitud);
  }

}
