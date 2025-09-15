import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cursos-intersemestrales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cursos-intersemestrales.component.html',
  styleUrls: ['./cursos-intersemestrales.component.css']
})
export class CursosIntersemestralesComponent {}
