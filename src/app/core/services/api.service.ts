import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5000/api/usuarios';

  login(correo: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { correo, password });
  }
}
