import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PazSalvoService, StudentRequest } from '../../../services/paz-salvo.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-paz-salvo-secretaria',
  templateUrl: './paz-salvo-secretaria.component.html',
  styleUrls: ['./paz-salvo-secretaria.component.css'],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  providers: [DatePipe]
})
export class PazSalvoSecretariaComponent implements OnInit {
  approvedRequests$: Observable<StudentRequest[]>;
  selectedRequest: StudentRequest | null = null;

  constructor(private datePipe: DatePipe, private pazSalvoService: PazSalvoService) {
    this.approvedRequests$ = this.pazSalvoService.secretariaRequests$;
  }

  ngOnInit(): void {}

  selectRequest(req: StudentRequest) {
    // Clonamos para evitar mutaciones accidentales
    this.selectedRequest = { ...req, files: req.files.map(f => ({ ...f })) };
  }

  sendOfficio() {
    if (!this.selectedRequest) return;
    this.pazSalvoService.sendOfficio(this.selectedRequest);
    alert(`Oficio enviado a ${this.selectedRequest.studentName}`);
    this.selectedRequest = null;
  }
}
