import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  imports: [
    RouterModule,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    BreadcrumbComponent
  ]
  // Quitar ViewEncapsulation.None para que no meta CSS global
})
export class LayoutComponent {
  /** Estado del sidebar */
  isSidebarOpen = true;

  /** Alterna el sidebar desde el header o el propio sidebar */
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
