import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, SolicitudCursoVerano } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-visualizar-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    CardContainerComponent,
    ...MATERIAL_IMPORTS
  ],
  templateUrl: './visualizar-solicitudes.component.html',
  styleUrls: ['./visualizar-solicitudes.component.css']
})
export class VisualizarSolicitudesComponent implements OnInit {
  solicitudes: SolicitudCursoVerano[] = [];
  cargando = true;
  filtroEstado = 'todos';

  constructor(
    private cursosService: CursosIntersemestralesService
  ) {
    console.log('📋 VISUALIZAR SOLICITUDES COMPONENT CARGADO');
  }

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.cargando = true;
    console.log('🔄 Cargando todas las solicitudes...');
    
    this.cursosService.getTodasLasSolicitudes().subscribe({
      next: (solicitudes: SolicitudCursoVerano[]) => {
        this.solicitudes = solicitudes;
        console.log('✅ Solicitudes cargadas:', solicitudes);
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('❌ Error cargando solicitudes', err);
        this.cargando = false;
        // Datos de prueba si falla el backend
        this.solicitudes = [
          {
            id_solicitud: 1,
            nombre_solicitud: 'Solicitud de curso nuevo',
            fecha_solicitud: new Date(),
            estado: 'Pendiente',
            objUsuario: {
              id_usuario: 1,
              nombre: 'Juan',
              apellido: 'Pérez',
              email: 'juan.perez@unicauca.edu.co',
              telefono: '3001234567',
              codigo_estudiante: '104612345660',
              objRol: { id_rol: 1, nombre_rol: 'Estudiante' }
            },
            objCursoOfertadoVerano: {
              id_curso: 1,
              nombre_curso: 'Programación Avanzada',
              codigo_curso: 'PROG-301',
              descripcion: 'Curso de programación avanzada',
              fecha_inicio: new Date(),
              fecha_fin: new Date(),
              cupo_maximo: 25,
              cupo_disponible: 20,
              cupo_estimado: 25,
              espacio_asignado: 'Lab 301',
              estado: 'Abierto',
              objMateria: { 
                id_materia: 1, 
                nombre_materia: 'Programación',
                codigo_materia: 'PROG',
                creditos: 4
              },
              objDocente: { 
                id_usuario: 2, 
                nombre: 'María', 
                apellido: 'García',
                email: 'maria.garcia@unicauca.edu.co',
                telefono: '3007654321',
                objRol: { id_rol: 2, nombre_rol: 'Docente' }
              }
            },
            tipoSolicitud: 'PREINSCRIPCION'
          }
        ];
      }
    });
  }

  getSolicitudesFiltradas() {
    if (this.filtroEstado === 'todos') {
      return this.solicitudes;
    }
    return this.solicitudes.filter(s => s.estado === this.filtroEstado);
  }

  onAprobarSolicitud(solicitud: SolicitudCursoVerano) {
    console.log('✅ Aprobando solicitud:', solicitud.id_solicitud);
    // TODO: Implementar lógica de aprobación
  }

  onRechazarSolicitud(solicitud: SolicitudCursoVerano) {
    console.log('❌ Rechazando solicitud:', solicitud.id_solicitud);
    // TODO: Implementar lógica de rechazo
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Aprobado': return '#28a745';
      case 'Rechazado': return '#dc3545';
      case 'Pendiente': return '#ffc107';
      case 'Completado': return '#17a2b8';
      default: return '#6c757d';
    }
  }
}
