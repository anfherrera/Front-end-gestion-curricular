import { Component } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  imports: [
    MatIconModule
]
})
export class FooterComponent {
  // Propiedad para mostrar el año actual automáticamente
  currentYear = new Date().getFullYear();
}
