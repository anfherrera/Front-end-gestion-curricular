import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, Solicitud } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-ver-solicitud',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ...MATERIAL_IMPORTS],
  templateUrl: './ver-solicitud.component.html',
  styleUrls: ['./ver-solicitud.component.css']
})
export class VerSolicitudComponent implements OnInit {
  solicitud: Solicitud | null = null;
  documentos: any[] = [];
  cargando = true;

  // Aquí simula el ID del estudiante actual, reemplazar con auth real
  estudianteId = 1;

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.loadSolicitud();
  }

  loadSolicitud() {
    this.cargando = true;
    this.cursosService.getSolicitudEstudiante(this.estudianteId).subscribe({
      next: (data) => {
        this.solicitud = data;
        if (data) {
          this.loadDocumentos(data.id);
        } else {
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error cargando la solicitud', err);
        this.cargando = false;
      }
    });
  }

  loadDocumentos(solicitudId: number) {
    this.cursosService.getDocumentos(solicitudId).subscribe({
      next: (docs) => {
        this.documentos = docs;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando documentos', err);
        this.cargando = false;
      }
    });
  }

  descargarDocumento(doc: any) {
    // Supone que doc tiene url o nombre
    window.open(doc.url, '_blank');
  }
}
