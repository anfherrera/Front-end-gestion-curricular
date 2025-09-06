import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UploadedFile {
  name: string;
  date: Date;
  status?: 'pendiente' | 'correcto' | 'incorrecto' | 'no-requerido';
}

export enum RequestState {
  PendienteEstudiante = 'pendiente',
  RevisadoFuncionario = 'revisado',
  AprobadoCoordinador = 'aprobado',
  RechazadoCoordinador = 'rechazado'
}

export interface StudentRequest {
  studentId: string;
  studentName: string;
  date: Date;
  state: RequestState;
  files: UploadedFile[];
}

@Injectable({ providedIn: 'root' })
export class PazSalvoService {

  // BehaviorSubjects para cada rol
  private _estudianteRequests = new BehaviorSubject<StudentRequest[]>([]);
  estudianteRequests$ = this._estudianteRequests.asObservable();

  private _funcionarioRequests = new BehaviorSubject<StudentRequest[]>([]);
  funcionarioRequests$ = this._funcionarioRequests.asObservable();

  private _coordinadorRequests = new BehaviorSubject<StudentRequest[]>([]);
  coordinadorRequests$ = this._coordinadorRequests.asObservable();

  private _secretariaRequests = new BehaviorSubject<StudentRequest[]>([]);
  secretariaRequests$ = this._secretariaRequests.asObservable();

  constructor() {}

  // ==========================
  // ESTUDIANTE
  // ==========================
  createEstudianteRequest(request: StudentRequest) {
    const estCurrent = this._estudianteRequests.getValue();
    this._estudianteRequests.next([...estCurrent, request]);

    // Enviar automáticamente a funcionario
    const funcCurrent = this._funcionarioRequests.getValue();
    this._funcionarioRequests.next([...funcCurrent, request]);
  }

  // ==========================
  // FUNCIONARIO
  // ==========================
  updateFuncionarioRequest(request: StudentRequest) {
    const funcCurrent = this._funcionarioRequests.getValue();
    const index = funcCurrent.findIndex(
      r => r.studentId === request.studentId && r.date.getTime() === request.date.getTime()
    );
    if (index !== -1) {
      funcCurrent[index] = request;
      this._funcionarioRequests.next([...funcCurrent]);
    }
  }

  // ==========================
  // COORDINADOR
  // ==========================
  approveCoordinadorRequest(request: StudentRequest) {
    request.state = RequestState.AprobadoCoordinador;
    const coordCurrent = this._coordinadorRequests.getValue();
    this._coordinadorRequests.next([...coordCurrent, request]);

    const secCurrent = this._secretariaRequests.getValue();
    this._secretariaRequests.next([...secCurrent, request]);
  }

  rejectCoordinadorRequest(request: StudentRequest) {
    request.state = RequestState.RechazadoCoordinador;
    const coordCurrent = this._coordinadorRequests.getValue();
    this._coordinadorRequests.next([...coordCurrent, request]);
  }

  // ==========================
  // SECRETARIA
  // ==========================
  sendOfficio(request: StudentRequest) {
    console.log(`Oficio enviado a ${request.studentName}`);
    // Aquí podrías hacer más lógica si se requiere
  }
}
