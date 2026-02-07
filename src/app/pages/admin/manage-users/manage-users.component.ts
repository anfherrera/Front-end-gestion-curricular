import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { snackbarConfig } from '../../../core/design-system/design-tokens';
import { corregirEncodingObjeto } from '../../../core/utils/encoding.utils';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css'
})
export class ManageUsersComponent implements OnInit {
  usuarios: any[] = [];
  displayedColumns: string[] = ['id_usuario', 'nombre_completo', 'correo', 'rol', 'estado', 'acciones'];
  loading = false;
  searchTerm = '';

  constructor(
    private usuariosService: UsuariosService,
    private errorHandler: ErrorHandlerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    
    this.usuariosService.listarUsuarios().subscribe({
      next: (data: any) => {
        // Corregir encoding de caracteres especiales (tildes, ñ, etc.)
        this.usuarios = corregirEncodingObjeto(data);
        this.loading = false;
      },
      error: (err: any) => {
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.loading = false;
      }
    });
  }

  buscar(): void {
    if (!this.searchTerm.trim()) {
      this.cargarUsuarios();
      return;
    }

    this.loading = true;
    const usuariosFiltrados = this.usuarios.filter(u => 
      u.nombre_completo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    
    this.usuarios = usuariosFiltrados;
    this.loading = false;
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarUsuarios();
  }

  /**
   * Cambia el estado de un usuario (activo <-> inactivo)
   */
  cambiarEstado(usuario: any): void {
    const nuevoEstado = !usuario.estado_usuario ? 'activar' : 'desactivar';
    
    // Confirmación antes de cambiar el estado
    if (!confirm(`¿Estás seguro de ${nuevoEstado} a ${usuario.nombre_completo}?`)) {
      return;
    }

    this.loading = true;

    this.usuariosService.cambiarEstadoUsuario(usuario.id_usuario).subscribe({
      next: (response) => {
        this.loading = false;
        // Actualizar el estado en la tabla sin recargar toda la lista
        usuario.estado_usuario = response.estado_usuario;
        
        // Mostrar mensaje de éxito
        this.snackBar.open(`Usuario ${nuevoEstado}do exitosamente`, 'Cerrar', snackbarConfig(['success-snackbar']));
      },
      error: (error: any) => {
        this.loading = false;
        
        // Mostrar mensaje de error
        this.snackBar.open('Error al cambiar el estado del usuario', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  eliminarUsuario(usuario: any): void {
    if (!confirm(`¿Está seguro de ELIMINAR al usuario "${usuario.nombre_completo}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.loading = true;

    this.usuariosService.eliminarUsuario(usuario.id_usuario).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Usuario eliminado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarUsuarios();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        
        // Extraer mensaje de error usando el servicio
        const mensaje = this.errorHandler.extraerMensajeError(error);
        
        // Determinar el tipo de error para mostrar el color correcto
        if (this.errorHandler.esErrorDependencias(error)) {
          // Error de dependencias (400) - Naranja/Advertencia
          this.snackBar.open(`${mensaje}`, 'Cerrar', snackbarConfig(['warning-snackbar']));
        } else if (error.status === 404) {
          // No encontrado
          this.snackBar.open('Usuario no encontrado', 'Cerrar', snackbarConfig(['error-snackbar']));
        } else {
          // Otros errores
          this.snackBar.open(`${mensaje}`, 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      }
    });
  }

  getRolChipColor(rol: string): string {
    const rolLower = rol?.toLowerCase() || '';
    if (rolLower.includes('admin')) return 'warn';
    if (rolLower.includes('coordinador')) return 'accent';
    if (rolLower.includes('funcionario')) return 'primary';
    return '';
  }

  getRolClass(rol: string): string {
    const rolLower = rol?.toLowerCase() || '';
    if (rolLower.includes('admin')) return 'rol-admin';
    if (rolLower.includes('coordinador')) return 'rol-coordinador';
    if (rolLower.includes('funcionario')) return 'rol-funcionario';
    if (rolLower.includes('estudiante')) return 'rol-estudiante';
    if (rolLower.includes('secretaria')) return 'rol-secretaria';
    if (rolLower.includes('docente')) return 'rol-docente';
    return 'rol-default';
  }
}
