import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { formatearPeriodo } from '@core/utils/periodo.utils';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private periodosService = inject(PeriodosAcademicosService);
  private snackbar = inject(SnackbarService);

  title = 'Front-end-gestion-curricular';
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.authService.restoreSession();
    this.periodosService.inicializarPeriodoActual();

    this.periodosService.cambioPeriodo$.pipe(
      takeUntilDestroyed(this.destroyRef)
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
}
