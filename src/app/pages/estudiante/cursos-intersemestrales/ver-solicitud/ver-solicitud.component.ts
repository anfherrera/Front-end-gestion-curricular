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
          console.log('=== 📊 DEBUGGING SEGUIMIENTO ===');
          console.log('📦 Respuesta completa:', seguimiento);
          console.log('📝 Preinscripciones:', seguimiento.preinscripciones);
          console.log('🎓 Inscripciones:', seguimiento.inscripciones);
          
          this.preinscripciones = seguimiento.preinscripciones || [];
          this.inscripciones = seguimiento.inscripciones || [];
          this.cargando = false;
          
          // Verificar cada preinscripción
          console.log('\n📊 INSCRIPCIONES DISPONIBLES:');
          this.inscripciones.forEach((insc: any, index: number) => {
            console.log(`  ${index + 1}. Curso ID: ${insc.cursoId}, Curso: ${insc.curso}, Estado: ${insc.estado}`);
            console.log(`  🔍 DEBUG - Objeto completo:`, insc);
          });
          
          console.log('\n📋 PREINSCRIPCIONES Y VALIDACIÓN:');
          this.preinscripciones.forEach((pre: PreinscripcionSeguimiento, index: number) => {
            console.log(`\n--- Preinscripción ${index + 1}: ${pre.curso} ---`);
            console.log('  • Curso ID:', pre.cursoId);
            console.log('  • Estado:', pre.estado);
            console.log('  • Estado Curso:', pre.estadoCurso);
            console.log('  • Acciones:', pre.accionesDisponibles);
            
            const inscripcionRelacionada = this.inscripciones.find((i: any) => {
              const idCurso = i.cursoId || i.id_curso || i.curso_id || i.idCurso;
              return idCurso === pre.cursoId;
            });
            if (inscripcionRelacionada) {
              const idCurso = (inscripcionRelacionada as any).cursoId || (inscripcionRelacionada as any).id_curso || (inscripcionRelacionada as any).curso_id;
              console.log(`  ⚠️ INSCRIPCIÓN ENCONTRADA:`, {
                cursoId: idCurso,
                estado: inscripcionRelacionada.estado,
                curso: inscripcionRelacionada.curso
              });
            } else {
              console.log('  ✓ No hay inscripción para este curso');
            }
            
            const mostrarBoton = this.mostrarBotonInscripcion(pre);
            console.log(`  ${mostrarBoton ? '✅ MOSTRAR' : '❌ OCULTAR'} botón de inscripción`);
          });
          
          console.log('\n=== ✅ FIN DEBUGGING ===\n');
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

  /**
   * Determina si debe mostrarse el botón "Inscribirse al Curso"
   * Solo se muestra si:
   * 1. La preinscripción está APROBADA
   * 2. El curso está en estado de INSCRIPCIÓN
   * 3. NO existe una inscripción activa para ese curso
   * 
   * @param preinscripcion - Datos de la preinscripción
   * @returns true si se debe mostrar el botón, false en caso contrario
   */
  mostrarBotonInscripcion(preinscripcion: PreinscripcionSeguimiento): boolean {
    // 1. Verificar que la preinscripción esté aprobada
    const estadoPreinscripcion = (preinscripcion.estado || '').toUpperCase();
    if (estadoPreinscripcion !== 'APROBADO') {
      return false;
    }
    
    // 2. Verificar que el curso esté en estado de inscripción
    const estadoCurso = (preinscripcion.estadoCurso || '').toUpperCase();
    if (estadoCurso !== 'INSCRIPCION') {
      return false;
    }
    
    // 3. Verificar que NO exista una inscripción activa para este curso
    const tieneInscripcionActiva = this.tieneInscripcionEnCurso(preinscripcion.cursoId);
    
    return !tieneInscripcionActiva;
  }

  /**
   * Verifica si existe una inscripción activa (no rechazada) para un curso
   * @param cursoId - ID del curso a verificar
   * @returns true si existe una inscripción activa, false en caso contrario
   */
  tieneInscripcionEnCurso(cursoId: number): boolean {
    if (!this.inscripciones || this.inscripciones.length === 0) {
      return false;
    }
    
    // Buscar inscripción por cursoId (manejo de diferentes nombres de campo del backend)
    const inscripcionEncontrada = this.inscripciones.find((insc: any) => {
      const idCursoInscripcion = insc.cursoId || insc.id_curso || insc.curso_id || insc.idCurso;
      return idCursoInscripcion === cursoId;
    });
    
    if (!inscripcionEncontrada) {
      return false; // No hay inscripción para este curso
    }
    
    // Verificar el estado de la inscripción (normalizar a mayúsculas y manejar guiones bajos)
    const estadoInscripcion = (inscripcionEncontrada.estado || '').toUpperCase().replace(/_/g, '_');
    
    // Estados que permiten re-inscripción (pago rechazado)
    const estadosRechazados = ['PAGO_RECHAZADO', 'PAGO RECHAZADO', 'RECHAZADO'];
    
    if (estadosRechazados.includes(estadoInscripcion)) {
      return false; // No considerarla como activa, permitir nueva inscripción
    }
    
    // Cualquier otro estado se considera inscripción activa
    return true;
  }

  /**
   * Obtiene el mensaje informativo cuando ya existe una inscripción
   * @param cursoId - ID del curso
   * @returns Mensaje descriptivo del estado de la inscripción
   */
  getMensajeInscripcionExistente(cursoId: number): string {
    const inscripcion = this.inscripciones.find((insc: any) => {
      const idCurso = insc.cursoId || insc.id_curso || insc.curso_id || insc.idCurso;
      return idCurso === cursoId;
    });
    
    if (!inscripcion) return '';
    
    const estado = (inscripcion.estado || '').toUpperCase().replace(/_/g, '_');
    
    if (estado.includes('PAGO') && estado.includes('VALIDADO')) {
      return 'Pago validado - Inscripción confirmada';
    } else if (estado.includes('INSCRITO')) {
      return 'Ya estás inscrito en este curso';
    } else if (estado.includes('ENVIADA') || estado.includes('ENVIADO')) {
      return 'Inscripción enviada - Esperando validación de pago';
    } else if (estado.includes('EN') && estado.includes('PROCESO')) {
      return 'Inscripción en proceso';
    }
    
    return 'Ya tienes una inscripción para este curso';
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
