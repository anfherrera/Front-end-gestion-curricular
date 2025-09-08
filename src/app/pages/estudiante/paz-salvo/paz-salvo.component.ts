import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestStatusTableComponent, SolicitudStatus } from '../../../shared/components/request-status/request-status.component';

interface Archivo {
  nombre: string;
  fecha: string;
}

@Component({
  selector: 'app-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    RequestStatusTableComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent {
  archivos: Archivo[] = [];
  solicitudes: SolicitudStatus[] = [];
  
  requiredFiles = [
    'Formato PM-FO-4-FOR-27',
    'Autorización para publicar',
    'Resultado pruebas SaberPro',
    'Formato de hoja de vida académica',
    'Formato TI-G',
    'Formato PP-H',
    'Comprobante de pago de derechos de sustentación',
    'Documento final del trabajo de grado'
  ];

  displayedColumns: string[] = ['nombre', 'fecha', 'acciones'];

  constructor(private snackBar: MatSnackBar) {}

  onFilesSelected(event: any) {
    const selectedFiles: FileList = event.target.files;
    let nuevosArchivos = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles.item(i);
      if (file && file.name.toLowerCase().endsWith('.pdf')) {
        // Evita duplicados
        if (!this.archivos.some(a => a.nombre === file.name)) {
          this.archivos.push({ nombre: file.name, fecha: new Date().toLocaleDateString() });
          nuevosArchivos = true;
        }
      }
    }

    if (nuevosArchivos) {
      this.archivos = [...this.archivos]; // 🔥 Forzar refresco de la tabla
      this.snackBar.open('Archivos agregados', 'Cerrar', { duration: 2000 });
    }
  }

  eliminarArchivo(index: number) {
    this.archivos.splice(index, 1);
    this.archivos = [...this.archivos]; // 🔥 Forzar refresco
    this.snackBar.open('Archivo eliminado', 'Cerrar', { duration: 2000 });
  }

  canSend(): boolean {
    return this.requiredFiles.every(req => this.archivos.some(a => a.nombre.includes(req)));
  }

  enviarSolicitud() {
    if (!this.canSend()) {
      this.snackBar.open('Debes subir todos los archivos requeridos antes de enviar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.solicitudes.push({
      nombre: 'Solicitud paz y salvo',
      fecha: new Date().toLocaleDateString(),
      estado: 'Revisión'
    });

    this.snackBar.open('Solicitud enviada correctamente', 'Cerrar', { duration: 3000 });
    this.archivos = []; // Limpiar lista después de enviar
  }
}
