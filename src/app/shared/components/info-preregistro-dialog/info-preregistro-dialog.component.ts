import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-info-preregistro-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="info-dialog-container">
      <div class="dialog-header">
        <mat-icon class="info-icon">info</mat-icon>
        <h2 mat-dialog-title>Información Importante - Pruebas ECAES</h2>
      </div>

      <div mat-dialog-content class="dialog-content">
        <div class="message-container">
          <p class="greeting">Estimado(a) estudiante, buenas tardes,</p>

          <p class="main-message">
            Ya se realizó la <strong>PRIMERA ETAPA</strong> del proceso de pre-inscripción a las pruebas Ecaes por parte de la universidad ante el Icfes.
          </p>

          <p class="email-info">
            A sus correos debió llegarles mensaje del Icfes con un usuario y contraseña y así continuar el proceso de registro el cual es responsabilidad de cada estudiante finalizarlo teniendo en cuenta las siguientes pautas:
          </p>

          <div class="guidelines">
            <ol>
              <li>Personalizar clave y contraseña</li>
              <li>Terminar el Proceso de inscripción y pago del recibo, antes de la fecha límite (puede visualizar las fechas en la primera sección)</li>
            </ol>
          </div>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-raised-button color="primary" (click)="onClose()">
          <mat-icon>check</mat-icon>
          Entendido
        </button>
      </div>
    </div>
  `,
  styles: [`
    .info-dialog-container {
      max-width: 600px;
      padding: 0;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 16px 24px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      margin: -24px -24px 0 -24px;
    }

    .info-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .dialog-content {
      padding: 24px;
      max-height: 400px;
      overflow-y: auto;
    }

    .message-container {
      line-height: 1.6;
    }

    .greeting {
      font-size: 16px;
      margin-bottom: 16px;
      color: #333;
    }

    .main-message {
      font-size: 15px;
      margin-bottom: 16px;
      color: #444;
      background-color: #e3f2fd;
      padding: 12px;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .email-info {
      font-size: 15px;
      margin-bottom: 20px;
      color: #555;
    }

    .guidelines {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .guidelines ol {
      margin: 0;
      padding-left: 20px;
    }

    .guidelines li {
      font-size: 15px;
      margin-bottom: 8px;
      color: #333;
    }

    .guidelines li:last-child {
      margin-bottom: 0;
    }

    .dialog-actions {
      padding: 16px 24px 24px 24px;
      justify-content: center;
      margin: 0 -24px -24px -24px;
      background-color: #fafafa;
    }

    .dialog-actions button {
      min-width: 120px;
    }

    .dialog-actions button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class InfoPreregistroDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<InfoPreregistroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}

