import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Desde Angular 19.2.16 el servidor pasa un BootstrapContext por petición (aislamiento del
// injector de plataforma entre peticiones SSR); hay que reenviarlo a bootstrapApplication.
const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
