import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { PeriodosAcademicosService } from './core/services/periodos-academicos.service';
import { formatearPeriodo } from './core/utils/periodo.utils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Front-end-gestion-curricular';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private periodosService: PeriodosAcademicosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.authService.restoreSession();
    this.periodosService.inicializarPeriodoActual();

    this.periodosService.cambioPeriodo$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cambio => {
      if (cambio && cambio.anterior && cambio.actual) {
        const periodoAnteriorTexto = cambio.anterior.nombrePeriodo || formatearPeriodo(cambio.anterior.valor);
        const periodoActualTexto = cambio.actual.nombrePeriodo || formatearPeriodo(cambio.actual.valor);
        
        this.snackBar.open(
          `El período académico ha cambiado de ${periodoAnteriorTexto} a ${periodoActualTexto}`,
          'Cerrar',
          {
            duration: 8000,
            panelClass: ['periodo-cambio-notification']
          }
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
