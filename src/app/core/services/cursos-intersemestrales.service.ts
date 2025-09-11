import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://tu-backend.com/api/cursos-intersemestrales';

  constructor(private http: HttpClient) {}

  // 🔹 ====== SOLICITUDES ======
  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/solicitudes`);
  }

  crearSolicitud(payload: CreateSolicitudDTO): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.apiUrl}/solicitudes`, payload);
  }

  getSolicitud(id: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiUrl}/solicitudes/${id}`);
  }

  actualizarSolicitud(id: number, payload: UpdateSolicitudDTO): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.apiUrl}/solicitudes/${id}`, payload);
  }

  eliminarSolicitud(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/solicitudes/${id}`);
  }

  // 🔹 Obtener la solicitud de un estudiante específico (vista "ver-solicitud")
  getSolicitudEstudiante(estudianteId: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiUrl}/solicitudes/estudiante/${estudianteId}`);
  }

  // 🔹 ====== INSCRIPCIONES ======
  getInscripciones(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${this.apiUrl}/inscripciones`);
  }

  crearInscripcion(payload: CreateInscripcionDTO): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${this.apiUrl}/inscripciones`, payload);
  }

  cancelarInscripcion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/inscripciones/${id}`);
  }

  // 🔹 ====== CURSOS ====== 
  getCursosOfertados(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/ofertados`);
  }

  getCursosPreinscripcion(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/preinscripcion`);
  }

  getCursosInscritos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/inscritos`);
  }
}
