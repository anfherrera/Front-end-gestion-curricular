import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, Inscripcion, SolicitudCursoVerano } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ...MATERIAL_IMPORTS],
  templateUrl: './inscripciones.component.html',
  styleUrls: ['./inscripciones.component.css']
})
export class InscripcionesComponent implements OnInit {
  inscripciones: Inscripcion[] = [];
  solicitudes: SolicitudCursoVerano[] = [];
  cargando = true;
  usuario: any = null;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService
  ) {
    console.log('📋 INSCRIPCIONES COMPONENT CARGADO');
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.loadInscripciones();
    this.loadSolicitudes();
  }

  loadInscripciones() {
    console.log('🔄 Cargando inscripciones...');
    this.cursosService.getInscripciones().subscribe({
      next: data => {
        this.inscripciones = data;
        console.log('✅ Inscripciones cargadas:', data);
        this.cargando = false;
      },
      error: err => {
        console.error('❌ Error cargando inscripciones', err);
        this.cargando = false;
      }
    });
  }

  loadSolicitudes() {
    if (!this.usuario?.id_usuario) {
      console.log('❌ No hay usuario logueado');
      return;
    }

    console.log('🔄 Cargando solicitudes del usuario:', this.usuario.id_usuario);
    this.cursosService.getSolicitudesUsuario(this.usuario.id_usuario).subscribe({
      next: data => {
        this.solicitudes = data;
        console.log('✅ Solicitudes cargadas:', data);
      },
      error: err => {
        console.error('❌ Error cargando solicitudes', err);
      }
    });
  }

  onCancelarInscripcion(inscripcion: Inscripcion) {
    if (!confirm(`¿Deseas cancelar la inscripción al curso ID ${inscripcion.cursoId}?`)) return;

    this.cursosService.cancelarInscripcion(inscripcion.id).subscribe({
      next: () => {
        alert('Inscripción cancelada correctamente');
        this.loadInscripciones();
      },
      error: err => console.error('Error cancelando inscripción', err)
    });
  }
}
