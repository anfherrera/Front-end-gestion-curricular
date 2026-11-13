import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcesoDTOPeticion, ProcesoDTORespuesta } from '../models/proceso.interface';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcesosService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/procesos`;

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
