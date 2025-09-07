import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { HttpClientModule } from '@angular/common/http';
import { PazSalvoService } from '../../../core/services/paz-salvo.service';

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

@Component({
  selector: 'app-paz-salvo-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, HttpClientModule],
  providers: [PazSalvoService],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent {
  documentos: Documento[] = [];
  solicitudes: Solicitud[] = [];
  nuevoDocumentoNombre = '';
  nuevoDocumentoArchivo: File | null = null;

  constructor(private pazSalvoService: PazSalvoService) {}

  ngOnInit() {
    this.cargarSolicitudes();
  }

  onFileSelected(event: any) {
    this.nuevoDocumentoArchivo = event.target.files[0];
  }

  subirDocumento() {
    if (!this.nuevoDocumentoArchivo || !this.nuevoDocumentoNombre) return;

    this.pazSalvoService.uploadDocument(1, this.nuevoDocumentoArchivo, this.nuevoDocumentoNombre)
      .subscribe((doc: Documento) => {
        this.documentos.push(doc);
        this.nuevoDocumentoArchivo = null;
        this.nuevoDocumentoNombre = '';
      });
  }

  enviarSolicitud() {
    this.pazSalvoService.sendRequest(1).subscribe((solicitud: Solicitud) => {
      this.solicitudes.push(solicitud);
      this.documentos = [];
    });
  }

  cargarSolicitudes() {
    this.pazSalvoService.getStudentRequests(1)
      .subscribe((sols: Solicitud[]) => this.solicitudes = sols);
  }

  verDocumento(url: string) {
    window.open(url, '_blank');
  }

  verTodosLosDocumentos(documentos: Documento[]) {
    documentos.forEach(d => this.verDocumento(d.url));
  }
}
