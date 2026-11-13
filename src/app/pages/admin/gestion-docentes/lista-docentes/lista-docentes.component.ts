import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DocentesService } from '@core/services/docentes.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { DocenteDTORespuesta } from '@core/models/docente.interface';
import { corregirEncodingObjeto } from '@core/utils/encoding.utils';
import { confirmar } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { filter } from 'rxjs';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-lista-docentes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './lista-docentes.component.html',
  styleUrls: ['./lista-docentes.component.css']
})
export class ListaDocentesComponent implements OnInit {
  private docentesService = inject(DocentesService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  docentes: DocenteDTORespuesta[] = [];
  displayedColumns: string[] = ['id_docente', 'codigo_docente', 'nombre_docente', 'acciones'];
  loading = false;
  searchTerm = '';

  ngOnInit(): void {
    this.cargarDocentes();
  }

  cargarDocentes(): void {
    this.loading = true;
    
    this.docentesService.listarDocentes().subscribe({
      next: (data) => {
        this.docentes = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: () => {
        this.snackbar.error('Error al cargar la lista de docentes');
        this.loading = false;
      }
    });
  }

  buscarPorNombre(): void {
    if (!this.searchTerm.trim()) {
      this.cargarDocentes();
      return;
    }

    this.loading = true;
    this.docentesService.buscarPorNombre(this.searchTerm).subscribe({
      next: (data) => {
        this.docentes = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: () => {
        this.snackbar.error('Error al buscar docentes');
        this.loading = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarDocentes();
  }

  eliminarDocente(docente: DocenteDTORespuesta): void {
    confirmar(this.dialog, {
      titulo: 'Eliminar docente', textoConfirmar: 'Eliminar', peligro: true,
      mensaje: `¿Está seguro de eliminar al docente "${docente.nombre_docente}"?\n\nEsta acción no se puede deshacer.`
    }).pipe(filter(Boolean)).subscribe(() => {
      this.loading = true;

      this.docentesService.eliminarDocente(docente.id_docente).subscribe({
        next: () => {
          this.loading = false;
          // Status 200 OK - Éxito
          this.snackbar.exito('Docente eliminado exitosamente');
          this.cargarDocentes();
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;

          // Extraer mensaje de error usando el servicio
          const mensaje = this.errorHandler.extraerMensajeError(error);
        
          // Manejo de errores específicos
          if (this.errorHandler.esErrorDependencias(error) || error.status === 400) {
            // Error de dependencias (400) - Docente tiene cursos asignados
            this.snackbar.advertencia(`${mensaje}`);
          } else if (error.status === 409) {
            // Conflicto (respaldo para compatibilidad)
            this.snackbar.advertencia(`${mensaje}`);
          } else if (error.status === 404) {
            // Docente no encontrado
            this.snackbar.error('Docente no encontrado');
          } else {
            // Otros errores (500, etc.)
            this.snackbar.error(`${mensaje}`);
          }
        }
      });
    });
  }

  editarDocente(docente: DocenteDTORespuesta): void {
    this.router.navigate(['/admin/docentes/editar', docente.id_docente]);
  }

  crearDocente(): void {
    this.router.navigate(['/admin/docentes/crear']);
  }
}

