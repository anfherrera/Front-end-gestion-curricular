import { DestroyRef, Directive, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';

import { Solicitud } from '@core/models/procesos.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { AuthService } from '@core/services/auth.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { categoriaEstado, comentarioDeRechazo, estadoActual, ultimoEstado } from '@core/utils/estado-solicitud.util';
import {
  DocumentoConComentario,
  VerComentariosDialogComponent,
  VerComentariosDialogData,
} from '@shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component';

/** Lo que las vistas del estudiante usan de la solicitud que devuelve el backend. */
export interface SolicitudDelEstudiante {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  estadosSolicitud?: { estado_actual: string; comentario?: string | null }[] | null;
  documentos?: DocumentoConComentario[] | null;
}

/**
 * Seguimiento de las solicitudes del estudiante (paz y salvo, homologación, reingreso y ECAES):
 * las lista, arma las filas de la tabla, abre los comentarios y detecta si la última fue rechazada.
 * Cada página dice cómo listar (`listar`) y, si hace falta, cómo armar la fila o ver los comentarios.
 */
@Directive()
export abstract class SeguimientoSolicitudesBase<S extends SolicitudDelEstudiante> implements OnInit {
  protected readonly snackbar = inject(SnackbarService);
  protected readonly authService = inject(AuthService);
  protected readonly errorHandler = inject(ErrorHandlerService);
  protected readonly destroyRef = inject(DestroyRef);
  // Sin readonly: los specs lo cambian por un espía (la página importa MatDialogModule y recibe el suyo)
  protected dialog = inject(MatDialog);

  usuario: UsuarioSesion | null = null;

  /** Filas de la tabla de seguimiento. */
  readonly solicitudes = signal<Solicitud[]>([]);
  /** Las solicitudes tal como llegaron, para los comentarios y el oficio. */
  solicitudesCompletas: S[] = [];

  /** Última solicitud si está rechazada (RECHAZADA, Rechazada…), para el aviso de la página. */
  readonly ultimaRechazada = computed(() => {
    const ultima = this.solicitudes().at(-1);
    return ultima && categoriaEstado(ultima.estado) === 'rechazada' ? ultima : null;
  });

  /** Pide al backend las solicitudes del estudiante. */
  protected abstract listar(usuario: UsuarioSesion): Observable<S[]>;

  /** Lo propio de cada página al iniciar; ya está cargado `usuario`. */
  protected alIniciar(): void {
    // Por defecto no hay nada más que preparar
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.alIniciar();
    this.listarSolicitudes();
  }

  listarSolicitudes(): void {
    const usuario = this.usuario;
    if (!usuario) {
      return;
    }
    this.listar(usuario)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.procesarSolicitudes(data),
        error: (err) =>
          this.snackbar.error(
            this.errorHandler.extraerMensajeError(err) ||
              'Error al cargar las solicitudes. Por favor, inténtelo de nuevo.'
          ),
      });
  }

  procesarSolicitudes(data: S[]): void {
    const lista = Array.isArray(data) ? data : [];
    this.solicitudesCompletas = lista;
    this.solicitudes.set(lista.map((sol) => this.aFila(sol)));
  }

  /** Fila de la tabla: el estado y el comentario son los del último registro del historial. */
  protected aFila(sol: S): Solicitud {
    return {
      id: sol.id_solicitud,
      nombre: sol.nombre_solicitud,
      fecha: sol.fecha_registro_solicitud, // ISO: la tabla la formatea con el pipe fecha
      estado: estadoActual(sol),
      comentarios: ultimoEstado(sol)?.comentario || '',
    };
  }

  obtenerSolicitudCompleta(idSolicitud: number): S | undefined {
    return this.solicitudesCompletas.find((sol) => sol.id_solicitud === idSolicitud);
  }

  /** Abre los comentarios de los documentos y el del último rechazo. */
  verComentarios(idSolicitud: number): void {
    const solicitud = this.obtenerSolicitudCompleta(idSolicitud);
    if (!solicitud) {
      this.snackbar.error('No se encontró la información de la solicitud');
      return;
    }
    if (!solicitud.documentos?.length) {
      this.snackbar.advertencia('No hay documentos asociados a esta solicitud');
      return;
    }
    this.abrirComentarios({
      titulo: `Comentarios - ${solicitud.nombre_solicitud}`,
      documentos: solicitud.documentos,
      comentarioRechazo: comentarioDeRechazo(solicitud),
    });
  }

  protected abrirComentarios(data: VerComentariosDialogData): void {
    this.dialog.open(VerComentariosDialogComponent, { width: '700px', panelClass: 'dialogo-comentarios', data });
  }
}
