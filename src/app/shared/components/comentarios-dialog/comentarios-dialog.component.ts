import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

export interface ComentariosDialogData {
  titulo: string;
  documentos: any[];
  comentarioRechazo?: string | null;
  mensaje?: string; // Mensaje cuando no hay comentarios
}

@Component({
  selector: 'app-comentarios-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    
    <mat-dialog-content>
      <!-- Comentario de rechazo de la solicitud -->
      <div *ngIf="tieneComentarioRechazo()" class="comentario-rechazo">
        <mat-card class="rechazo-card">
          <mat-card-header>
            <mat-card-title class="rechazo-titulo">
              <mat-icon color="warn">cancel</mat-icon>
              Comentario de Rechazo
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="comentario-rechazo-contenido">
              <span class="comentario-rechazo-texto">{{ data.comentarioRechazo }}</span>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-divider *ngIf="tieneDocumentosConComentarios()"></mat-divider>
      </div>

      <!-- Comentarios de documentos -->
      <div *ngIf="tieneDocumentosConComentarios()">
        <h3 class="seccion-titulo">
          <mat-icon>description</mat-icon>
          Comentarios por Documento
        </h3>
        
        <div *ngFor="let documento of documentosConComentarios; let i = index" class="documento-comentario">
          <mat-card class="comentario-card">
            <mat-card-header>
              <mat-card-title class="documento-nombre">
                <mat-icon>description</mat-icon>
                {{ documento.nombre }}
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <div class="comentario-contenido">
                <mat-icon class="comentario-icon">comment</mat-icon>
                <span class="comentario-texto">{{ documento.comentario }}</span>
              </div>
            </mat-card-content>
          </mat-card>
          
          <mat-divider *ngIf="i < documentosConComentarios.length - 1"></mat-divider>
        </div>
      </div>
      
      <!-- Mensaje cuando no hay comentarios -->
      <div *ngIf="!tieneComentarios()" class="sin-comentarios">
        <mat-icon>info</mat-icon>
        <p>{{ data.mensaje || 'No hay comentarios disponibles para esta solicitud' }}</p>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Estilos del diálogo */
    ::ng-deep .mat-mdc-dialog-container {
      border-radius: 12px !important;
      overflow: hidden;
      padding: 0 !important;
      font-family: 'Roboto', sans-serif !important;
    }

    h2[mat-dialog-title] {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      color: #00138C;
      padding: 28px 32px;
      margin: -24px -24px 0 -24px;
      font-size: 1.4rem;
      font-weight: 600;
      font-family: 'Roboto', sans-serif;
      display: flex;
      align-items: center;
      gap: 14px;
      border-bottom: 2px solid #00138C;
    }

    mat-dialog-content {
      min-width: 600px;
      max-width: 800px;
      max-height: 700px;
      overflow-y: auto;
      padding: 32px;
      background-color: #ffffff;
      font-family: 'Roboto', sans-serif;
    }
    
    /* Comentario de rechazo */
    .comentario-rechazo {
      margin-bottom: 36px;
    }
    
    .rechazo-card {
      background-color: #fff;
      border: 1px solid #ffcdd2;
      border-left: 4px solid #f44336;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(244, 67, 54, 0.1);
      overflow: hidden;
    }
    
    .rechazo-titulo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.1rem;
      color: #d32f2f;
      font-weight: 600;
      font-family: 'Roboto', sans-serif;
      padding: 20px 24px;
      background-color: #ffebee;
      margin: 0;
    }

    .rechazo-titulo mat-icon {
      color: #d32f2f;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    
    .comentario-rechazo-contenido {
      padding: 24px;
      background-color: #fff;
    }
    
    .comentario-rechazo-texto {
      font-size: 0.95rem;
      line-height: 1.7;
      color: #333;
      font-weight: 400;
      font-family: 'Roboto', sans-serif;
      white-space: pre-wrap;
      margin: 0;
    }
    
    /* Título de sección */
    .seccion-titulo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.1rem;
      color: #00138C;
      margin: 36px 0 24px 0;
      font-weight: 600;
      font-family: 'Roboto', sans-serif;
      padding-bottom: 16px;
      border-bottom: 2px solid #00138C;
    }

    .seccion-titulo mat-icon {
      color: #00138C;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    
    .documento-comentario {
      margin-bottom: 28px;
    }
    
    .comentario-card {
      background-color: #fff;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    
    .documento-nombre {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1rem;
      color: #00138C;
      font-weight: 600;
      font-family: 'Roboto', sans-serif;
      padding: 20px 24px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      margin: 0;
    }

    .documento-nombre mat-icon {
      color: #00138C;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .comentario-contenido {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 24px;
      background-color: #fff;
    }
    
    .comentario-icon {
      color: #00138C;
      margin-top: 4px;
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    
    .comentario-texto {
      flex: 1;
      line-height: 1.7;
      color: #333;
      font-size: 0.95rem;
      font-family: 'Roboto', sans-serif;
      font-weight: 400;
      white-space: pre-wrap;
      margin: 0;
    }
    
    .sin-comentarios {
      text-align: center;
      padding: 60px 40px;
      color: #666;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px dashed #dee2e6;
      font-family: 'Roboto', sans-serif;
    }
    
    .sin-comentarios mat-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      margin-bottom: 20px;
      color: #adb5bd;
    }

    .sin-comentarios p {
      font-size: 1rem;
      margin: 0;
      color: #666;
      font-family: 'Roboto', sans-serif;
    }
    
    mat-dialog-actions {
      padding: 20px 32px;
      background-color: #ffffff;
      border-top: 1px solid #e9ecef;
      margin: 0 -24px -24px -24px;
    }

    mat-dialog-actions button {
      background-color: #00138C !important;
      color: white !important;
      border-radius: 6px;
      padding: 10px 24px;
      font-weight: 500;
      font-family: 'Roboto', sans-serif;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 19, 140, 0.2);
      font-size: 0.9rem;
    }

    mat-dialog-actions button:hover {
      background-color: #001a99 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 19, 140, 0.3);
    }

    /* Divisor */
    mat-divider {
      margin: 28px 0;
      border-top-color: #e9ecef;
    }

    /* Ajustes para mat-card */
    ::ng-deep .rechazo-card .mat-mdc-card-header {
      padding: 0;
    }

    ::ng-deep .rechazo-card .mat-mdc-card-content {
      padding: 0;
    }

    ::ng-deep .comentario-card .mat-mdc-card-header {
      padding: 0;
    }

    ::ng-deep .comentario-card .mat-mdc-card-content {
      padding: 0;
    }
  `]
})
export class ComentariosDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ComentariosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ComentariosDialogData
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
