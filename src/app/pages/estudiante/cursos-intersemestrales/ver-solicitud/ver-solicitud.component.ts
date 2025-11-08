import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { CursosIntersemestralesService, PreinscripcionSeguimiento, InscripcionSeguimiento, SeguimientoActividades, EstadoSolicitudDetalle } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { MatDialog } from '@angular/material/dialog';
import { InscripcionModalComponent } from '../../../../shared/components/inscripcion-modal/inscripcion-modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
      forkJoin({
        seguimiento: this.cursosService.getSeguimientoActividades(this.usuario.id_usuario),
        preinscripcionesDetalle: this.cursosService.getPreinscripcionesUsuario(this.usuario.id_usuario).pipe(
          catchError(error => {
            console.warn('⚠️ No se pudo obtener detalle de preinscripciones:', error);
            return of([]);
          })
        )
      }).subscribe({
        next: ({ seguimiento, preinscripcionesDetalle }) => {
          console.log('=== 📊 DEBUGGING SEGUIMIENTO ===');
          console.log('📦 Respuesta completa:', seguimiento);
          console.log('📝 Preinscripciones:', seguimiento.preinscripciones);
          console.log('🎓 Inscripciones:', seguimiento.inscripciones);
          console.log('📝 Detalle de preinscripciones (comentarios):', preinscripcionesDetalle);
          
          this.preinscripciones = this.enriquecerPreinscripciones(seguimiento.preinscripciones || [], preinscripcionesDetalle);
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
        this.revisarMotivoRechazo(preinscripcion);
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
  revisarMotivoRechazo(solicitud: PreinscripcionSeguimiento | InscripcionSeguimiento) {
    if (!solicitud) {
      return;
    }

    const comentario = this.getComentarioEstadoActual(solicitud);
    if (!comentario) {
      this.snackBar.open('No hay un motivo registrado para esta solicitud.', 'Cerrar', { duration: 4000 });
      return;
    }

    const ultimoEstado = this.getUltimoEstadoDetalle(solicitud);

    this.dialog.open(MotivoRechazoDialogComponent, {
      width: '420px',
      data: {
        titulo: this.esEstadoRechazadoTexto(solicitud.estado) ? 'Motivo del rechazo' : 'Observaciones del estado',
        motivo: comentario,
        estado: ultimoEstado?.estado || solicitud.estado,
        fecha: ultimoEstado?.fecha || solicitud.fecha,
        esRechazo: this.esEstadoRechazadoTexto(solicitud.estado)
      }
    });
  }

  getComentarioEstadoActual(solicitud: PreinscripcionSeguimiento | InscripcionSeguimiento): string | null {
    if (!solicitud) {
      return null;
    }

    const comentarioDirecto = this.extraerComentarioDirecto(solicitud);
    if (comentarioDirecto) {
      return comentarioDirecto;
    }

    const historial = this.obtenerHistorialEstados(solicitud);
    if (historial && historial.length > 0) {
      const comentarioHistorial = this.ordenarEstados(historial).find(estado => (this.normalizarTexto(estado.comentario) || '').length > 0);
      if (comentarioHistorial?.comentario) {
        return this.normalizarTexto(comentarioHistorial.comentario)!;
      }
    }

    if (this.esEstadoRechazadoTexto(solicitud.estado)) {
      return 'No se registró un motivo específico para este rechazo.';
    }

    return null;
  }

  getMotivoLabel(solicitud: PreinscripcionSeguimiento | InscripcionSeguimiento): string {
    const estado = (solicitud?.estado || '').toUpperCase();
    if (estado === 'RECHAZADO' || estado === 'PAGO_RECHAZADO') {
      return 'Motivo del rechazo';
    }
    if (estado === 'APROBADO' || estado === 'PAGO_VALIDADO') {
      return 'Observaciones';
    }
    return 'Motivo';
  }

  getMotivoClass(solicitud: PreinscripcionSeguimiento | InscripcionSeguimiento): string {
    return this.esEstadoRechazadoTexto(solicitud?.estado) ? 'motivo-rechazo' : 'motivo-informativo';
  }

  esEstadoRechazado(estado: string | undefined): boolean {
    return this.esEstadoRechazadoTexto(estado);
  }

  private esEstadoRechazadoTexto(estado: string | undefined): boolean {
    const evaluado = (estado || '').toUpperCase();
    return evaluado === 'RECHAZADO' || evaluado === 'PAGO_RECHAZADO';
  }

  private extraerComentarioDirecto(solicitud: any): string | null {
    const posiblesCampos = [
      solicitud?.comentarioEstado,
      solicitud?.comentario_estado,
      solicitud?.comentario,
      solicitud?.motivo,
      solicitud?.motivoRechazo,
      solicitud?.motivo_rechazo,
      solicitud?.ultimoComentario,
      solicitud?.ultimocomentario,
      solicitud?.ultimo_comentario,
      solicitud?.ultimaObservacion,
      solicitud?.ultima_observacion,
      solicitud?.comentarioUltimoEstado,
      solicitud?.comentario_ultimo_estado,
      solicitud?.motivoUltimoEstado,
      solicitud?.motivo_ultimo_estado,
      solicitud?.estadoActual?.comentario,
      solicitud?.estado_actual?.comentario,
      solicitud?.estado?.comentario,
      solicitud?.estadoActual?.motivo,
      solicitud?.estado_actual?.motivo,
      solicitud?.motivoEstadoActual,
      solicitud?.motivo_estado_actual,
      solicitud?.detalleEstado?.comentario,
      solicitud?.detalle_estado?.comentario
    ];

    const comentario = posiblesCampos
      .map(valor => this.normalizarTexto(valor))
      .find(valor => !!valor);

    if (comentario) {
      return comentario;
    }

    return this.buscarComentarioRecursivo(solicitud);
  }

  private normalizarTexto(valor: any): string | null {
    if (typeof valor === 'string') {
      const texto = valor.trim();
      return texto.length > 0 ? texto : null;
    }
    return null;
  }

  private obtenerHistorialEstados(solicitud: any): EstadoSolicitudDetalle[] | null {
    const candidatos = [
      solicitud?.estadoSolicitud,
      solicitud?.estado_solicitud,
      solicitud?.historialEstados,
      solicitud?.historial_estados,
      solicitud?.estados,
      solicitud?.estadoActual?.historial,
      solicitud?.estado_actual?.historial
    ];

    const historial = candidatos.find(lista => Array.isArray(lista) && lista.length > 0);
    if (!historial) {
      return null;
    }

    return historial.map((estado: any) => ({
      ...estado,
      estado: estado?.estado || estado?.nombre || estado?.status || '',
      fecha: estado?.fecha || estado?.fechaRegistro || estado?.fecha_registro || estado?.createdAt || estado?.updatedAt,
      comentario: estado?.comentario ?? estado?.observacion ?? estado?.motivo ?? estado?.motivoRechazo ?? estado?.motivo_rechazo ?? estado?.nota
    }));
  }

  private ordenarEstados(estados: EstadoSolicitudDetalle[]): EstadoSolicitudDetalle[] {
    return [...estados].sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return fechaB - fechaA;
    });
  }

  private getUltimoEstadoDetalle(solicitud: PreinscripcionSeguimiento | InscripcionSeguimiento): EstadoSolicitudDetalle | null {
    if (!solicitud?.estadoSolicitud || solicitud.estadoSolicitud.length === 0) {
      return null;
    }

    const estadosOrdenados = this.ordenarEstados(solicitud.estadoSolicitud);
    return estadosOrdenados[0] || null;
  }

  private enriquecerPreinscripciones(preinscripciones: PreinscripcionSeguimiento[], detalle: any[]): PreinscripcionSeguimiento[] {
    if (!preinscripciones || preinscripciones.length === 0) {
      return [];
    }
    if (!detalle || detalle.length === 0) {
      return preinscripciones;
    }

    return preinscripciones.map(pre => {
      const match = this.buscarDetallePreinscripcion(pre, detalle);
      if (!match) {
        return pre;
      }

      const comentarioDetallado = this.extraerComentarioDirecto(match);
      const historialDetalle = this.obtenerHistorialEstados(match);

      return {
        ...pre,
        comentarioEstado: comentarioDetallado || pre.comentarioEstado,
        estadoSolicitud: (pre.estadoSolicitud && pre.estadoSolicitud.length > 0) ? pre.estadoSolicitud : (historialDetalle || pre.estadoSolicitud)
      };
    });
  }

  private buscarDetallePreinscripcion(preinscripcion: PreinscripcionSeguimiento, detalle: any[]): any | null {
    const idPre = this.obtenerIdGenerico(preinscripcion);
    if (!idPre) {
      return null;
    }

    return detalle.find(item => this.obtenerIdGenerico(item) === idPre) || null;
  }

  private obtenerIdGenerico(valor: any): number | null {
    if (!valor) {
      return null;
    }

    const candidatos = [
      valor.id,
      valor.id_preinscripcion,
      valor.idPreinscripcion,
      valor.id_pre_inscripcion,
      valor.id_solicitud,
      valor.idSolicitud,
      valor.preinscripcionId,
      valor.preinscripcion_id,
      valor.solicitudId,
      valor.solicitud_id,
      valor.idPreinscripcionSolicitud,
      valor.id_preinscripcion_solicitud
    ];

    for (const candidato of candidatos) {
      const numero = Number(candidato);
      if (!isNaN(numero) && numero > 0) {
        return numero;
      }
    }

    if (typeof valor.codigo === 'string' && valor.codigo.trim().length > 0) {
      const numero = Number(valor.codigo.trim());
      if (!isNaN(numero)) {
        return numero;
      }
    }

    return null;
  }

  private buscarComentarioRecursivo(valor: any, visitados = new Set<any>()): string | null {
    if (!valor || typeof valor !== 'object') {
      return null;
    }

    if (visitados.has(valor)) {
      return null;
    }

    visitados.add(valor);

    const claves = Object.keys(valor);
    for (const clave of claves) {
      const contenido = valor[clave];
      if (typeof contenido === 'string') {
        const texto = this.normalizarTexto(contenido);
        if (
          texto &&
          (clave.toLowerCase().includes('motivo') ||
            clave.toLowerCase().includes('coment') ||
            clave.toLowerCase().includes('observ') ||
            clave.toLowerCase().includes('razon'))
        ) {
          return texto;
        }
      } else if (Array.isArray(contenido)) {
        for (const item of contenido) {
          const encontrado = this.buscarComentarioRecursivo(item, visitados);
          if (encontrado) {
            return encontrado;
          }
        }
      } else if (typeof contenido === 'object') {
        const encontrado = this.buscarComentarioRecursivo(contenido, visitados);
        if (encontrado) {
          return encontrado;
        }
      }
    }

    return null;
  }
}

@Component({
  selector: 'app-motivo-rechazo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <div mat-dialog-content class="motivo-dialog">
      <div class="motivo-dialog__encabezado" [ngClass]="{ 'motivo-dialog__encabezado--rechazo': data.esRechazo }">
        <mat-icon>{{ data.esRechazo ? 'error_outline' : 'info' }}</mat-icon>
        <div class="motivo-dialog__estado">
          <span class="motivo-dialog__estado-texto">{{ data.estado }}</span>
          <span *ngIf="data.fecha" class="motivo-dialog__fecha">{{ data.fecha }}</span>
        </div>
      </div>
      <p class="motivo-dialog__mensaje">{{ data.motivo }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Cerrar</button>
    </div>
  `,
  styles: [`
    .motivo-dialog {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .motivo-dialog__encabezado {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      color: #0d47a1;
      border-left: 4px solid #2196f3;
    }

    .motivo-dialog__encabezado--rechazo {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      color: #b71c1c;
      border-left-color: #f44336;
    }

    .motivo-dialog__encabezado mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .motivo-dialog__estado {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .motivo-dialog__estado-texto {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 13px;
    }

    .motivo-dialog__fecha {
      font-size: 12px;
      color: inherit;
      opacity: 0.8;
    }

    .motivo-dialog__mensaje {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #424242;
      word-break: break-word;
      white-space: pre-wrap;
    }
  `]
})
export class MotivoRechazoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { titulo: string; motivo: string; estado?: string; fecha?: string; esRechazo?: boolean }) {}
}
