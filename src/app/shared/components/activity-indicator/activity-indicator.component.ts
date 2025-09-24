import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-activity-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="activity-indicator" [class.warning]="showWarning" [class.inactive]="!isActive">
      <mat-icon 
        [matTooltip]="getTooltipText()"
        [class.warning-icon]="showWarning"
        [class.inactive-icon]="!isActive">
        {{ getIcon() }}
      </mat-icon>
      <span *ngIf="showWarning" class="warning-text">Sesión expirando</span>
    </div>
  `,
  styles: [`
    .activity-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 20px;
      background-color: rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    .activity-indicator.warning {
      background-color: rgba(255, 193, 7, 0.2);
      border: 1px solid rgba(255, 193, 7, 0.5);
      animation: pulse 1s infinite;
    }

    .activity-indicator.inactive {
      background-color: rgba(220, 53, 69, 0.2);
      border: 1px solid rgba(220, 53, 69, 0.5);
    }

    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #4caf50;
      transition: color 0.3s ease;
    }

    .warning-icon {
      color: #ffc107 !important;
    }

    .inactive-icon {
      color: #dc3545 !important;
    }

    .warning-text {
      font-size: 12px;
      font-weight: 500;
      color: #ffc107;
      white-space: nowrap;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    @media (max-width: 768px) {
      .warning-text {
        display: none;
      }
    }
  `]
})
export class ActivityIndicatorComponent implements OnInit, OnDestroy {
  isActive = true;
  showWarning = false;
  
  private activitySubscription?: Subscription;
  private warningSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Suscribirse al estado de actividad
    this.activitySubscription = this.authService.getActivityStatus().subscribe(
      active => this.isActive = active
    );

    // Suscribirse al estado de advertencia
    this.warningSubscription = this.authService.getWarningStatus().subscribe(
      warning => this.showWarning = warning
    );
  }

  ngOnDestroy(): void {
    this.activitySubscription?.unsubscribe();
    this.warningSubscription?.unsubscribe();
  }

  getIcon(): string {
    if (this.showWarning) return 'warning';
    if (!this.isActive) return 'error';
    return 'check_circle';
  }

  getTooltipText(): string {
    if (this.showWarning) return 'Tu sesión expirará en 1 minuto por inactividad';
    if (!this.isActive) return 'Sesión inactiva - Serás deslogueado pronto';
    return 'Sesión activa';
  }
}
