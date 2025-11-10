import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CardContainerComponent } from '../card-container/card-container.component';
import { RequestStatusTableComponent } from '../request-status/request-status.component';
@Component({
  selector: 'app-approved-requests-section',
  standalone: true,
  imports: [
    CommonModule,
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
  @Input() title: string = 'Solicitudes aprobadas';
  @Input() icon: string = 'task_alt';
  @Input() solicitudes: any[] = [];
  @Input() loading: boolean = false;
  @Input() emptyMessage: string = 'No hay solicitudes aprobadas todavía.';
  @Input() allowToggle: boolean = true;

  private _initiallyExpanded: boolean = true;
  showContent: boolean = true;

  @Input()
  set initiallyExpanded(value: boolean) {
    this._initiallyExpanded = value;
    this.showContent = value;
  }

  get initiallyExpanded(): boolean {
    return this._initiallyExpanded;
  }

  toggleSection(): void {
    if (!this.allowToggle) {
      return;
    }
    this.showContent = !this.showContent;
  }

  get hasSolicitudes(): boolean {
    return this.solicitudes && this.solicitudes.length > 0;
  }
}

