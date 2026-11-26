import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
import { UsuarioDTORespuesta } from '@core/models/usuario.interface';

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
    MatChipsModule,
  ],
  templateUrl: './manage-users.component.html',
  styleUrl: '../admin-lista-comun.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageUsersComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);

  private readonly dialog = inject(MatDialog);
  readonly usuarios = signal<UsuarioDTORespuesta[]>([]);
  displayedColumns: string[] = ['id_usuario', 'nombre_completo', 'correo', 'rol', 'estado', 'acciones'];
  readonly loading = signal(false);
  searchTerm = '';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading.set(true);

    this.usuariosService.listarUsuarios().subscribe({
      next: (data) => {
        // Corregir encoding de caracteres especiales (tildes, ñ, etc.)
        this.usuarios.set(corregirEncodingObjeto(data));
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Error al cargar usuarios');
        this.loading.set(false);
      },
    });
  }

  buscar(): void {
    if (!this.searchTerm.trim()) {
      this.cargarUsuarios();
      return;
    }

    this.loading.set(true);
    const usuariosFiltrados = this.usuarios().filter(
      (u) =>
        u.nombre_completo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.correo.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.usuarios.set(usuariosFiltrados);
    this.loading.set(false);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarUsuarios();
  }

  /**
   * Cambia el estado de un usuario (activo <-> inactivo)
   */
  cambiarEstado(usuario: UsuarioDTORespuesta): void {
    const nuevoEstado = !usuario.estado_usuario ? 'activar' : 'desactivar';

    confirmar(this.dialog, {
      titulo: !usuario.estado_usuario ? 'Activar usuario' : 'Desactivar usuario',
      textoConfirmar: !usuario.estado_usuario ? 'Activar' : 'Desactivar',
      peligro: !!usuario.estado_usuario,
      mensaje: `¿Estás seguro de ${nuevoEstado} a ${usuario.nombre_completo}?`,
    })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.loading.set(true);

        this.usuariosService.cambiarEstadoUsuario(usuario.id_usuario).subscribe({
          next: (response) => {
            this.loading.set(false);
            // Actualizar el estado en la tabla sin recargar toda la lista
            this.usuarios.update((lista) =>
              lista.map((u) =>
                u.id_usuario === usuario.id_usuario ? { ...u, estado_usuario: response.estado_usuario } : u
              )
            );

            // Mostrar mensaje de éxito
            this.snackbar.exito(`Usuario ${nuevoEstado}do exitosamente`);
          },
          error: () => {
            this.loading.set(false);

            // Mostrar mensaje de error
            this.snackbar.error('Error al cambiar el estado del usuario');
          },
        });
      });
  }

  eliminarUsuario(usuario: UsuarioDTORespuesta): void {
    confirmar(this.dialog, {
      titulo: 'Eliminar usuario',
      textoConfirmar: 'Eliminar',
      peligro: true,
      mensaje: `¿Está seguro de ELIMINAR al usuario "${usuario.nombre_completo}"?\n\nEsta acción no se puede deshacer.`,
    })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.loading.set(true);

        this.usuariosService.eliminarUsuario(usuario.id_usuario).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackbar.exito('Usuario eliminado exitosamente');
            this.cargarUsuarios();
          },
          error: (error: HttpErrorResponse) => {
            this.loading.set(false);

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
          },
        });
      });
  }
}
