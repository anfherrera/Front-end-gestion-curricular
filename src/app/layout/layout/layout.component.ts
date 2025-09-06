import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../../core/services/auth.service';
import { PazSalvoDialogComponent } from '../../pages/paz-salvo/estudiante/paz-salvo-dialog.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    HeaderComponent,
    FooterComponent
  ],
  encapsulation: ViewEncapsulation.None
})
export class LayoutComponent {
  isSidebarOpen = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.authService.logout();
  }

  handlePazSalvoClick() {
    const role = this.authService.getRole();

    // Estudiante: abrir diálogo
    if (role === 'estudiante') {
      const dialogRef = this.dialog.open(PazSalvoDialogComponent, { width: '500px' });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.router.navigate(['/paz-salvo/estudiante']);
        }
      });
      return;
    }

    // Otros roles: navegar directo según rol
    switch(role) {
      case 'funcionario':
        this.router.navigate(['/paz-salvo/funcionario']);
        break;
      case 'coordinador':
        this.router.navigate(['/paz-salvo/coordinador']);
        break;
      case 'secretaria':
        this.router.navigate(['/paz-salvo/secretaria']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}
