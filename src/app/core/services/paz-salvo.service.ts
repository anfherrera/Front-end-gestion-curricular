// src/app/core/services/paz-salvo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

interface Documento {
  id: number;
  nombre: string;
  fecha: string;
  url: string;
}

interface Solicitud {
  id: number;
  fecha: string;
  estado: string;
  documentos: Documento[];
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
      url: URL.createObjectURL(file) // solo para demo, genera un link temporal
    };
    // Buscar solicitud pendiente del estudiante o crear temporal
    let solicitud = this.solicitudes.find(s => s.estado === 'Pendiente');
    if (!solicitud) {
      solicitud = {
        id: this.solicitudIdCounter++,
        fecha: new Date().toLocaleDateString(),
        estado: 'Pendiente',
        documentos: []
      };
      this.solicitudes.push(solicitud);
    }
    solicitud.documentos.push(doc);
    return of(doc);
  }

  // Obtener solicitudes del estudiante
  getStudentRequests(studentId: number): Observable<Solicitud[]> {
    return of(this.solicitudes);
  }

  // Enviar solicitud
  sendRequest(studentId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.estado === 'Pendiente');
    if (solicitud) {
      solicitud.estado = 'En Revisión Funcionario';
      return of(solicitud);
    }
    throw new Error('No hay documentos para enviar');
  }

  // Obtener solicitudes pendientes por rol
  getPendingRequests(role: 'funcionario' | 'coordinador'): Observable<Solicitud[]> {
    let estado = '';
    if (role === 'funcionario') estado = 'En Revisión Funcionario';
    if (role === 'coordinador') estado = 'Validación Coordinador';
    return of(this.solicitudes.filter(s => s.estado === estado));
  }

  // Revisar documento
  reviewDocument(requestId: number, documentId: number, aprobado: boolean): Observable<Documento> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');

    const doc = solicitud.documentos.find(d => d.id === documentId);
    if (!doc) throw new Error('Documento no encontrado');

    // Agregamos un campo temporal de status
    (doc as any).aprobado = aprobado;
    return of(doc);
  }

  // Terminar validación funcionario
  completeValidation(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');
    solicitud.estado = 'Validación Coordinador';
    return of(solicitud);
  }

  // Aprobar solicitud coordinador
  approveRequest(requestId: number): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');
    solicitud.estado = 'Enviado Secretaria';
    return of(solicitud);
  }

  // Rechazar solicitud
  rejectRequest(requestId: number, comentarios: string): Observable<Solicitud> {
    const solicitud = this.solicitudes.find(s => s.id === requestId);
    if (!solicitud) throw new Error('Solicitud no encontrada');
    solicitud.estado = 'Rechazada';
    (solicitud as any).comentarios = comentarios;
    return of(solicitud);
  }

  // Generar oficio preescrito (solo mock)
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
    solicitud.estado = 'Finalizada';
    return of(solicitud);
  }

}
