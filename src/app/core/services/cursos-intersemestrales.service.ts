import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../utils/api-endpoints';

// ================== MODELOS ==================
export interface Solicitud {
  id: number;
  fecha: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface Inscripcion {
  id: number;
  cursoId: number;
  estudianteId: number;
  fecha: string;
  estado: 'inscrito' | 'cancelado';
}

export interface Curso {
  id: number;
  nombre: string;
  cupos: number;
  docente: string;
  horario: string;
  tipo: 'ofertado' | 'preinscripcion' | 'inscrito';
}

// ================== DTOs ==================
// 🔹 Para crear solicitudes
export interface CreateSolicitudDTO {
  fecha: string;
  estado: 'pendiente';
}

// 🔹 Para actualizar solicitudes
export interface UpdateSolicitudDTO {
  fecha?: string;
  estado?: 'pendiente' | 'aprobada' | 'rechazada';
}

// 🔹 Para crear inscripciones
export interface CreateInscripcionDTO {
  cursoId: number;
  estudianteId: number;
  fecha: string;
  estado: 'inscrito' | 'cancelado';
}

// ================== SERVICIO ==================
@Injectable({
  providedIn: 'root',
})
export class CursosIntersemestralesService {
  constructor(private http: HttpClient) {}

  // 🔹 ====== SOLICITUDES ======
  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE);
  }

  crearSolicitud(payload: CreateSolicitudDTO): Observable<Solicitud> {
    return this.http.post<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE, payload);
  }

  getSolicitud(id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ID(id.toString()));
  }

  actualizarSolicitud(id: number, payload: UpdateSolicitudDTO): Observable<Solicitud> {
    return this.http.put<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ID(id.toString()), payload);
  }

  eliminarSolicitud(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ID(id.toString()));
  }

  // 🔹 Obtener la solicitud de un estudiante específico (vista "ver-solicitud")
  getSolicitudEstudiante(estudianteId: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ESTUDIANTE(estudianteId.toString()));
  }

  // 🔹 Aprobar/Rechazar solicitudes
  aprobarSolicitud(id: number): Observable<Solicitud> {
    return this.http.put<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.APROBAR(id.toString()), {});
  }

  rechazarSolicitud(id: number, motivo?: string): Observable<Solicitud> {
    return this.http.put<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.RECHAZAR(id.toString()), { motivo });
  }

  // 🔹 ====== INSCRIPCIONES ======
  getInscripciones(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`);
  }

  crearInscripcion(payload: CreateInscripcionDTO): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`, payload);
  }

  cancelarInscripcion(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${id}`);
  }

  // 🔹 ====== CURSOS ====== 
  getCursosOfertados(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/ofertados`);
  }

  getCursosPreinscripcion(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/preinscripcion`);
  }

  getCursosInscritos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/inscritos`);
  }

  // 🔹 ====== DOCUMENTOS ======
  getDocumentos(solicitudId: number): Observable<any[]> {
    return this.http.get<any[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.DOCUMENTOS(solicitudId.toString()));
  }

  uploadDocumento(solicitudId: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<any>(ApiEndpoints.CURSOS_INTERSEMESTRALES.UPLOAD_DOCUMENT(solicitudId.toString()), formData);
  }
}
