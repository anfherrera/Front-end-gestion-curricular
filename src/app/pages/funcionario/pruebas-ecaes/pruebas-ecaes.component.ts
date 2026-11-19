import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, viewChild, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, filter, switchMap } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { PruebasEcaesService, SolicitudEcaesResponse } from '@core/services/pruebas-ecaes.service';
import { DocumentoHomologacion, DocumentosDTORespuesta } from '@core/models/procesos.model';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { DocumentationViewerComponent } from '@shared/components/documentation-viewer/documentation-viewer.component';
import { SolicitudesBandejaComponent } from '@shared/components/solicitudes-bandeja/solicitudes-bandeja.component';
import { TextoDialogComponent, datosRechazo } from '@shared/components/texto-dialog/texto-dialog.component';
import { FechaPipe } from '@shared/pipes/fecha.pipe';
import { PublicarFechasEcaesComponent } from './publicar-fechas-ecaes/publicar-fechas-ecaes.component';

const TIPOS_DOCUMENTO: Record<string, string> = {
  CC: 'Cédula de Ciudadanía',
  CE: 'Cédula de Extranjería',
  TI: 'Tarjeta de Identidad',
  PA: 'Pasaporte',
  RC: 'Registro Civil',
};

/**
 * Funcionario, ECAES: revisa los pre-registros (los marca como pre-registrados o los
 * rechaza) y publica las fechas del período. El backend no tiene historial de ECAES,
 * así que la bandeja solo muestra las pendientes.
 */
@Component({
  selector: 'app-pruebas-ecaes-funcionario',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CardContainerComponent,
    DocumentationViewerComponent,
    SolicitudesBandejaComponent,
    PublicarFechasEcaesComponent,
    FechaPipe,
  ],
  templateUrl: './pruebas-ecaes.component.html',
  styleUrl: './pruebas-ecaes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PruebasEcaesFuncionarioComponent implements OnInit {
  readonly pruebasEcaesService = inject(PruebasEcaesService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bandeja = viewChild<SolicitudesBandejaComponent<SolicitudEcaesResponse>>('bandeja');

  readonly pendientes = signal<SolicitudEcaesResponse[]>([]);
  readonly seleccionada = signal<SolicitudEcaesResponse | null>(null);

  ngOnInit(): void {
    this.cargarPendientes();
  }

  tipoDocumentoLabel(tipo: string | null | undefined): string {
    if (!tipo) return '-';
    return TIPOS_DOCUMENTO[tipo.toUpperCase()] || tipo;
  }

  cargarPendientes(): void {
    this.pruebasEcaesService
      .listarSolicitudesFuncionario()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sols) => {
          this.pendientes.set(sols);
          // La selección pasa a la copia nueva (con los comentarios al día)
          const actual = this.seleccionada();
          if (actual) {
            const nueva = sols.find((sol) => sol.id_solicitud === actual.id_solicitud) ?? null;
            this.seleccionada.set(nueva);
            if (!nueva) this.bandeja()?.resetSelection();
          }
        },
        error: (err) => this.mostrarError(err, 'Error al cargar solicitudes ECAES'),
      });
  }

  onSolicitudSeleccionada(solicitud: SolicitudEcaesResponse | null): void {
    this.seleccionada.set(solicitud);
  }

  onComentarioAgregado(event: { documento: DocumentoHomologacion | DocumentosDTORespuesta; comentario: string }): void {
    if (!event.documento.id_documento) {
      this.snackbar.error('Error: No se pudo identificar el documento');
      return;
    }
    this.pruebasEcaesService
      .agregarComentario(event.documento.id_documento, event.comentario)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.exito('Comentario añadido correctamente');
          this.cargarPendientes();
        },
        error: (err) => this.mostrarError(err, 'Error al añadir comentario'),
      });
  }

  /** Aprobar en ECAES es marcar la solicitud como pre-registrada. */
  aprobar(): void {
    const seleccionada = this.seleccionada();
    if (!seleccionada) return;
    this.decidir(
      this.pruebasEcaesService.approveRequest(seleccionada.id_solicitud),
      'Solicitud marcada como Pre-registrada exitosamente',
      'Error al aprobar solicitud'
    );
  }

  rechazar(): void {
    const id = this.seleccionada()?.id_solicitud;
    if (id === undefined) return;
    const rechazo$ = this.dialog
      .open(TextoDialogComponent, { width: '450px', data: datosRechazo() })
      .afterClosed()
      .pipe(
        filter((motivo: string | undefined): motivo is string => !!motivo),
        switchMap((motivo) => this.pruebasEcaesService.rejectRequest(id, motivo))
      );
    this.decidir(rechazo$, 'Solicitud rechazada exitosamente', 'Error al rechazar solicitud');
  }

  private decidir(decision$: Observable<unknown>, exito: string, error: string): void {
    decision$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.exito(exito);
        this.seleccionada.set(null);
        this.bandeja()?.resetSelection();
        this.cargarPendientes();
      },
      error: (err) => this.mostrarError(err, error),
    });
  }

  private mostrarError(err: unknown, porDefecto: string): void {
    this.snackbar.error(this.errorHandler.extraerMensajeError(err) || porDefecto);
  }
}
