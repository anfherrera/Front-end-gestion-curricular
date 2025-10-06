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
    
    if (this.usuario?.id_usuario) {
      // Usar el nuevo endpoint que trae todo junto
      this.cursosService.getSeguimientoActividades(this.usuario.id_usuario).subscribe({
        next: (seguimiento) => {
          this.solicitudes = seguimiento.preinscripciones || [];
          this.inscripciones = seguimiento.inscripciones || [];
          this.cargando = false;
          console.log('✅ Seguimiento cargado:', seguimiento);
          console.log('📊 Preinscripciones:', this.solicitudes.length);
          console.log('📊 Inscripciones:', this.inscripciones.length);
        },
        error: (err) => {
          console.error('❌ Error cargando seguimiento', err);
          this.cargando = false;
        }
      });
    } else {
      this.cargando = false;
    }
  }


  getTotalActividades(): number {
    return this.solicitudes.length + this.inscripciones.length;
  }

}
