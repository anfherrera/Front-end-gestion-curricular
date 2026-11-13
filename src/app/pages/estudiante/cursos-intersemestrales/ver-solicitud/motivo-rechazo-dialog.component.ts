import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface MotivoRechazoDialogData {
  titulo: string;
  motivo: string;
  estado?: string;
  fecha?: string;
  esRechazo?: boolean;
}

/** Muestra el motivo (o las observaciones) del estado actual de una solicitud. */
@Component({
  selector: 'app-motivo-rechazo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <div mat-dialog-content class="motivo-dialog">
      <div class="motivo-dialog__encabezado" [ngClass]="{ 'motivo-dialog__encabezado--rechazo': data.esRechazo }">
        <mat-icon>{{ data.esRechazo ? 'error_outline' : 'info' }}</mat-icon>
        <div class="motivo-dialog__estado">
          <span class="motivo-dialog__estado-texto">{{ data.estado }}</span>
          <span *ngIf="data.fecha" class="motivo-dialog__fecha">{{ data.fecha }}</span>
        </div>
      </div>
      <p class="motivo-dialog__mensaje">{{ data.motivo }}</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Cerrar</button>
    </div>
  `,
  styles: [`
    .motivo-dialog {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .motivo-dialog__encabezado {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      background: #e3f2fd;
      color: #0d47a1;
      border-left: 4px solid #2196f3;
    }

    .motivo-dialog__encabezado--rechazo {
      background: #ffebee;
      color: #b71c1c;
      border-left-color: #FF6D0A;
    }

    .motivo-dialog__encabezado mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .motivo-dialog__estado {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .motivo-dialog__estado-texto {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 13px;
    }

    .motivo-dialog__fecha {
      font-size: 12px;
      color: inherit;
      opacity: 0.8;
    }

    .motivo-dialog__mensaje {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #424242;
      word-break: break-word;
      white-space: pre-wrap;
    }
  `]
})
export class MotivoRechazoDialogComponent {
  data = inject<MotivoRechazoDialogData>(MAT_DIALOG_DATA);
}
