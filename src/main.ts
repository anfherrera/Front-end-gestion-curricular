import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; // tu archivo de rutas

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // 💡 HTTP disponible globalmente
    provideRouter(routes) // 💡 Router para navegación
  ]
}).catch(err => console.error(err));
