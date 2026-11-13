import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import {
  FormatosInstitucionalesService,
  FormatoInstitucional,
  FormatoId,
  FORMATO_IDS
} from '@core/services/formatos-institucionales.service';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-formatos-institucionales',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './formatos-institucionales.component.html',
  styleUrls: ['./formatos-institucionales.component.css']
})
export class FormatosInstitucionalesComponent implements OnInit {
  private formatosService = inject(FormatosInstitucionalesService);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);

  formatos: FormatoInstitucional[] = [];
  editingId: FormatoId | null = null;
  editForm: FormGroup;

  readonly FORMATO_IDS = FORMATO_IDS;

  constructor() {
    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(1)]],
      url: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.cargarFormatos();
  }

  cargarFormatos(): void {
    this.formatos = this.formatosService.getAll();
  }

  iniciarEdicion(f: FormatoInstitucional): void {
    this.editingId = f.id;
    this.editForm.patchValue({ nombre: f.nombre, url: f.url });
  }

  cancelarEdicion(): void {
    this.editingId = null;
    this.editForm.reset();
  }

  guardarEdicion(): void {
    if (this.editingId == null || this.editForm.invalid) return;
    const { nombre, url } = this.editForm.value;
    this.formatosService.actualizar(this.editingId, { nombre: nombre?.trim(), url: url?.trim() });
    this.cargarFormatos();
    this.editingId = null;
    this.editForm.reset();
    this.snackbar.exito('Formato actualizado correctamente');
  }

  estaEditando(id: FormatoId): boolean {
    return this.editingId === id;
  }

  truncarUrl(url: string, max = 50): string {
    if (!url) return '';
    return url.length <= max ? url : url.slice(0, max) + '...';
  }
}
