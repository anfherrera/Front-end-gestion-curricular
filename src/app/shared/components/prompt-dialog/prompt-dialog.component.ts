import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

export interface PromptDialogData {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

@Component({
  selector: 'app-prompt-dialog',
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
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ data.placeholder || 'Ingrese el valor' }}</mat-label>
        <input matInput [(ngModel)]="inputValue" [required]="data.required ?? false" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-button color="primary" [disabled]="data.required && !inputValue.trim()" (click)="confirm()">
        Aceptar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-top: 1rem;
    }
    mat-dialog-content {
      min-width: 300px;
    }
  `]
})
export class PromptDialogComponent {
  inputValue: string = '';

  constructor(
    public dialogRef: MatDialogRef<PromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData
  ) {
    this.inputValue = data.defaultValue || '';
  }

  confirm(): void {
    if (this.data.required && !this.inputValue.trim()) {
      return;
    }
    this.dialogRef.close(this.inputValue);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}

