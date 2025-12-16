import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { HistorialSolicitudesService, HistorialResponse, FiltrosHistorial, TipoSolicitud } from '../../../core/services/historial-solicitudes.service';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { UtfFixPipe } from '../../../shared/pipes/utf-fix.pipe';

@Component({
  selector: 'app-historial-completo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    PeriodoFiltroSelectorComponent,
    CardContainerComponent,
    UtfFixPipe
  ],
  templateUrl: './historial-completo.component.html',
  styleUrls: ['./historial-completo.component.css']
})
export class HistorialCompletoComponent implements OnInit, OnDestroy {
  filtrosForm: FormGroup;
  historial: HistorialResponse | null = null;
  loading = false;
  exportandoPDF = false;
  displayedColumns: string[] = [
    'id_solicitud',
    'nombre_solicitud',
    'categoria',
    'tipo_solicitud',
    'usuario',
    'periodo_academico',
    'estado_actual',
    'fecha_registro'
  ];

  tiposSolicitud: Array<{ codigo: string; display: string }> = [];
  estadosDisponibles: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private historialService: HistorialSolicitudesService,
    private snackBar: MatSnackBar
  ) {
    this.filtrosForm = this.fb.group({
      periodoAcademico: [''],
      tipoSolicitud: [''],
      estadoActual: ['']
    });

    this.tiposSolicitud = this.historialService.getTiposSolicitud();
    this.estadosDisponibles = this.historialService.getEstadosDisponibles();
  }

  ngOnInit(): void {
    this.cargarHistorial();

    // Suscribirse a cambios en los filtros con debounce
    this.filtrosForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cargarHistorial();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarHistorial(): void {
    this.loading = true;
    const filtros: FiltrosHistorial = {};

    const formValue = this.filtrosForm.value;
    if (formValue.periodoAcademico) {
      filtros.periodoAcademico = formValue.periodoAcademico;
    }
    if (formValue.tipoSolicitud) {
      filtros.tipoSolicitud = formValue.tipoSolicitud;
    }
    if (formValue.estadoActual) {
      filtros.estadoActual = formValue.estadoActual;
    }

    this.historialService.obtenerHistorialCompleto(filtros).subscribe({
      next: (response) => {
        this.historial = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.snackBar.open('Error al cargar el historial de solicitudes', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      periodoAcademico: '',
      tipoSolicitud: '',
      estadoActual: ''
    });
  }

  onPeriodoChange(periodo: string): void {
    this.filtrosForm.patchValue({ periodoAcademico: periodo || '' });
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('aprobada')) {
      return 'estado-aprobada';
    } else if (estadoLower.includes('rechazada')) {
      return 'estado-rechazada';
    } else if (estadoLower.includes('enviada')) {
      return 'estado-enviada';
    } else if (estadoLower.includes('proceso')) {
      return 'estado-proceso';
    }
    return 'estado-default';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Detecta el tipo de solicitud desde el nombre
   */
  detectarTipoSolicitud(nombreSolicitud: string): string {
    if (!nombreSolicitud) return 'N/A';
    if (nombreSolicitud.includes('Reingreso')) return 'Reingreso';
    if (nombreSolicitud.includes('Homologacion') || nombreSolicitud.includes('Homologación')) return 'Homologación';
    if (nombreSolicitud.includes('Paz y Salvo')) return 'Paz y Salvo';
    if (nombreSolicitud.includes('ECAES')) return 'ECAES';
    if (nombreSolicitud.includes('Curso Verano') || nombreSolicitud.includes('Curso Intersemestral')) return 'Cursos de Verano';
    return 'Otro';
  }

  /**
   * Obtiene el estado actual desde el array de estados
   */
  obtenerEstadoActual(solicitud: any): string {
    if (solicitud.estado_actual) {
      return solicitud.estado_actual;
    }
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual || 'N/A';
    }
    return 'N/A';
  }

  /**
   * Exporta el historial actual a PDF
   * IMPORTANTE: Usa los mismos filtros que están aplicados en la tabla del historial
   * para garantizar que el PDF contenga exactamente las mismas solicitudes que se muestran.
   * Si no hay filtros, el PDF incluirá todas las solicitudes del sistema.
   */
  exportarPDF(): void {
    this.exportandoPDF = true;

    // Construir filtros desde el formulario (los mismos que se usan para cargar el historial)
    // Esto garantiza que el PDF contenga las mismas solicitudes que se muestran en la tabla
    const filtros: FiltrosHistorial = {};
    const formValue = this.filtrosForm.value;

    // Solo agregar filtros que tengan valor (cadenas vacías no se envían)
    // Si no se envían filtros, el backend incluirá todas las solicitudes
    if (formValue.periodoAcademico) {
      filtros.periodoAcademico = formValue.periodoAcademico;
    }
    if (formValue.tipoSolicitud) {
      filtros.tipoSolicitud = formValue.tipoSolicitud;
    }
    if (formValue.estadoActual) {
      filtros.estadoActual = formValue.estadoActual;
    }

    this.historialService.exportarHistorialPDF(filtros).subscribe({
      next: (response) => {
        try {
          const { blob, filename } = response;
          
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          
          // Crear elemento <a> para descargar
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          
          // Simular click para descargar
          document.body.appendChild(link);
          link.click();
          
          // Limpiar
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('PDF exportado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } catch (error) {
          console.error('Error al procesar el PDF:', error);
          this.snackBar.open('Error al procesar el archivo PDF', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } finally {
          this.exportandoPDF = false;
        }
      },
      error: (err) => {
        console.error('Error al exportar PDF:', err);
        this.exportandoPDF = false;
        
        let mensaje = 'Error al exportar PDF';
        if (err.status === 401) {
          mensaje = 'No autorizado. Por favor, inicia sesión nuevamente';
        } else if (err.status === 403) {
          mensaje = 'No tienes permisos para exportar el historial';
        } else if (err.status === 500) {
          mensaje = 'Error del servidor al generar el PDF';
        } else if (err.status === 0) {
          mensaje = 'Error de conexión. Verifica tu conexión a internet';
        }
        
        this.snackBar.open(mensaje, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}


