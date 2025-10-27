import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { PreinscripcionDialogComponent } from './shared/components/preinscripcion-dialog/preinscripcion-dialog.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    // ✅ INTERCEPTOR ARREGLADO: Ya no cancela peticiones con token expirado
    provideHttpClient(withInterceptors([JwtInterceptor]), withFetch()),
    importProvidersFrom(BrowserAnimationsModule),
    PreinscripcionDialogComponent
  ]
};
