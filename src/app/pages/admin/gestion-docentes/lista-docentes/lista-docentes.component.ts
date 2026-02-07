import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DocentesService } from '../../../../core/services/docentes.service';
import { ErrorHandlerService } from '../../../../core/services/error-handler.service';
import { snackbarConfig } from '../../../../core/design-system/design-tokens';
import { DocenteDTORespuesta } from '../../../../core/models/docente.interface';
import { corregirEncodingObjeto } from '../../../../core/utils/encoding.utils';

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
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './lista-docentes.component.html',
  styleUrls: ['./lista-docentes.component.css']
})
export class ListaDocentesComponent implements OnInit {
  docentes: DocenteDTORespuesta[] = [];
  displayedColumns: string[] = ['id_docente', 'codigo_docente', 'nombre_docente', 'acciones'];
  loading = false;
  searchTerm = '';

  constructor(
    private docentesService: DocentesService,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

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
      error: (err) => {
        this.snackBar.open('Error al cargar la lista de docentes', 'Cerrar', snackbarConfig(['error-snackbar']));
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
      error: (err) => {
        this.snackBar.open('Error al buscar docentes', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.loading = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarDocentes();
  }

  eliminarDocente(docente: DocenteDTORespuesta): void {
    if (!confirm(`¿Está seguro de eliminar al docente "${docente.nombre_docente}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.loading = true;

    this.docentesService.eliminarDocente(docente.id_docente).subscribe({
      next: () => {
        this.loading = false;
        // Status 200 OK - Éxito
        this.snackBar.open('Docente eliminado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarDocentes();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        // Extraer mensaje de error usando el servicio
        const mensaje = this.errorHandler.extraerMensajeError(error);
        
        // Manejo de errores específicos
        if (this.errorHandler.esErrorDependencias(error) || error.status === 400) {
          // Error de dependencias (400) - Docente tiene cursos asignados
          this.snackBar.open(`${mensaje}`, 'Cerrar', snackbarConfig(['warning-snackbar']));
        } else if (error.status === 409) {
          // Conflicto (respaldo para compatibilidad)
          this.snackBar.open(`${mensaje}`, 'Cerrar', snackbarConfig(['warning-snackbar']));
        } else if (error.status === 404) {
          // Docente no encontrado
          this.snackBar.open('Docente no encontrado', 'Cerrar', snackbarConfig(['error-snackbar']));
        } else {
          // Otros errores (500, etc.)
          this.snackBar.open(`${mensaje}`, 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      }
    });
  }

  editarDocente(docente: DocenteDTORespuesta): void {
    this.router.navigate(['/admin/docentes/editar', docente.id_docente]);
  }

  crearDocente(): void {
    this.router.navigate(['/admin/docentes/crear']);
  }
}

