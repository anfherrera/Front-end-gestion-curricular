import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { SolicitudFormComponent } from '../../../../shared/components/solicitud-form/solicitud-form.component';
import { CursosIntersemestralesService, Solicitud, CreateSolicitudDTO } from '../../../../core/services/cursos-intersemestrales.service';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, SolicitudFormComponent, ...MATERIAL_IMPORTS],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent {
  solicitudes: Solicitud[] = [];
  loading = false;

  constructor(private cursosService: CursosIntersemestralesService) {
    this.loadSolicitudes();
  }

  loadSolicitudes() {
    this.loading = true;
    this.cursosService.getSolicitudes().subscribe({
      next: (data) => {
        this.solicitudes = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando solicitudes', err);
        this.loading = false;
      }
    });
  }

  // 🔹 Evento al enviar el formulario de solicitud
  onSubmitSolicitud(formValue: any) {
    const payload: CreateSolicitudDTO = {
      fecha: formValue.fecha,
      estado: 'pendiente'
    };

    this.cursosService.crearSolicitud(payload).subscribe({
      next: (res) => {
        alert('Solicitud enviada correctamente');
        this.loadSolicitudes();
      },
      error: (err) => console.error('Error enviando solicitud', err)
    });
  }

  // 🔹 Opcional: limpiar formulario
  onClearSolicitud() {
    // Aquí puedes resetear algún estado o formulario si lo necesitas
  }
}
