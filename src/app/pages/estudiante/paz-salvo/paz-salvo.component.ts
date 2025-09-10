import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestStatusTableComponent, SolicitudStatus } from '../../../shared/components/request-status/request-status.component';
import { RequiredDocsComponent } from '../../../shared/components/required-docs/required-docs.component';
import { SolicitudStatusEnum } from '../../../core/models/solicitud-status.enum';

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
    RequestStatusTableComponent,
    RequiredDocsComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent {
  archivos: Archivo[] = [];
  solicitudes: SolicitudStatus[] = [];

  // Lista de documentos requeridos
  requiredFiles = [
    'Formato PM-FO-4-FOR-27',
    'Autorización para publicar',
    'Resultado pruebas SaberPro',
    'Formato de hoja de vida académica',
    'Formato TI-G o Formato PP-H',
    'Comprobante de pago de derechos de sustentación',
    'Documento final del trabajo de grado'
  ];

  displayedColumns: string[] = ['nombre', 'fecha', 'acciones'];

  constructor(private snackBar: MatSnackBar) {}

  // Verifica si un archivo requerido ya fue subido
  isUploaded(file: string): boolean {
    if (file === 'Formato TI-G o Formato PP-H') {
      return this.archivos.some(a =>
        a.nombre.includes('Formato TI-G') || a.nombre.includes('Formato PP-H')
      );
    }
    return this.archivos.some(a => a.nombre.includes(file));
  }

  // Manejar archivos seleccionados
  onFilesSelected(event: any) {
    const selectedFiles: FileList = event.target.files;
    let nuevosArchivos = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles.item(i);
      if (!file) continue;

      // Solo PDFs
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        this.snackBar.open(`El archivo ${file.name} no es un PDF válido`, 'Cerrar', { duration: 3000 });
        continue;
      }

      // Validar que el nombre corresponda a un requerido
      const valido = this.requiredFiles.some(req =>
        req === 'Formato TI-G o Formato PP-H'
          ? file.name.includes('Formato TI-G') || file.name.includes('Formato PP-H')
          : file.name.includes(req)
      );

      if (!valido) {
        this.snackBar.open(`El archivo ${file.name} no corresponde a ningún documento requerido`, 'Cerrar', { duration: 3000 });
        continue;
      }

      // No permitir TI-G y PP-H al mismo tiempo
      if (
        (file.name.includes('Formato TI-G') && this.isUploaded('Formato PP-H')) ||
        (file.name.includes('Formato PP-H') && this.isUploaded('Formato TI-G'))
      ) {
        this.snackBar.open('Solo puedes subir Formato TI-G o Formato PP-H, no ambos.', 'Cerrar', { duration: 4000 });
        continue;
      }

      // Evitar duplicados exactos
      if (this.archivos.some(a => a.nombre === file.name)) {
        this.snackBar.open(`El archivo ${file.name} ya fue cargado`, 'Cerrar', { duration: 3000 });
        continue;
      }

      // Agregar archivo válido
      this.archivos.push({ nombre: file.name, fecha: new Date().toLocaleDateString() });
      nuevosArchivos = true;
    }

    if (nuevosArchivos) {
      this.archivos = [...this.archivos]; // refrescar tabla
      this.snackBar.open('Archivos agregados correctamente', 'Cerrar', { duration: 2000 });
    }
  }

  // Eliminar archivo
  eliminarArchivo(index: number) {
    this.archivos.splice(index, 1);
    this.archivos = [...this.archivos]; // refrescar tabla
    this.snackBar.open('Archivo eliminado', 'Cerrar', { duration: 2000 });
  }

  // Verifica si se pueden enviar todos los archivos
  canSend(): boolean {
    const obligatorios = this.requiredFiles.filter(f => f !== 'Formato TI-G o Formato PP-H');
    const todosObligatorios = obligatorios.every(f => this.isUploaded(f));
    const unoDeDos = this.isUploaded('Formato TI-G o Formato PP-H');
    return todosObligatorios && unoDeDos;
  }

  // Enviar solicitud
  enviarSolicitud() {
    if (!this.canSend()) {
      this.snackBar.open('Debes subir todos los archivos requeridos antes de enviar', 'Cerrar', { duration: 4000 });
      return;
    }

    this.solicitudes.push({
      nombre: 'Solicitud paz y salvo',
      fecha: new Date().toLocaleDateString(),
      estado: SolicitudStatusEnum.ENVIADA   // 👈 usamos el enum aquí
    });

    this.snackBar.open('Solicitud enviada correctamente 🚀', 'Cerrar', { duration: 3000 });
    this.archivos = []; // Limpiar después de enviar
  }
}
