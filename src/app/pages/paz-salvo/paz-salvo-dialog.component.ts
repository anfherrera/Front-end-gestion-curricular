import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-paz-salvo-dialog',
  standalone: true,
  template: `
    <h2 mat-dialog-title>Aviso Importante – Solicitud de Paz y Salvo Académico</h2>
    <mat-dialog-content>
      <p>
        Información Importante - Inicio del Proceso de Solicitud de Paz y Salvo Académico.
      </p>
      <p>
        Antes de iniciar el proceso correspondiente, se informa a los estudiantes de los programas de Ingeniería en Sistemas, Ingeniería Electrónica e Ingeniería en Automatización que deben solicitar el paz y salvo académico a través de la plataforma SIMCA Web, adjuntando debidamente el formato PPH o TIH (acta de sustentación), según corresponda.
      </p>
      <p>
        Por su parte, los estudiantes pertenecientes al programa de Tecnología únicamente deben adjuntar una fotocopia legible de su cédula de ciudadanía al realizar la solicitud.
      </p>
      <p> El cumplimiento de este requisito es indispensable para continuar con los trámites académicos y administrativos asociados.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onContinue()">Continuar</button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, MatButtonModule]
})
export class PazSalvoDialogComponent {
  constructor(private dialogRef: MatDialogRef<PazSalvoDialogComponent>) {}

  onCancel() {
    this.dialogRef.close(false);
  }

  onContinue() {
    this.dialogRef.close(true);
  }
}
