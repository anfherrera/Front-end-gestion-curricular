import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UsuarioDTOPeticion, UsuarioDTORespuesta } from '../models/usuario.interface';
import { ApiEndpoints } from '../utils/api-endpoints';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = `${ApiEndpoints.BASE_URL}/usuarios`;

  constructor(private http: HttpClient) {}

  listarUsuarios(): Observable<UsuarioDTORespuesta[]> {
    return this.http.get<UsuarioDTORespuesta[]>(`${this.apiUrl}/listarUsuarios`);
  }

  buscarUsuarioPorId(id: number): Observable<UsuarioDTORespuesta> {
    return this.http.get<UsuarioDTORespuesta>(`${this.apiUrl}/buscarUsuarioPorId/${id}`);
  }

  crearUsuario(usuario: UsuarioDTOPeticion): Observable<UsuarioDTORespuesta> {
    return this.http.post<UsuarioDTORespuesta>(`${this.apiUrl}/crearUsuario`, usuario);
  }

  actualizarUsuario(usuario: UsuarioDTOPeticion): Observable<UsuarioDTORespuesta> {
    return this.http.put<UsuarioDTORespuesta>(`${this.apiUrl}/actualizarUsuario`, usuario);
  }

  eliminarUsuario(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/eliminarUsuario/${id}`);
  }

  actualizarEstado(id: number, estado: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstado/${id}`, { estado_usuario: estado });
  }
}

