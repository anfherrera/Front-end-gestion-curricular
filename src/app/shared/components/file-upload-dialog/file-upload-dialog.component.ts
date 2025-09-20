import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Archivo } from '../../../core/models/procesos.model';
import { ArchivosService } from '../../../core/services/archivos.service';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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

      // Solo agregar el archivo localmente, sin subirlo al backend
      const archivoLocal: Archivo = {
        file: file,                    // mantener referencia del archivo
        nombre: file.name,             // nombre del archivo
        fecha: new Date().toISOString(), // fecha de selección
        estado: 'pendiente',           // estado inicial
        esValido: true                 // asumir válido hasta que se suba
      };

      this.archivos.push(archivoLocal);
    });

    this.notificarCambio();
    input.value = ''; // limpiar input
  }

  removeFile(index: number) {
    this.archivos.splice(index, 1);
    this.notificarCambio();
  }

  /**
   * Sube todos los archivos pendientes al backend
   * @returns Observable que emite cuando todos los archivos han sido subidos
   */
  subirArchivosPendientes(): Observable<Archivo[]> {
    const archivosPendientes = this.archivos.filter(archivo => archivo.file && !archivo.id_documento);

    if (archivosPendientes.length === 0) {
      return of(this.archivos); // Si no hay archivos pendientes, retornar los existentes
    }

    this.cargando = true;

    // Subir archivos uno por uno
    const subidas$ = archivosPendientes.map(archivo =>
      this.archivosService.subirPDF(archivo.file!).pipe(
        map(archivoSubido => {
          // Actualizar el archivo local con la información del backend
          const index = this.archivos.findIndex(a => a.file === archivo.file);
          if (index !== -1) {
            this.archivos[index] = {
              ...archivoSubido,
              file: archivo.file, // mantener referencia local
              estado: 'aprobado',
              url: archivoSubido.ruta_documento
            };
          }
          return this.archivos[index];
        })
      )
    );

    return forkJoin(subidas$).pipe(
      tap(() => {
        this.cargando = false;
        this.notificarCambio();
      }),
      map(() => this.archivos)
    );
  }

  private notificarCambio() {
    this.archivosChange.emit(this.archivos);
  }
}
