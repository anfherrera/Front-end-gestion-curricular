import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { PeriodoFiltroSelectorComponent } from '../../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { UtfFixPipe } from '../../../../shared/pipes/utf-fix.pipe';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { MateriaFiltro, SolicitudVisualizar } from '../../../../core/models/cursos-intersemestrales.model';
import { descargarBlob } from '../../../../core/utils/download.util';
import { snackbarConfig } from '../../../../core/design-system/design-tokens';

const TODAS_LAS_MATERIAS: MateriaFiltro = { id: 0, nombre: 'Todas las materias', codigo: 'TODAS' };

const CONDICIONES: Record<string, { texto: string; clase: string }> = {
  Primera_Vez: { texto: 'Primera Vez', clase: 'condicion-primera-vez' },
  PRIMERA_VEZ: { texto: 'Primera Vez', clase: 'condicion-primera-vez' },
  Repeticion: { texto: 'Repetición', clase: 'condicion-repitencia' },
  REPITENCIA: { texto: 'Repetición', clase: 'condicion-repitencia' },
  'REPETECIÓN': { texto: 'Repetición', clase: 'condicion-repitencia' },
  Homologacion: { texto: 'Habilitación', clase: 'condicion-habilitacion' },
  HABILITACION: { texto: 'Habilitación', clase: 'condicion-habilitacion' },
  'HABILITACIÓN': { texto: 'Habilitación', clase: 'condicion-habilitacion' },
  TRASLADO: { texto: 'Traslado', clase: 'condicion-traslado' },
  'Preinscripción': { texto: 'Preinscripción', clase: 'condicion-preinscripcion' }
};

const ESTADOS: Record<string, { texto: string; clase: string }> = {
  ENVIADA: { texto: 'Enviada', clase: 'estado-enviada' },
  APROBADO: { texto: 'Aprobado', clase: 'estado-aprobado' },
  RECHAZADO: { texto: 'Rechazado', clase: 'estado-rechazado' },
  PAGO_VALIDADO: { texto: 'Pago Validado', clase: 'estado-aprobado' },
  PAGO_RECHAZADO: { texto: 'Pago Rechazado', clase: 'estado-rechazado' }
};

/** Solicitudes de cursos intersemestrales filtradas por materia y período, con exportación a Excel. */
@Component({
  selector: 'app-visualizar-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardContainerComponent,
    PeriodoFiltroSelectorComponent,
    ...MATERIAL_IMPORTS,
    MatSnackBarModule,
    UtfFixPipe
  ],
  templateUrl: './visualizar-solicitudes.component.html',
  styleUrls: ['./visualizar-solicitudes.component.css']
})
export class VisualizarSolicitudesComponent implements OnInit {
  solicitudesFiltradas: SolicitudVisualizar[] = [];
  materias: MateriaFiltro[] = [];
  cargando = true;
  exportando = false;
  periodoFiltro = 'todos';

  filtroForm: FormGroup;

  private destroyRef = inject(DestroyRef);

  constructor(
    private cursosService: CursosIntersemestralesService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // 0 = "Todas las materias"
    this.filtroForm = this.fb.group({ materia: [0] });
  }

  ngOnInit(): void {
    this.cargarMaterias();
    this.cargarSolicitudes();
    this.filtroForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarSolicitudes());
  }

  /** El backend ya incluye "Todas las materias" (id 0). */
  cargarMaterias(): void {
    this.cursosService.getMateriasFiltro()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (materias) => this.materias = materias,
        error: () => this.materias = [TODAS_LAS_MATERIAS]
      });
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    const idMateria = this.filtroForm.value.materia || undefined;

    this.cursosService.getSolicitudesVisualizar(idMateria, this.periodoFiltro)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (solicitudes) => {
          this.solicitudesFiltradas = solicitudes;
          this.cargando = false;
        },
        error: () => {
          this.solicitudesFiltradas = [];
          this.cargando = false;
        }
      });
  }

  onPeriodoChange(periodo: string): void {
    this.periodoFiltro = periodo;
    this.cargarSolicitudes();
  }

  getCondicionTexto(condicion: string): string {
    return CONDICIONES[condicion]?.texto ?? condicion;
  }

  getCondicionClass(condicion: string): string {
    return CONDICIONES[condicion]?.clase ?? 'condicion-default';
  }

  getEstadoTexto(estado: string): string {
    return ESTADOS[estado?.toUpperCase()]?.texto ?? (estado || 'Sin estado');
  }

  getEstadoClass(estado: string): string {
    return ESTADOS[estado?.toUpperCase()]?.clase ?? 'estado-default';
  }

  /**
   * Excel de las solicitudes del período. El endpoint no filtra por materia
   * (solo por curso), así que el filtro de materia no se aplica a la exportación.
   */
  exportarSolicitudesExcel(): void {
    this.exportando = true;
    this.cursosService.exportarSolicitudesExcel(this.periodoFiltro)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (archivo) => {
          descargarBlob(archivo.blob, archivo.filename);
          this.snackBar.open('Excel descargado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
          this.exportando = false;
        },
        error: (error: HttpErrorResponse | Error) => {
          this.exportando = false;
          const porDefecto = 'Error al exportar las solicitudes. Por favor, intente nuevamente.';
          const mostrar = (mensaje: string) => this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['error-snackbar']));
          if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
            error.error.text().then(texto => {
              try {
                mostrar(JSON.parse(texto).message || porDefecto);
              } catch {
                mostrar(porDefecto);
              }
            });
          } else {
            mostrar(error.message || porDefecto);
          }
        }
      });
  }
}
