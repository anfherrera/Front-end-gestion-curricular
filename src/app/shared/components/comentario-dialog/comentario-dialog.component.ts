import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface ComentarioDialogData {
  titulo: string;
  descripcion: string;
  placeholder: string;
  nombreDocumento: string;
  comentarioInicial?: string;
  soloLectura?: boolean;
  textoConfirmacion?: string;
}

@Component({
  selector: 'app-comentario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  template: `
    <div class="dialog-header animate-slide-in-down">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="title-icon icon-bounce">comment</mat-icon>
        {{ data.titulo }}
      </h2>
    </div>
    
    <mat-dialog-content class="dialog-content animate-fade-in-up">
      <div class="info-section">
        <p class="description">{{ data.descripcion }}</p>
        <div class="document-info hover-lift">
          <mat-icon class="document-icon icon-bounce">description</mat-icon>
          <span class="document-name">{{ data.nombreDocumento }}</span>
        </div>
      </div>
      
      <mat-form-field appearance="outline" class="full-width comment-field form-field-animated">
        <mat-label>Comentario</mat-label>
        <textarea 
          matInput 
          [(ngModel)]="comentario"
          [placeholder]="data.placeholder"
          [readonly]="soloLectura"
          rows="5"
          maxlength="500"
          #comentarioInput
          class="comment-textarea">
        </textarea>
        <mat-hint *ngIf="!soloLectura" align="end" [class.warning]="comentario.length > 450">
          {{ comentario.length }}/500
        </mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" class="dialog-actions animate-fade-in-up">
      <button mat-button (click)="onCancel()" class="cancel-btn btn-animated">
        <mat-icon class="icon-bounce">close</mat-icon>
        {{ soloLectura ? 'Cerrar' : 'Cancelar' }}
      </button>
      <button 
        *ngIf="!soloLectura"
        mat-raised-button 
        color="primary" 
        (click)="onConfirm()"
        [disabled]="!comentario.trim()"
        class="confirm-btn btn-animated hover-glow">
        <mat-icon class="icon-bounce">add_comment</mat-icon>
        {{ textoConfirmacion }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      background: linear-gradient(135deg, #00138C 0%, #001a99 100%);
      color: white;
      padding: 28px 24px 24px 24px;
      margin: -24px -24px 0 -24px;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-height: 60px;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
    }
    
    .title-icon {
      font-size: 1.8rem;
      width: 1.8rem;
      height: 1.8rem;
      color: white;
    }
    
    .dialog-content {
      min-width: 500px;
      padding: 24px;
    }
    
    .info-section {
      margin-bottom: 20px;
    }
    
    .description {
      color: #666;
      font-size: 1rem;
      margin-bottom: 16px;
      line-height: 1.5;
    }
    
    .document-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border-left: 5px solid #00138C;
      box-shadow: 0 2px 8px rgba(0, 19, 140, 0.1);
      transition: all 0.2s ease-in-out;
    }
    
    .document-info:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 19, 140, 0.15);
    }
    
    .document-icon {
      color: #00138C;
      font-size: 1.4rem;
      width: 1.4rem;
      height: 1.4rem;
    }
    
    .document-name {
      font-weight: 600;
      color: #00138C;
      font-size: 1rem;
      letter-spacing: 0.3px;
    }
    
    .full-width {
      width: 100%;
      margin-top: 20px;
    }
    
    .comment-field {
      font-size: 1rem;
    }
    
    .comment-textarea {
      min-height: 120px;
      resize: vertical;
      font-family: inherit;
      line-height: 1.5;
    }
    
    .comment-textarea:focus {
      outline: none;
    }

    .comment-textarea[readonly] {
      background-color: #f5f5f5;
      cursor: default;
    }
    
    mat-hint.warning {
      color: #f44336;
      font-weight: 500;
    }
    
    .dialog-actions {
      padding: 16px 24px 24px 24px;
      gap: 12px;
    }
    
    .cancel-btn {
      color: #666;
      border: 1px solid #ddd;
      padding: 8px 16px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .cancel-btn:hover {
      background-color: #f5f5f5;
      border-color: #bbb;
    }
    
    .confirm-btn {
      background-color: #00138C !important;
      color: white !important;
      padding: 8px 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 19, 140, 0.3);
    }
    
    .confirm-btn:hover:not(:disabled) {
      background-color: #001a99 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 19, 140, 0.4);
    }
    
    .confirm-btn:disabled {
      background-color: #ccc !important;
      color: #999 !important;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .confirm-btn mat-icon {
      font-size: 1.1rem;
    }
    
    .cancel-btn mat-icon {
      font-size: 1.1rem;
    }
    
    /* Animaciones */
    .dialog-header {
      animation: slideDown 0.3s ease-out;
    }
    
    .dialog-content {
      animation: fadeIn 0.4s ease-out;
    }
    
    .dialog-actions {
      animation: slideUp 0.3s ease-out;
    }
    
    @keyframes slideDown {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class ComentarioDialogComponent {
  comentario: string = '';
  soloLectura: boolean = false;
  textoConfirmacion: string = 'Añadir Comentario';

  constructor(
    public dialogRef: MatDialogRef<ComentarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ComentarioDialogData
  ) {
    this.comentario = data.comentarioInicial || '';
    this.soloLectura = !!data.soloLectura;
    this.textoConfirmacion = data.textoConfirmacion || 'Añadir Comentario';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.soloLectura) {
      this.dialogRef.close();
      return;
    }

    if (this.comentario.trim()) {
      this.dialogRef.close(this.comentario.trim());
    }
  }
}
