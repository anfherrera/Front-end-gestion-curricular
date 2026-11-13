import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { HttpErrorResponse } from '@angular/common/http';
import { Inject } from '@angular/core';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { EstudianteElegible } from '@core/models/cursos-intersemestrales.model';
import { UtfFixPipe } from '@shared/pipes/utf-fix.pipe';
import { LoggerService } from '@core/services/logger.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { descargarBlob } from '@core/utils/download.util';
import { SnackbarService } from '@core/services/snackbar.service';

// Componente del dialog para ver detalles de inscripción
@Component({
  selector: 'app-detalles-inscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    UtfFixPipe
  ],
  templateUrl: './detalles-inscripcion-dialog.component.html',
  styleUrl: './detalles-inscripcion-dialog.component.css'
})
export class DetallesInscripcionDialogComponent {
  private destroyRef = inject(DestroyRef);

  constructor(
    public dialogRef: MatDialogRef<DetallesInscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { estudiante: EstudianteElegible },
    private cursosService: CursosIntersemestralesService,
    private snackbar: SnackbarService,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {}

  async descargarComprobante(): Promise<void> {
    this.logger.debug('Descargando comprobante de pago');
    
    try {
      // Verificar si hay archivo de pago disponible en los datos del estudiante
      if (!this.data.estudiante.archivoPago || !this.data.estudiante.archivoPago.nombre) {
        this.snackbar.advertencia('No se encontró el archivo de comprobante');
        return;
      }
      
      const nombreArchivo = this.data.estudiante.archivoPago.nombre;
      
      // Usar id_inscripcion si está disponible, sino usar id_solicitud
      const idParaDescarga = this.data.estudiante.id_inscripcion || this.data.estudiante.id_solicitud;
      
      if (!idParaDescarga) {
        this.snackbar.error('Error: No se encontró ID para descargar comprobante');
        return;
      }
      
      // Usar el servicio de cursos intersemestrales
      this.cursosService.descargarComprobantePago(idParaDescarga).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (blob: Blob) => {
          this.logger.debug('Comprobante descargado exitosamente');
          
          // Verificar que el blob no esté vacío
          if (blob && blob.size > 0) {
            descargarBlob(blob, nombreArchivo);
            this.snackbar.exito('Comprobante descargado exitosamente');
          } else {
            this.snackbar.error('Error: El archivo PDF está vacío o corrupto');
          }
        },
        error: (error: HttpErrorResponse) => {
          this.logger.error('Error al descargar comprobante de pago', error);
          const mensajeError = this.errorHandler.extraerMensajeError(error);
          this.snackbar.error(mensajeError || 'Error al descargar el comprobante de pago');
        }
      });
    } catch (error) {
      this.logger.error('Error de conexión al descargar comprobante', error);
      this.snackbar.error('Error de conexión');
    }
  }

  confirmarInscripcion(): void {
    // Lógica para confirmar la inscripción
    this.dialogRef.close('inscrito');
  }
}
