import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { formatearPeriodo } from '@core/utils/periodo.utils';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Front-end-gestion-curricular';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private periodosService: PeriodosAcademicosService,
    private snackbar: SnackbarService
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
        
        this.snackbar.mostrar(
          `El período académico ha cambiado de ${periodoAnteriorTexto} a ${periodoActualTexto}`,
          'destacado',
          8000
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
