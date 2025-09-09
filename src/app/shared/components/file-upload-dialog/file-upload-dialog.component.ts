import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Archivo {
  nombre: string;        // nombre estandarizado (ej. "Formato PM-FO-4-FOR-27")
  originalName: string;  // nombre real subido por el usuario
  fecha: string;
  file: File;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule, MatSnackBarModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent {
  archivos: Archivo[] = [];
  allowedExtensions: string[] = ['pdf'];

  // Documentos obligatorios (debe existir cada uno)
  documentosRequeridos: string[] = [
    'Formato PM-FO-4-FOR-27',
    'Autorización para publicar',
    'Resultado pruebas SaberPro',
    'Formato de hoja de vida académica',
    'Comprobante de pago de derechos de sustentación',
    'Documento final del trabajo de grado'
  ];

  // Exclusivos: sólo uno de estos dos puede subirse
  documentosExclusivos: string[] = ['Formato TI-G', 'Formato PP-H'];

  constructor(private snackBar: MatSnackBar) {}

  // -------------------------
  // Selección de archivos
  // -------------------------
  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const selectedFiles = Array.from(input.files);

    for (const file of selectedFiles) {
      // 1) Extensión PDF
      if (!this.isPdf(file)) {
        this.showError(`"${file.name}" no es un PDF. Sólo se permiten archivos .pdf`);
        continue;
      }

      // 2) Intentar identificar a qué documento corresponde
      const match = this.matchDocumento(file.name);
      if (!match) {
        this.showError(`"${file.name}" no corresponde a ningún documento requerido.`);
        continue;
      }

      // 3) Duplicados: por documento estandarizado (match)
      if (this.archivos.some(a => a.nombre === match)) {
        this.showError(`El documento "${match}" ya fue cargado.`);
        continue;
      }

      // 4) Exclusivos: permitir sólo uno entre TI-G y PP-H
      if (this.documentosExclusivos.includes(match)) {
        const yaTieneExclusivo = this.archivos.some(a => this.documentosExclusivos.includes(a.nombre));
        if (yaTieneExclusivo) {
          this.showError('Sólo puede subir uno entre "Formato TI-G" o "Formato PP-H".');
          continue;
        }
      }

      // 5) Si pasa todas las validaciones, agregar con el nombre estandarizado
      this.archivos.push({
        nombre: match,
        originalName: file.name,
        fecha: new Date().toLocaleDateString(),
        file
      });
    }

    // reset input para permitir subir el mismo archivo luego si el usuario quiere
    input.value = '';
  }

  // -------------------------
  // Helpers: normalización y match
  // -------------------------
  private normalizeForMatch(s: string): string {
    // quitar extensión .pdf
    s = s.replace(/\.pdf$/i, '');
    // quitar acentos
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // dejar solo letras/números y espacios (reemplaza puntuación por espacio)
    s = s.replace(/[^a-z0-9\s-]/gi, ' ');
    // reemplazar guiones y multip espacios por espacio simple
    s = s.replace(/[-_]+/g, ' ');
    s = s.replace(/\s+/g, ' ').trim().toLowerCase();
    return s;
  }

  private matchDocumento(originalName: string): string | null {
    const normal = this.normalizeForMatch(originalName);

    // buscar coincidencia en requeridos (prioridad)
    for (const doc of this.documentosRequeridos) {
      const nDoc = this.normalizeForMatch(doc);
      if (normal.includes(nDoc) || nDoc.split(' ').every(tok => normal.includes(tok))) {
        return doc;
      }
    }

    // buscar en exclusivos
    for (const doc of this.documentosExclusivos) {
      const nDoc = this.normalizeForMatch(doc);
      if (normal.includes(nDoc) || nDoc.split(' ').every(tok => normal.includes(tok))) {
        return doc;
      }
    }

    return null;
  }

  private isPdf(file: File): boolean {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ext === 'pdf' || file.type === 'application/pdf';
  }

  // -------------------------
  // UI actions
  // -------------------------
  removeFile(index: number) {
    this.archivos.splice(index, 1);
  }

  tieneDocumento(doc: string): boolean {
    return this.archivos.some(a => a.nombre === doc);
  }

  tieneExclusivo(): boolean {
    return this.archivos.some(a => this.documentosExclusivos.includes(a.nombre));
  }

  canSend(): boolean {
    const completos = this.documentosRequeridos.every(doc => this.tieneDocumento(doc));
    return completos && this.tieneExclusivo();
  }

  enviarSolicitud() {
    if (!this.canSend()) {
      this.showError('Debes subir todos los documentos requeridos y 1 entre TI-G o PP-H.');
      return;
    }

    // Aquí enviarías los archivos al backend. Ejemplo: FormData + httpClient
    console.log('Enviando:', this.archivos);
    this.snackBar.open('Solicitud enviada con éxito', 'Cerrar', { duration: 3000 });
    this.archivos = [];
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Cerrar', { duration: 4000, panelClass: ['snack-error'] });
    console.warn(message);
  }
}
