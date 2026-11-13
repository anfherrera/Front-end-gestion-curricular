import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-info-preregistro-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './info-preregistro-dialog.component.html',
  styleUrl: './info-preregistro-dialog.component.css'
})
export class InfoPreregistroDialogComponent {
  dialogRef = inject<MatDialogRef<InfoPreregistroDialogComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);


  onClose(): void {
    this.dialogRef.close();
  }
}

