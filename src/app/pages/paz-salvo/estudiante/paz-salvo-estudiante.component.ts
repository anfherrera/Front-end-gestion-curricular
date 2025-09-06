import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UploadedFile, StudentRequest, PazSalvoService, RequestState } from '../../../services/paz-salvo.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-paz-salvo-estudiante',
  templateUrl: './paz-salvo-estudiante.component.html',
  styleUrls: ['./paz-salvo-estudiante.component.css'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  providers: [DatePipe]
})
export class PazSalvoEstudianteComponent implements OnInit {
  uploadedFiles: UploadedFile[] = [];
  requests$: Observable<StudentRequest[]>;
  requiredDocuments: string[] = [
    'Formato PM-FO-4-FOR-27',
    'Autorización para publicar y permitir la consulta y uso de obras en el repositorio institucional',
    'Resultado pruebas SaberPro',
    'Formato de hoja de vida académica',
    'Formato TI-G o Formato PP-H',
    'Comprobante de pago de derechos de sustentación',
    'Documento final del trabajo de grado'
  ];

  constructor(private datePipe: DatePipe, private pazService: PazSalvoService) {
    this.requests$ = this.pazService.estudianteRequests$;
  }

  ngOnInit(): void {}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i].name;

      // Validar TI-G / PP-H mutuamente excluyentes
      if ((fileName.includes('Formato TI-G') && this.isDocumentUploaded('Formato TI-G o Formato PP-H')) ||
          (fileName.includes('Formato PP-H') && this.isDocumentUploaded('Formato TI-G o Formato PP-H'))) {
        alert('Solo puedes subir uno de los siguientes: Formato TI-G o Formato PP-H');
        continue;
      }

      const existing = this.uploadedFiles.find(f => f.name === fileName);
      if (!existing) {
        this.uploadedFiles.push({
          name: fileName,
          date: new Date(),
          status: this.isFileRequired(fileName) ? 'pendiente' : 'no-requerido'
        });
      }
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  isFileRequired(fileName: string): boolean {
    // TI-G y PP-H son requeridos
    if (fileName.includes('Formato TI-G') || fileName.includes('Formato PP-H')) {
      return true;
    }
    return this.requiredDocuments.some(doc => fileName.includes(doc.replace(' o Formato PP-H', '')));
  }

  isDocumentUploaded(doc: string): boolean {
    if (doc === 'Formato TI-G o Formato PP-H') {
      // Retorna true si cualquiera de los dos está subido
      return this.uploadedFiles.some(f => f.name.includes('Formato TI-G') || f.name.includes('Formato PP-H'));
    }
    return this.uploadedFiles.some(f => f.name.includes(doc));
  }

  getIconStatus(file: UploadedFile): 'check_circle' | 'error' {
    if (file.status === 'pendiente' || file.status === 'correcto') return 'check_circle';
    return 'error';
  }

  canSubmit(): boolean {
    const requiredDocs = this.requiredDocuments.slice(0, 4);
    const tiOrPp = this.isDocumentUploaded('Formato TI-G o Formato PP-H');
    const lastDocs = ['Comprobante de pago de derechos de sustentación', 'Documento final del trabajo de grado'];
    const lastUploaded = lastDocs.every(doc => this.isDocumentUploaded(doc));

    return requiredDocs.every(doc => this.isDocumentUploaded(doc)) && tiOrPp && lastUploaded;
  }

  submitRequest() {
    if (!this.canSubmit()) {
      alert('Debes subir todos los documentos obligatorios antes de enviar la solicitud.');
      return;
    }

    const newRequest: StudentRequest = {
      studentName: 'Estudiante Ejemplo',
      studentId: '20250001',
      date: new Date(),
      state: RequestState.PendienteEstudiante,
      files: [...this.uploadedFiles]
    };

    this.pazService.createEstudianteRequest(newRequest);
    this.uploadedFiles = [];
    alert('Solicitud enviada correctamente.');
  }
}
