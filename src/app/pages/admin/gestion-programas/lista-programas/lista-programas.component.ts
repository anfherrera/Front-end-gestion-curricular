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

import { ProgramasService } from '@core/services/programas.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { ProgramaDTORespuesta } from '@core/models/programa.interface';
import { corregirEncodingObjeto } from '@core/utils/encoding.utils';
import { confirmar } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { filter } from 'rxjs';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-lista-programas',
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
  templateUrl: './lista-programas.component.html',
  styleUrls: ['./lista-programas.component.css']
})
export class ListaProgramasComponent implements OnInit {
  private programasService = inject(ProgramasService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  private readonly dialog = inject(MatDialog);
  programas: ProgramaDTORespuesta[] = [];
  displayedColumns: string[] = ['id_programa', 'codigo', 'nombre_programa', 'acciones'];
  loading = false;
  searchTerm = '';

  ngOnInit(): void {
    this.cargarProgramas();
  }

  cargarProgramas(): void {
    this.loading = true;
    
    this.programasService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: () => {
        this.snackbar.error('Error al cargar la lista de programas');
        this.loading = false;
      }
    });
  }

  buscarPorNombre(): void {
    if (!this.searchTerm.trim()) {
      this.cargarProgramas();
      return;
    }

    this.loading = true;
    this.programasService.buscarPorNombre(this.searchTerm).subscribe({
      next: (data) => {
        this.programas = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: () => {
        this.snackbar.error('Error al buscar programas');
        this.loading = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarProgramas();
  }

  eliminarPrograma(programa: ProgramaDTORespuesta): void {
    confirmar(this.dialog, {
      titulo: 'Eliminar programa', textoConfirmar: 'Eliminar', peligro: true,
      mensaje: `¿Está seguro de eliminar el programa "${programa.nombre_programa}"?\n\nEsta acción no se puede deshacer.`
    }).pipe(filter(Boolean)).subscribe(() => {
      this.loading = true;

      this.programasService.eliminarPrograma(programa.id_programa).subscribe({
        next: () => {
          this.loading = false;
          this.snackbar.exito('Programa eliminado exitosamente');
          this.cargarProgramas();
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
        
          // Extraer mensaje de error usando el servicio
          const mensaje = this.errorHandler.extraerMensajeError(error);
        
          // Determinar el tipo de error
          if (this.errorHandler.esErrorDependencias(error) || error.status === 400) {
            // Error de dependencias (400) - Programa tiene usuarios asociados
            this.snackbar.advertencia(`${mensaje}`);
          } else if (error.status === 404) {
            // No encontrado
            this.snackbar.error('Programa no encontrado');
          } else {
            // Otros errores
            this.snackbar.error(`${mensaje}`);
          }
        }
      });
    });
  }

  editarPrograma(programa: ProgramaDTORespuesta): void {
    this.router.navigate(['/admin/programas/editar', programa.id_programa]);
  }

  crearPrograma(): void {
    this.router.navigate(['/admin/programas/crear']);
  }
}

