import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Archivo } from '../../../core/models/procesos.model';
import { ArchivosService } from '../../../core/services/archivos.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent implements OnChanges {
  @Input() archivos: Archivo[] = [];
  @Input() reset = false;                  // Para reiniciar desde el padre
  @Output() archivosChange = new EventEmitter<Archivo[]>();

  cargando: boolean = false;

  constructor(private archivosService: ArchivosService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reset'] && changes['reset'].currentValue) {
      this.archivos = [];
      this.notificarCambio();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      if (file.type !== 'application/pdf') {
        alert('⚠️ Solo se permiten archivos PDF');
        return;
      }

      this.cargando = true;

      this.archivosService.subirPDF(file).subscribe({
        next: (archivoSubido: Archivo) => {
          this.archivos.push({
            ...archivoSubido,
            file,                       // mantener referencia en frontend
            estado: 'pendiente',        // estado inicial
            url: archivoSubido.ruta_documento
          });
          this.notificarCambio();
          this.cargando = false;
        },
        error: (err) => {
          console.error('❌ Error al subir archivo', err);
          this.cargando = false;
        }
      });
    });

    input.value = ''; // limpiar input
  }

  removeFile(index: number) {
    this.archivos.splice(index, 1);
    this.notificarCambio();
  }

  private notificarCambio() {
    this.archivosChange.emit(this.archivos);
  }
}
