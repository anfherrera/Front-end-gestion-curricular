import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcesoDTOPeticion, ProcesoDTORespuesta } from '../models/proceso.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcesosService {
  private apiUrl = `${environment.apiUrl}/procesos`;

  constructor(private http: HttpClient) {}

  listarProcesos(): Observable<ProcesoDTORespuesta[]> {
    return this.http.get<ProcesoDTORespuesta[]>(`${this.apiUrl}/listarProcesos`);
  }

  crearProceso(proceso: ProcesoDTOPeticion): Observable<ProcesoDTORespuesta> {
    return this.http.post<ProcesoDTORespuesta>(`${this.apiUrl}/crearProceso`, proceso);
  }

  actualizarProceso(proceso: ProcesoDTOPeticion): Observable<ProcesoDTORespuesta> {
    return this.http.put<ProcesoDTORespuesta>(`${this.apiUrl}/actualizarProceso`, proceso);
  }

  actualizarEstado(id: number, estado: boolean): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/actualizarEstado/${id}`, { estado_proceso: estado });
  }

  eliminarProceso(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/eliminarProceso/${id}`);
  }
}
