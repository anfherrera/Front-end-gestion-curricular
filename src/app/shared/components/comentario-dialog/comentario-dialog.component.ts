import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface ComentarioDialogData {
  titulo: string;
  descripcion: string;
  placeholder: string;
  nombreDocumento: string;
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
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    
    <mat-dialog-content>
      <p>{{ data.descripcion }}</p>
      <p><strong>Documento:</strong> {{ data.nombreDocumento }}</p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Comentario</mat-label>
        <textarea 
          matInput 
          [(ngModel)]="comentario"
          [placeholder]="data.placeholder"
          rows="4"
          maxlength="500"
          #comentarioInput>
        </textarea>
        <mat-hint align="end">{{ comentario.length }}/500</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onConfirm()"
        [disabled]="!comentario.trim()">
        Añadir Comentario
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-top: 16px;
    }
    
    mat-dialog-content {
      min-width: 400px;
    }
    
    mat-dialog-actions {
      padding: 16px 0;
    }
  `]
})
export class ComentarioDialogComponent {
  comentario: string = '';

  constructor(
    public dialogRef: MatDialogRef<ComentarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ComentarioDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.comentario.trim()) {
      this.dialogRef.close(this.comentario.trim());
    }
  }
}
