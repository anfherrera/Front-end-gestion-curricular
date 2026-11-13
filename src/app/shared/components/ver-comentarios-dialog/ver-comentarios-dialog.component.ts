import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

export interface VerComentariosDialogData {
  titulo: string;
  documentos: any[];
  comentarioRechazo?: string | null;
  mensaje?: string; // Mensaje cuando no hay comentarios
}

@Component({
  selector: 'app-ver-comentarios-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './ver-comentarios-dialog.component.html',
  styleUrl: './ver-comentarios-dialog.component.css'
})
export class VerComentariosDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<VerComentariosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerComentariosDialogData
  ) {
  }

  /**
   * Verificar si hay comentario de rechazo
   */
  tieneComentarioRechazo(): boolean {
    return !!(this.data.comentarioRechazo && this.data.comentarioRechazo.trim().length > 0);
  }

  /**
   * Obtener solo los documentos que tienen comentarios
   */
  get documentosConComentarios(): any[] {
    if (!this.data.documentos || this.data.documentos.length === 0) {
      return [];
    }
    return this.data.documentos.filter(doc => 
      doc.comentario && doc.comentario.trim().length > 0
    );
  }

  /**
   * Verificar si hay documentos con comentarios
   */
  tieneDocumentosConComentarios(): boolean {
    return this.documentosConComentarios.length > 0;
  }

  /**
   * Verificar si hay algún comentario (rechazo o documentos)
   */
  tieneComentarios(): boolean {
    return this.tieneComentarioRechazo() || this.tieneDocumentosConComentarios();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
