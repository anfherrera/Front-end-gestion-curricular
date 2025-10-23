import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgramaDTOPeticion, ProgramaDTORespuesta } from '../models/programa.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProgramasService {
  private apiUrl = `${environment.apiUrl}/programas`;

  constructor(private http: HttpClient) {}

  listarProgramas(): Observable<ProgramaDTORespuesta[]> {
    return this.http.get<ProgramaDTORespuesta[]>(`${this.apiUrl}/listarProgramas`);
  }

  buscarProgramaPorId(id: number): Observable<ProgramaDTORespuesta> {
    return this.http.get<ProgramaDTORespuesta>(`${this.apiUrl}/buscarProgramaPorId/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<ProgramaDTORespuesta> {
    const params = new HttpParams().set('codigo', codigo);
    return this.http.get<ProgramaDTORespuesta>(`${this.apiUrl}/buscarPorCodigo`, { params });
  }

  buscarPorNombre(nombre: string): Observable<ProgramaDTORespuesta[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<ProgramaDTORespuesta[]>(`${this.apiUrl}/buscarPorNombre`, { params });
  }

  crearPrograma(programa: ProgramaDTOPeticion): Observable<ProgramaDTORespuesta> {
    return this.http.post<ProgramaDTORespuesta>(`${this.apiUrl}/crearPrograma`, programa);
  }

  actualizarPrograma(programa: ProgramaDTOPeticion): Observable<ProgramaDTORespuesta> {
    return this.http.put<ProgramaDTORespuesta>(`${this.apiUrl}/actualizarPrograma`, programa);
  }

  eliminarPrograma(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/eliminarPrograma/${id}`);
  }
}

