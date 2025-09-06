import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PazSalvoService, StudentRequest, UploadedFile, RequestState } from '../../../services/paz-salvo.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-paz-salvo-funcionario',
  templateUrl: './paz-salvo-funcionario.component.html',
  styleUrls: ['./paz-salvo-funcionario.component.css'],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  providers: [DatePipe]
})
export class PazSalvoFuncionarioComponent implements OnInit {
  requests$: Observable<StudentRequest[]>;
  selectedRequest: StudentRequest | null = null;

  constructor(private datePipe: DatePipe, private pazSalvoService: PazSalvoService) {
    this.requests$ = this.pazSalvoService.funcionarioRequests$;
  }

  ngOnInit(): void {}

  selectRequest(req: StudentRequest) {
    // Clonamos para evitar mutar directamente la lista
    this.selectedRequest = { ...req, files: req.files.map(f => ({ ...f })) };
  }

  markFile(file: UploadedFile, status: 'correcto' | 'incorrecto') {
    if (!this.selectedRequest) return;
    file.status = status;

    // Actualizamos el objeto completo en el servicio
    this.pazSalvoService.updateFuncionarioRequest(this.selectedRequest);
  }

  viewFile(file: UploadedFile) {
    alert(`Abrir PDF: ${file.name}`);
  }

  rejectRequest() {
    if (!this.selectedRequest) return;

    this.selectedRequest.state = RequestState.PendienteEstudiante;
    this.pazSalvoService.updateFuncionarioRequest(this.selectedRequest);

    alert(`Solicitud de ${this.selectedRequest.studentName} rechazada. Añadir observaciones.`);
    this.selectedRequest = null;
  }

  finishValidation() {
    if (!this.selectedRequest) return;

    // Verificamos que todos los archivos estén marcados
    const allMarked = this.selectedRequest.files.every(f => f.status === 'correcto' || f.status === 'incorrecto');
    if (!allMarked) {
      alert('Debe marcar todos los archivos antes de finalizar la validación.');
      return;
    }

    this.selectedRequest.state = RequestState.RevisadoFuncionario;
    this.pazSalvoService.updateFuncionarioRequest(this.selectedRequest);

    alert(`Validación de ${this.selectedRequest.studentName} completada. Se enviará al coordinador.`);
    this.selectedRequest = null;
  }
}
