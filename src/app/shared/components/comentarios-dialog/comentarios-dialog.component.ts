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
      <div *ngIf="data.comentarioRechazo && data.comentarioRechazo.trim()" class="comentario-rechazo">
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
        <mat-divider></mat-divider>
      </div>

      <!-- Comentarios de documentos -->
      <div *ngIf="data.documentos.length > 0; else sinComentarios">
        <h3 class="seccion-titulo">
          <mat-icon>description</mat-icon>
          Comentarios por Documento
        </h3>
        
        <div *ngFor="let documento of data.documentos; let i = index" class="documento-comentario">
          <mat-card class="comentario-card">
            <mat-card-header>
              <mat-card-title class="documento-nombre">
                <mat-icon>description</mat-icon>
                {{ documento.nombre }}
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <div *ngIf="documento.comentario && documento.comentario.trim(); else sinComentario">
                <div class="comentario-contenido">
                  <mat-icon class="comentario-icon">comment</mat-icon>
                  <span class="comentario-texto">{{ documento.comentario }}</span>
                </div>
              </div>
              
              <ng-template #sinComentario>
                <div class="sin-comentario">
                  <mat-icon>info</mat-icon>
                  <span>No hay comentarios para este documento</span>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
          
          <mat-divider *ngIf="i < data.documentos.length - 1"></mat-divider>
        </div>
      </div>
      
      <ng-template #sinComentarios>
        <div class="sin-comentarios">
          <mat-icon>info</mat-icon>
          <p>No hay comentarios disponibles para esta solicitud</p>
        </div>
      </ng-template>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .comentario-rechazo {
      margin-bottom: 24px;
    }
    
    .rechazo-card {
      background-color: #ffebee;
      border-left: 4px solid #f44336;
    }
    
    .rechazo-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.2rem;
      color: #d32f2f;
      font-weight: 600;
    }
    
    .comentario-rechazo-contenido {
      padding: 16px;
      background-color: #fff;
      border-radius: 8px;
      border: 1px solid #ffcdd2;
    }
    
    .comentario-rechazo-texto {
      font-size: 1rem;
      line-height: 1.6;
      color: #333;
      font-weight: 500;
    }
    
    .seccion-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      color: #1976d2;
      margin: 24px 0 16px 0;
      font-weight: 600;
    }
    
    .documento-comentario {
      margin-bottom: 16px;
    }
    
    .comentario-card {
      margin-bottom: 8px;
    }
    
    .documento-nombre {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      color: #333;
    }
    
    .comentario-contenido {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }
    
    .comentario-icon {
      color: #2196f3;
      margin-top: 2px;
    }
    
    .comentario-texto {
      flex: 1;
      line-height: 1.5;
      color: #555;
    }
    
    .sin-comentario {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      color: #666;
      font-style: italic;
    }
    
    .sin-comentarios {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    
    .sin-comentarios mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: #ccc;
    }
    
    mat-dialog-content {
      min-width: 600px;
      max-height: 700px;
      overflow-y: auto;
    }
    
    mat-dialog-actions {
      padding: 16px 0;
    }
  `]
})
export class ComentariosDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ComentariosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ComentariosDialogData
  ) {
    // Log para debugging
    console.log('🔍 Datos recibidos en el diálogo:');
    console.log('  - Título:', this.data.titulo);
    console.log('  - Documentos:', this.data.documentos);
    console.log('  - Comentario de rechazo:', this.data.comentarioRechazo);
    console.log('  - ¿Tiene comentario de rechazo?:', !!this.data.comentarioRechazo);
    console.log('  - ¿Comentario de rechazo no vacío?:', this.data.comentarioRechazo && this.data.comentarioRechazo.trim().length > 0);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
