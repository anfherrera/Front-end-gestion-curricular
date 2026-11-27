import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { provideRouter, TitleStrategy } from '@angular/router';
import { TituloPaginaStrategy } from '@core/services/titulo-pagina.strategy';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { JwtInterceptor } from '@core/interceptors/jwt.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { loginRateLimitInterceptor } from '@core/interceptors/login-rate-limit.interceptor';

// Fechas y números en formato colombiano (date:'short' → "19/11/26, 11:13 a. m.")
registerLocaleData(localeEsCO);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' },
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
    // Título de cada página (H1 del layout y pestaña del navegador) desde el `title` de la ruta
    { provide: TitleStrategy, useExisting: TituloPaginaStrategy },
    provideClientHydration(withEventReplay()),
    // INTERCEPTORES: JWT primero (agrega token), luego Error (maneja 401/403)
    // El orden es importante: los interceptores se ejecutan en el orden especificado
    provideHttpClient(
      withInterceptors([
        // Manejo de 429 para login con contador Retry-After
        loginRateLimitInterceptor,
        JwtInterceptor,
        errorInterceptor,
      ]),
      withFetch()
    ),
    importProvidersFrom(BrowserAnimationsModule),
  ],
};
