import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, SolicitudCursoVerano, Inscripcion } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-ver-solicitud',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ...MATERIAL_IMPORTS],
  templateUrl: './ver-solicitud.component.html',
  styleUrls: ['./ver-solicitud.component.css']
})
export class VerSolicitudComponent implements OnInit {
  solicitudes: SolicitudCursoVerano[] = [];
  inscripciones: Inscripcion[] = [];
  cargando = true;
  usuario: any = null;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService
  ) {
    console.log('📋 SEGUIMIENTO COMPONENT CARGADO');
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.loadSeguimiento();
  }

  loadSeguimiento() {
    this.cargando = true;
    console.log('🔄 Cargando seguimiento completo...');
    
    // Cargar solicitudes (preinscripciones)
    if (this.usuario?.id_usuario) {
      this.cursosService.getSolicitudesUsuario(this.usuario.id_usuario).subscribe({
        next: (solicitudes) => {
          this.solicitudes = solicitudes;
          console.log('✅ Solicitudes cargadas:', solicitudes);
          this.loadInscripciones();
        },
        error: (err) => {
          console.error('❌ Error cargando solicitudes', err);
          this.loadInscripciones();
        }
      });
    } else {
      this.loadInscripciones();
    }
  }

  loadInscripciones() {
    this.cursosService.getInscripciones().subscribe({
      next: (inscripciones) => {
        this.inscripciones = inscripciones;
        console.log('✅ Inscripciones cargadas:', inscripciones);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando inscripciones', err);
        this.cargando = false;
      }
    });
  }

  getTotalActividades(): number {
    return this.solicitudes.length + this.inscripciones.length;
  }

}
