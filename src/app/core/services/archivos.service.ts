// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class ArchivosService {
//   private apiUrl = 'http://localhost:5000/api/archivos';

//   constructor(private http: HttpClient) {}

//   subirPDF(file: File): Observable<any> {
//     const formData = new FormData();
//     formData.append('file', file); // 👈 importante que coincida con @RequestParam("file")
//     return this.http.post<any>(`${this.apiUrl}/subir/pdf`, formData);
//   }
// }
//=====================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Archivo } from '../models/procesos.model';

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {
  private apiUrl = 'http://localhost:5000/api/archivos';

  constructor(private http: HttpClient) {}

  subirPDF(file: File): Observable<Archivo> {
    const formData = new FormData();
    formData.append('file', file); // 👈 debe coincidir con @RequestParam("file")

    // 👇 Recuperar token desde localStorage
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<Archivo>(`${this.apiUrl}/subir/pdf`, formData, { headers });
  }
}
