import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, PreinscripcionSeguimiento, InscripcionSeguimiento, SeguimientoActividades } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatDialog } from '@angular/material/dialog';
import { InscripcionModalComponent } from '../../../../shared/components/inscripcion-modal/inscripcion-modal.component';

@Component({
  selector: 'app-ver-solicitud',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ...MATERIAL_IMPORTS],
  templateUrl: './ver-solicitud.component.html',
  styleUrls: ['./ver-solicitud.component.css']
})
export class VerSolicitudComponent implements OnInit {
  preinscripciones: PreinscripcionSeguimiento[] = [];
  inscripciones: InscripcionSeguimiento[] = [];
  cargando = true;
  usuario: any = null;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
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
        next: (seguimiento: SeguimientoActividades) => {
          this.preinscripciones = seguimiento.preinscripciones || [];
          this.inscripciones = seguimiento.inscripciones || [];
          this.cargando = false;
          console.log('✅ Seguimiento cargado:', seguimiento);
          console.log('📊 Preinscripciones:', this.preinscripciones.length);
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
    return this.preinscripciones.length + this.inscripciones.length;
  }

  // 🆕 Método para obtener el texto de la acción según el estado
  getTextoAccion(acciones: string[]): string {
    if (!acciones || acciones.length === 0) return '';
    
    const accion = acciones[0]; // Tomar la primera acción disponible
    
    switch (accion) {
      case 'esperando_aprobacion':
        return 'Esperando aprobación';
      case 'esperando_inscripcion':
        return 'Esperando apertura de inscripciones';
      case 'proceder_inscripcion':
        return '📄 Inscribirse al Curso';
      case 'revisar_motivo_rechazo':
        return 'Ver motivo de rechazo';
      case 'esperando_aprobacion_curso':
        return 'Esperando aprobación del curso';
      case 'curso_aprobado_esperando_apertura':
        return 'Curso aprobado - Esperando apertura';
      default:
        return 'Sin acciones disponibles';
    }
  }

  // 🆕 Método para obtener el icono según la acción
  getIconoAccion(acciones: string[]): string {
    if (!acciones || acciones.length === 0) return 'info';
    
    const accion = acciones[0];
    
    switch (accion) {
      case 'esperando_aprobacion':
        return 'hourglass_empty';
      case 'esperando_inscripcion':
        return 'schedule';
      case 'proceder_inscripcion':
        return 'assignment_turned_in';
      case 'revisar_motivo_rechazo':
        return 'error';
      case 'esperando_aprobacion_curso':
        return 'hourglass_empty';
      case 'curso_aprobado_esperando_apertura':
        return 'check_circle';
      default:
        return 'info';
    }
  }

  // 🆕 Método para verificar si la acción es clickeable
  esAccionClickeable(acciones: string[]): boolean {
    if (!acciones || acciones.length === 0) return false;
    
    const accion = acciones[0];
    return accion === 'proceder_inscripcion' || accion === 'revisar_motivo_rechazo';
  }

  // 🆕 Método para manejar el clic en una acción
  manejarAccion(preinscripcion: PreinscripcionSeguimiento | InscripcionSeguimiento) {
    if (!preinscripcion.accionesDisponibles || preinscripcion.accionesDisponibles.length === 0) {
      return;
    }
    
    const accion = preinscripcion.accionesDisponibles[0];
    
    switch (accion) {
      case 'proceder_inscripcion':
        this.procederInscripcion(preinscripcion);
        break;
      case 'revisar_motivo_rechazo':
        this.revisarMotivoRechazo(preinscripcion.id);
        break;
      default:
        console.log('Acción no implementada:', accion);
    }
  }

  // 🆕 Método para proceder a la inscripción
  procederInscripcion(preinscripcion: PreinscripcionSeguimiento | InscripcionSeguimiento) {
    console.log('📄 Procediendo a inscripción para preinscripción:', preinscripcion);
    
    // Abrir modal de inscripción
    this.abrirModalInscripcion(preinscripcion);
  }

  // 🆕 Método para abrir el modal de inscripción
  private abrirModalInscripcion(preinscripcion: PreinscripcionSeguimiento | InscripcionSeguimiento) {
    console.log('🚀 Abriendo modal de inscripción para:', preinscripcion.curso);
    
    const dialogRef = this.dialog.open(InscripcionModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { preinscripcion: preinscripcion },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔍 Modal de inscripción cerrado con resultado:', result);
      if (result === true) {
        // La inscripción fue exitosa, recargar el seguimiento
        this.loadSeguimiento();
        console.log('✅ Inscripción completada, recargando seguimiento...');
      }
    });
  }

  // 🆕 Método para revisar motivo de rechazo
  revisarMotivoRechazo(id: number) {
    console.log('❌ Revisando motivo de rechazo para ID:', id);
    // TODO: Implementar modal o página para mostrar motivo de rechazo
  }

}
