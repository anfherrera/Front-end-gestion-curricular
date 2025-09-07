import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Front-end-gestion-curricular';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // 🔹 Restaura la sesión al cargar la app (si había token guardado)
    this.authService.restoreSession();
  }
}
