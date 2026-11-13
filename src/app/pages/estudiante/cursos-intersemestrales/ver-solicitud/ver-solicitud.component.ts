import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { InscripcionModalComponent } from '../components/inscripcion-modal/inscripcion-modal.component';
import { MATERIAL_IMPORTS } from '@shared/components/material.imports';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { AuthService } from '@core/services/auth.service';
import {
  InscripcionSeguimiento,
  PreinscripcionSeguimiento,
  PreinscripcionUsuario
} from '@core/models/cursos-intersemestrales.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { MotivoRechazoDialogComponent, MotivoRechazoDialogData } from './motivo-rechazo-dialog.component';
import { SnackbarService } from '@core/services/snackbar.service';

type Actividad = PreinscripcionSeguimiento | InscripcionSeguimiento;

/** Texto e icono de la primera acción que el backend envía en `accionesDisponibles`. */
const ACCIONES: Record<string, { texto: string; icono: string }> = {
  esperando_aprobacion: { texto: 'Esperando aprobación', icono: 'hourglass_empty' },
  esperando_inscripcion: { texto: 'Esperando apertura de inscripciones', icono: 'schedule' },
  proceder_inscripcion: { texto: 'Inscribirse al Curso', icono: 'assignment_turned_in' },
  revisar_motivo_rechazo: { texto: 'Ver motivo de rechazo', icono: 'error' },
  esperando_aprobacion_curso: { texto: 'Esperando aprobación del curso', icono: 'hourglass_empty' },
  curso_aprobado_esperando_apertura: { texto: 'Curso aprobado - Esperando apertura', icono: 'check_circle' }
};

/** Estados de inscripción que permiten volver a inscribirse. */
const INSCRIPCION_RECHAZADA = ['PAGO_RECHAZADO', 'PAGO RECHAZADO', 'RECHAZADO'];

/**
 * Seguimiento de preinscripciones e inscripciones del estudiante.
 * /seguimiento no trae comentarios: el motivo de cada preinscripción sale de /preinscripciones/usuario.
 */
@Component({
  selector: 'app-ver-solicitud',
  imports: [CommonModule, CardContainerComponent, ...MATERIAL_IMPORTS],
  templateUrl: './ver-solicitud.component.html',
  styleUrls: ['./ver-solicitud.component.css']
})
export class VerSolicitudComponent implements OnInit {
  private cursosService = inject(CursosIntersemestralesService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);

  preinscripciones: PreinscripcionSeguimiento[] = [];
  inscripciones: InscripcionSeguimiento[] = [];
  cargando = true;
  usuario: UsuarioSesion | null = null;

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.loadSeguimiento();
  }

  loadSeguimiento(): void {
    const idUsuario = this.usuario?.id_usuario;
    if (!idUsuario) {
      this.cargando = false;
      return;
    }

    this.cargando = true;
    forkJoin({
      seguimiento: this.cursosService.getSeguimientoActividades(idUsuario),
      detalle: this.cursosService.getPreinscripcionesUsuario(idUsuario).pipe(catchError(() => of([])))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ seguimiento, detalle }) => {
        this.preinscripciones = conComentarios(seguimiento.preinscripciones || [], detalle);
        this.inscripciones = seguimiento.inscripciones || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  getTotalActividades(): number {
    return this.preinscripciones.length + this.inscripciones.length;
  }

  getTextoAccion(acciones: string[] | undefined): string {
    if (!acciones?.length) return '';
    return ACCIONES[acciones[0]]?.texto ?? 'Sin acciones disponibles';
  }

  getIconoAccion(acciones: string[] | undefined): string {
    if (!acciones?.length) return 'info';
    return ACCIONES[acciones[0]]?.icono ?? 'info';
  }

  esAccionClickeable(acciones: string[] | undefined): boolean {
    const accion = acciones?.[0];
    return accion === 'proceder_inscripcion' || accion === 'revisar_motivo_rechazo';
  }

  /** Botón "Inscribirse": preinscripción aprobada, curso en inscripción y sin inscripción activa. */
  mostrarBotonInscripcion(preinscripcion: PreinscripcionSeguimiento): boolean {
    return (preinscripcion.estado || '').toUpperCase() === 'APROBADO'
      && (preinscripcion.estadoCurso || '').toUpperCase() === 'INSCRIPCION'
      && !this.tieneInscripcionEnCurso(preinscripcion.cursoId);
  }

  /** Hay una inscripción al curso que no fue rechazada. */
  tieneInscripcionEnCurso(cursoId: number): boolean {
    const inscripcion = this.inscripcionDelCurso(cursoId);
    if (!inscripcion) return false;
    return !INSCRIPCION_RECHAZADA.includes((inscripcion.estado || '').toUpperCase());
  }

  getMensajeInscripcionExistente(cursoId: number): string {
    const inscripcion = this.inscripcionDelCurso(cursoId);
    if (!inscripcion) return '';

    const estado = (inscripcion.estado || '').toUpperCase();
    if (estado.includes('PAGO') && estado.includes('VALIDADO')) return 'Pago validado - Inscripción confirmada';
    if (estado.includes('INSCRITO')) return 'Ya estás inscrito en este curso';
    if (estado.includes('ENVIADA') || estado.includes('ENVIADO')) return 'Inscripción enviada - Esperando validación de pago';
    if (estado.includes('EN') && estado.includes('PROCESO')) return 'Inscripción en proceso';
    return 'Ya tienes una inscripción para este curso';
  }

  private inscripcionDelCurso(cursoId: number): InscripcionSeguimiento | undefined {
    return this.inscripciones.find(insc => insc.cursoId === cursoId);
  }

  manejarAccion(actividad: Actividad): void {
    const accion = actividad.accionesDisponibles?.[0];
    if (accion === 'proceder_inscripcion') {
      this.abrirModalInscripcion(actividad);
    } else if (accion === 'revisar_motivo_rechazo') {
      this.revisarMotivoRechazo(actividad);
    }
  }

  private abrirModalInscripcion(preinscripcion: Actividad): void {
    this.dialog.open(InscripcionModalComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { preinscripcion },
      disableClose: true
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result === true) {
          this.loadSeguimiento();
        }
      });
  }

  revisarMotivoRechazo(actividad: Actividad): void {
    const motivo = this.getComentarioEstadoActual(actividad);
    if (!motivo) {
      this.snackbar.info('No hay un motivo registrado para esta solicitud.');
      return;
    }

    const esRechazo = this.esEstadoRechazado(actividad.estado);
    this.dialog.open(MotivoRechazoDialogComponent, {
      width: '420px',
      data: {
        titulo: esRechazo ? 'Motivo del rechazo' : 'Observaciones del estado',
        motivo,
        estado: actividad.estado,
        fecha: actividad.fecha,
        esRechazo
      } as MotivoRechazoDialogData
    });
  }

  getComentarioEstadoActual(actividad: Actividad): string | null {
    const comentario = actividad.comentarioEstado?.trim();
    if (comentario) return comentario;
    return this.esEstadoRechazado(actividad.estado)
      ? 'No se registró un motivo específico para este rechazo.'
      : null;
  }

  getMotivoLabel(actividad: Actividad): string {
    const estado = (actividad.estado || '').toUpperCase();
    if (estado === 'RECHAZADO' || estado === 'PAGO_RECHAZADO') return 'Motivo del rechazo';
    if (estado === 'APROBADO' || estado === 'PAGO_VALIDADO') return 'Observaciones';
    return 'Motivo';
  }

  getMotivoClass(actividad: Actividad): string {
    return this.esEstadoRechazado(actividad.estado) ? 'motivo-rechazo' : 'motivo-informativo';
  }

  esEstadoRechazado(estado: string | undefined): boolean {
    const valor = (estado || '').toUpperCase();
    return valor === 'RECHAZADO' || valor === 'PAGO_RECHAZADO';
  }
}

/** Agrega a cada preinscripción el comentario de su último estado (mismo id de solicitud). */
function conComentarios(preinscripciones: PreinscripcionSeguimiento[], detalle: PreinscripcionUsuario[]): PreinscripcionSeguimiento[] {
  const comentarios = new Map(detalle.map(d => [d.id, d.comentarioEstado?.trim()]));
  return preinscripciones.map(pre => {
    const comentario = comentarios.get(pre.id);
    return comentario ? { ...pre, comentarioEstado: comentario } : pre;
  });
}
