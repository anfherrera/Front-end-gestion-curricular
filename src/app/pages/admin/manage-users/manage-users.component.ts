import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { UsuariosService } from '@core/services/usuarios.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { corregirEncodingObjeto } from '@core/utils/encoding.utils';
import { confirmar } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { filter } from 'rxjs';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-manage-users',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css'
})
export class ManageUsersComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);

  private readonly dialog = inject(MatDialog);
  usuarios: any[] = [];
  displayedColumns: string[] = ['id_usuario', 'nombre_completo', 'correo', 'rol', 'estado', 'acciones'];
  loading = false;
  searchTerm = '';

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
      error: () => {
        this.snackbar.error('Error al cargar usuarios');
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
    
    confirmar(this.dialog, {
      titulo: !usuario.estado_usuario ? 'Activar usuario' : 'Desactivar usuario',
      textoConfirmar: !usuario.estado_usuario ? 'Activar' : 'Desactivar',
      peligro: !!usuario.estado_usuario,
      mensaje: `¿Estás seguro de ${nuevoEstado} a ${usuario.nombre_completo}?`
    }).pipe(filter(Boolean)).subscribe(() => {
      this.loading = true;

      this.usuariosService.cambiarEstadoUsuario(usuario.id_usuario).subscribe({
        next: (response) => {
          this.loading = false;
          // Actualizar el estado en la tabla sin recargar toda la lista
          usuario.estado_usuario = response.estado_usuario;
        
          // Mostrar mensaje de éxito
          this.snackbar.exito(`Usuario ${nuevoEstado}do exitosamente`);
        },
        error: () => {
          this.loading = false;
        
          // Mostrar mensaje de error
          this.snackbar.error('Error al cambiar el estado del usuario');
        }
      });
    });
  }

  eliminarUsuario(usuario: any): void {
    confirmar(this.dialog, {
      titulo: 'Eliminar usuario', textoConfirmar: 'Eliminar', peligro: true,
      mensaje: `¿Está seguro de ELIMINAR al usuario "${usuario.nombre_completo}"?\n\nEsta acción no se puede deshacer.`
    }).pipe(filter(Boolean)).subscribe(() => {
      this.loading = true;

      this.usuariosService.eliminarUsuario(usuario.id_usuario).subscribe({
        next: () => {
          this.loading = false;
          this.snackbar.exito('Usuario eliminado exitosamente');
          this.cargarUsuarios();
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
        
          // Extraer mensaje de error usando el servicio
          const mensaje = this.errorHandler.extraerMensajeError(error);
        
          // Determinar el tipo de error para mostrar el color correcto
          if (this.errorHandler.esErrorDependencias(error)) {
            // Error de dependencias (400) - Naranja/Advertencia
            this.snackbar.advertencia(`${mensaje}`);
          } else if (error.status === 404) {
            // No encontrado
            this.snackbar.error('Usuario no encontrado');
          } else {
            // Otros errores
            this.snackbar.error(`${mensaje}`);
          }
        }
      });
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
