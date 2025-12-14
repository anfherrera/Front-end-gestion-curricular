import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
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
  private periodoSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private periodosService: PeriodosAcademicosService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // 🔹 Restaura la sesión al cargar la app (si había token guardado)
    this.authService.restoreSession();
    
    // 🔹 Inicializa el período académico actual
    this.periodosService.inicializarPeriodoActual();

    // 🔹 Suscribirse a cambios de período para mostrar notificaciones
    this.periodoSubscription = this.periodosService.cambioPeriodo$.subscribe(cambio => {
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
    if (this.periodoSubscription) {
      this.periodoSubscription.unsubscribe();
    }
  }
}
