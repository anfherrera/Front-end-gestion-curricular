import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TituloPaginaStrategy } from '@core/services/titulo-pagina.strategy';
import { TituloPaginaComponent } from '@shared/components/titulo-pagina/titulo-pagina.component';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  imports: [
    RouterModule,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    BreadcrumbComponent,
    TituloPaginaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Quitar ViewEncapsulation.None para que no meta CSS global
})
export class LayoutComponent {
  /** Título H1 de la página activa (el `title` de su ruta) */
  readonly titulo = inject(TituloPaginaStrategy).titulo;

  /** Estado del sidebar */
  isSidebarOpen = true;

  /** Alterna el sidebar desde el header o el propio sidebar */
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
