// import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { Archivo } from '../../../core/models/procesos.model';

// @Component({
//   selector: 'app-file-upload',
//   standalone: true,
//   imports: [CommonModule, MatButtonModule, MatIconModule],
//   templateUrl: './file-upload-dialog.component.html',
//   styleUrls: ['./file-upload-dialog.component.css']
// })
// export class FileUploadComponent implements OnChanges {
//   @Input() reset = false;                     // Permite reiniciar el componente
//   @Input() archivos: Archivo[] = [];          // Archivos actuales desde el padre
//   @Output() archivosChange = new EventEmitter<Archivo[]>();

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['reset'] && this.reset) {
//       this.archivos = [];
//       this.archivosChange.emit(this.archivos);
//     }
//   }

//   onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files) return;

//     Array.from(input.files).forEach(file => {
//       if (file.type !== 'application/pdf') return; // solo PDFs
//       if (this.archivos.some(a => a.nombre === file.name)) return; // evitar duplicados

//       this.archivos.push({
//         file,
//         nombre: file.name,
//         originalName: file.name,
//         fecha: new Date().toLocaleDateString()
//       });
//     });

//     input.value = '';
//     this.archivosChange.emit(this.archivos);
//   }

//   removeFile(index: number) {
//     this.archivos.splice(index, 1);
//     this.archivosChange.emit(this.archivos);
//   }
// }
//===========================================================
// import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { ArchivosService } from '../../../core/services/archivos.service';

// @Component({
//   selector: 'app-file-upload',
//   standalone: true,
//   imports: [CommonModule, MatButtonModule, MatIconModule],
//   templateUrl: './file-upload-dialog.component.html',
//   styleUrls: ['./file-upload-dialog.component.css']
// })
// export class FileUploadComponent implements OnChanges {
//   @Input() reset = false;
//   @Input() archivos: any[] = [];  // ahora guardaremos la respuesta del back
//   @Output() archivosChange = new EventEmitter<any[]>();

//   constructor(private archivosService: ArchivosService) {}

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['reset'] && this.reset) {
//       this.archivos = [];
//       this.archivosChange.emit(this.archivos);
//     }
//   }

//   onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files) return;

//     Array.from(input.files).forEach(file => {
//       if (file.type !== 'application/pdf') return;

//       // 👇 llamar al back para subir
//       this.archivosService.subirPDF(file).subscribe({
//         next: (docRespuesta) => {
//           console.log('✅ Archivo subido:', docRespuesta);
//           this.archivos.push(docRespuesta);
//           this.archivosChange.emit(this.archivos);
//         },
//         error: (err) => {
//           console.error('❌ Error al subir archivo:', err);
//         }
//       });
//     });

//     input.value = ''; // limpiar input
//   }

//   removeFile(index: number) {
//     this.archivos.splice(index, 1);
//     this.archivosChange.emit(this.archivos);
//   }
// }
//====================================

// import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { HttpClient } from '@angular/common/http';
// import { Archivo } from '../../../core/models/procesos.model';

// @Component({
//   selector: 'app-file-upload',
//   standalone: true,
//   imports: [CommonModule, MatButtonModule, MatIconModule],
//   templateUrl: './file-upload-dialog.component.html',
//   styleUrls: ['./file-upload-dialog.component.css']
// })
// export class FileUploadComponent implements OnChanges {
//   @Input() reset = false;
//   @Input() archivos: Archivo[] = [];
//   @Output() archivosChange = new EventEmitter<Archivo[]>();

//   constructor(private http: HttpClient) {}

//   ngOnChanges(changes: SimpleChanges) {
//     if (changes['reset'] && this.reset) {
//       this.archivos = [];
//       this.archivosChange.emit(this.archivos);
//     }
//   }

//   onFileSelected(event: Event ) {
//     const input = event.target as HTMLInputElement | null;
//     const files = input?.files;
//     if (files && files.length > 0) {

//       const file = files[0]; // 👈 solo permitimos 1 a la vez
//       input.value = '';

//       // Validar que sea PDF
//       if (file.type !== 'application/pdf') {
//         console.warn('⚠️ Solo se permiten archivos PDF');
//         return;
//       }

//       // Subir al backend
//       const formData = new FormData();
//       formData.append('file', file);

//       this.http.post<any>('/api/archivos/subir/pdf', formData).subscribe({
//         next: (resp) => {
//           console.log('✅ Archivo subido:', resp);

//           // Agregamos el archivo según la respuesta del backend
//           const nuevoArchivo: Archivo = {
//             id_documento: resp.id_documento,
//             file,
//             nombre: resp.nombre || file.name,
//             originalName: file.name,
//             ruta_documento: resp.ruta_documento,
//             fecha: new Date(resp.fecha_documento).toLocaleDateString(),
//             esValido: resp.esValido,
//             comentario: resp.comentario
//           };

//           this.archivos.push(nuevoArchivo);
//           this.archivosChange.emit(this.archivos);
//         },
//         error: (err) => {
//           console.error('❌ Error al subir archivo', err);
//         }
//       });
//     }
//   }

//   removeFile(index: number) {
//     this.archivos.splice(index, 1);
//     this.archivosChange.emit(this.archivos);
//   }
// }
//=================================================

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ArchivosService } from '../../../core/services/archivos.service';
import { Archivo } from '../../../core/models/procesos.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent {
  @Input() archivos: Archivo[] = [];
  @Output() archivosChange = new EventEmitter<Archivo[]>();

  @Input() reset = false;
  //archivos: Archivo[] = [];
  cargando = false;

  constructor(private archivosService: ArchivosService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.cargando = true;

      this.archivosService.subirPDF(file).subscribe({
        next: (archivoSubido: Archivo) => {
          console.log('✅ Archivo subido:', archivoSubido);
          this.archivos.push({
            ...archivoSubido,
            file, // mantenemos referencia en frontend
            estado: 'pendiente',
            url: archivoSubido.ruta_documento // 👈 mapea al backend
          });
          this.notificarCambio();
          this.cargando = false;
        },
        error: (err) => {
          console.error('❌ Error al subir archivo', err);
          this.cargando = false;
        }
      });
    }
  }
  private notificarCambio() {
    this.archivosChange.emit(this.archivos);
  }
}
