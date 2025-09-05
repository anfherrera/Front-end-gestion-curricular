import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface UploadedFile {
  name: string;
  date: Date;
}

interface Request {
  name: string;
  date: Date;
  status: string;
}

@Component({
  selector: 'app-paz-salvo',
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, DatePipe],
  providers: [DatePipe]
})
export class PazSalvoComponent implements OnInit {
  uploadedFiles: UploadedFile[] = [];
  requests: Request[] = [];
  requiredDocuments: string[] = [
    'Formato PM-FO-4-FOR-27',
    'Autorización para publicar y permitir la consulta y uso de obras en el repositorio institucional',
    'Resultado pruebas SaberPro',
    'Formato de hoja de vida académica',
    'Formato TI-G',
    'Formato PP-H',
    'Comprobante de pago de derechos de sustentación',
    'Documento final del trabajo de grado'
  ];

  constructor(private datePipe: DatePipe) {}

  ngOnInit(): void {}

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      this.uploadedFiles.push({ name: files[i].name, date: new Date() });
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  canSubmit(): boolean {
    const uploadedNames = this.uploadedFiles.map(f => f.name);
    return this.requiredDocuments.every(doc => 
      uploadedNames.some(name => name.includes(doc))
    );
  }

  submitRequest() {
    if (!this.canSubmit()) return;

    this.requests.push({
      name: 'Solicitud paz y salvo',
      date: new Date(),
      status: 'En revisión por funcionario'
    });

    this.uploadedFiles = [];
    alert('Solicitud enviada correctamente. Podrás hacer seguimiento en la sección correspondiente.');
  }
}
