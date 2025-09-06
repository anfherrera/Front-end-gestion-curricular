import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PazSalvoService, StudentRequest, UploadedFile } from '../../../services/paz-salvo.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-paz-salvo-coordinador',
  templateUrl: './paz-salvo-coordinador.component.html',
  styleUrls: ['./paz-salvo-coordinador.component.css'],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  providers: [DatePipe]
})
export class PazSalvoCoordinadorComponent implements OnInit {
  requests$: Observable<StudentRequest[]>;
  selectedRequest: StudentRequest | null = null;

  constructor(private datePipe: DatePipe, private pazSalvoService: PazSalvoService) {
    this.requests$ = this.pazSalvoService.coordinadorRequests$;
  }

  ngOnInit(): void {}

  selectRequest(req: StudentRequest) {
    // Clonamos el objeto para no mutar directamente la lista
    this.selectedRequest = { ...req, files: req.files.map(f => ({ ...f })) };
  }

  viewFile(file: UploadedFile) {
    alert(`Abrir PDF: ${file.name}`);
  }

  approveRequest() {
    if (!this.selectedRequest) return;
    this.pazSalvoService.approveCoordinadorRequest(this.selectedRequest);
    alert(`Solicitud de ${this.selectedRequest.studentName} aprobada. Se enviará a la secretaria.`);
    this.selectedRequest = null;
  }

  rejectRequest() {
    if (!this.selectedRequest) return;
    this.pazSalvoService.rejectCoordinadorRequest(this.selectedRequest);
    alert(`Solicitud de ${this.selectedRequest.studentName} rechazada. El estudiante deberá corregirla.`);
    this.selectedRequest = null;
  }
}
