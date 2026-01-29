import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loginRateLimitInterceptor } from './core/interceptors/login-rate-limit.interceptor';
import { PreinscripcionDialogComponent } from './shared/components/preinscripcion-dialog/preinscripcion-dialog.component';

export const appConfig: ApplicationConfig = {
  providers: [
    // Sistema de Diseño TIC: notificaciones en superior derecha, 5 segundos, estilo info por defecto
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        duration: 5000,
        panelClass: ['snackbar-info'],
      },
    },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // INTERCEPTORES: JWT primero (agrega token), luego Error (maneja 401/403)
    // El orden es importante: los interceptores se ejecutan en el orden especificado
    provideHttpClient(
      withInterceptors([
        // Manejo de 429 para login con contador Retry-After
        loginRateLimitInterceptor,
        JwtInterceptor,
        errorInterceptor
      ]), 
      withFetch()
    ),
    importProvidersFrom(BrowserAnimationsModule),
    PreinscripcionDialogComponent
  ]
};
