import { Component, computed, input, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { Solicitud } from '@core/models/procesos.model';
import { CardContainerComponent } from '../card-container/card-container.component';
import { RequestStatusTableComponent } from '../request-status/request-status.component';
@Component({
  selector: 'app-approved-requests-section',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CardContainerComponent,
    RequestStatusTableComponent
],
  templateUrl: './approved-requests-section.component.html',
  styleUrls: ['./approved-requests-section.component.css']
})
export class ApprovedRequestsSectionComponent {
  readonly title = input('Solicitudes aprobadas');
  readonly icon = input('task_alt');
  readonly solicitudes = input<Solicitud[]>([]);
  readonly loading = input(false);
  readonly emptyMessage = input('No hay solicitudes aprobadas todavía.');
  readonly allowToggle = input(true);

  readonly showContent = signal(true);
  readonly hasSolicitudes = computed(() => (this.solicitudes() ?? []).length > 0);

  toggleSection(): void {
    if (!this.allowToggle()) {
      return;
    }
    this.showContent.update(visible => !visible);
  }
}
