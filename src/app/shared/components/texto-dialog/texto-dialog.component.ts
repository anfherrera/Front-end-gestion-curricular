import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Diálogo que pide (o muestra) un texto: motivo de rechazo, comentario de un documento…
 * Se cierra con el texto recortado si se confirma, o con `undefined` si se cancela.
 */
export interface TextoDialogData {
  titulo: string;
  descripcion?: string;
  /** Etiqueta del campo. */
  etiqueta?: string;
  valorInicial?: string;
  textoConfirmar?: string;
  /** Icono de Material de la cabecera. */
  icono?: string;
  /** Muestra el documento al que se refiere el texto. */
  nombreDocumento?: string;
  /** Texto anterior (solo lectura) que se muestra encima del campo; el resultado es solo lo nuevo. */
  historial?: string;
  /** Solo muestra el texto, sin botón de confirmar. */
  soloLectura?: boolean;
  /** Muestra un contador y limita el largo. */
  maxLength?: number;
}

/** Datos para pedir el motivo de un rechazo. */
export function datosRechazo(
  titulo = 'Rechazar solicitud',
  descripcion = 'Indique el motivo de rechazo de toda la solicitud:'
): TextoDialogData {
  return { titulo, descripcion, etiqueta: 'Motivo de rechazo', textoConfirmar: 'Rechazar', icono: 'block' };
}

@Component({
  selector: 'app-texto-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './texto-dialog.component.html',
  styleUrls: ['./texto-dialog.component.css']
})
export class TextoDialogComponent {
  readonly data: TextoDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TextoDialogComponent, string>);

  texto = this.data.historial ? '' : (this.data.valorInicial ?? '');

  get puedeConfirmar(): boolean {
    return !!this.texto.trim();
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmar(): void {
    if (this.puedeConfirmar) {
      this.dialogRef.close(this.texto.trim());
    }
  }
}
