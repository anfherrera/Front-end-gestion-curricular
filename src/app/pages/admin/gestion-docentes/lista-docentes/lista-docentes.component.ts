import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DocentesService } from '../../../../core/services/docentes.service';
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
        console.error('Error al cargar docentes:', err);
        this.snackBar.open('Error al cargar la lista de docentes', 'Cerrar', { duration: 3000 });
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
        console.error('Error en búsqueda:', err);
        this.snackBar.open('Error al buscar docentes', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarDocentes();
  }

  eliminarDocente(docente: DocenteDTORespuesta): void {
    if (!confirm(`¿Está seguro de eliminar al docente "${docente.nombre_docente}"?`)) {
      return;
    }

    this.docentesService.eliminarDocente(docente.id_docente).subscribe({
      next: () => {
        this.snackBar.open('Docente eliminado exitosamente', 'Cerrar', { duration: 3000 });
        this.cargarDocentes();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.snackBar.open('Error al eliminar el docente', 'Cerrar', { duration: 3000 });
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

