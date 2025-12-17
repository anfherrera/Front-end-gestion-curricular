import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface RechazoDialogData {
  titulo?: string;
  descripcion?: string;
  placeholder?: string;
  motivoInicial?: string;
}

@Component({
  selector: 'app-rechazo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './rechazo-dialog.component.html',
  styleUrls: ['./rechazo-dialog.component.css']
})
export class RechazoDialogComponent {
  motivo: string = '';

  constructor(
    public dialogRef: MatDialogRef<RechazoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RechazoDialogData
  ) {
    if (data?.motivoInicial) {
      this.motivo = data.motivoInicial;
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  confirmar(): void {
    this.dialogRef.close(this.motivo.trim());
  }
}
