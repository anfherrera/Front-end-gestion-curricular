import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, map } from 'rxjs';

export interface ConfirmDialogData {
  titulo: string;
  /** Admite saltos de línea (\n). */
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Acción destructiva (eliminar, desactivar): el botón de confirmar va en color de advertencia. */
  peligro?: boolean;
}

/** Pregunta de sí/no. Se cierra con `true` si se confirma y `false` si se cancela. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="titulo">
      <mat-icon [class.peligro]="data.peligro">{{ data.peligro ? 'warning' : 'help_outline' }}</mat-icon>
      {{ data.titulo }}
    </h2>
    <mat-dialog-content>
      <p class="mensaje">{{ data.mensaje }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.textoCancelar || 'Cancelar' }}</button>
      <button mat-raised-button cdkFocusInitial
              [class.btn-peligro]="data.peligro" [class.btn-confirmar]="!data.peligro"
              [mat-dialog-close]="true">
        {{ data.textoConfirmar || 'Aceptar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .titulo { display: flex; align-items: center; gap: 8px; }
    .titulo mat-icon { color: var(--color-primario); }
    .titulo mat-icon.peligro { color: var(--color-error); }
    .mensaje { white-space: pre-line; line-height: 1.5; margin: 0; }
    .btn-confirmar { background-color: var(--color-primario) !important; color: white !important; }
    .btn-peligro { background-color: var(--color-error) !important; color: white !important; }
  `]
})
export class ConfirmDialogComponent {
  readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}

/**
 * Abre la confirmación y emite una sola vez: `true` si se confirma, `false` si se cancela o se cierra.
 * `confirmar(this.dialog, {...}).pipe(filter(Boolean)).subscribe(() => ...)`
 */
export function confirmar(
  dialog: MatDialog,
  data: ConfirmDialogData,
  config: MatDialogConfig = {}
): Observable<boolean> {
  return dialog
    .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { width: '440px', ...config, data })
    .afterClosed()
    .pipe(map(resultado => resultado === true));
}
