import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolDTOPeticion, RolDTORespuesta } from '../models/rol.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolesAdminService {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  listarRoles(): Observable<RolDTORespuesta[]> {
    return this.http.get<RolDTORespuesta[]>(`${this.apiUrl}/listarRoles`);
  }

  buscarRolPorId(id: number): Observable<RolDTORespuesta> {
    return this.http.get<RolDTORespuesta>(`${this.apiUrl}/buscarRolPorId/${id}`);
  }

  buscarPorNombre(nombre: string): Observable<RolDTORespuesta> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<RolDTORespuesta>(`${this.apiUrl}/buscarPorNombre`, { params });
  }

  crearRol(rol: RolDTOPeticion): Observable<RolDTORespuesta> {
    return this.http.post<RolDTORespuesta>(`${this.apiUrl}/crearRol`, rol);
  }

  actualizarRol(rol: RolDTOPeticion): Observable<RolDTORespuesta> {
    return this.http.put<RolDTORespuesta>(`${this.apiUrl}/actualizarRol`, rol);
  }

  eliminarRol(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/eliminarRol/${id}`);
  }
}

