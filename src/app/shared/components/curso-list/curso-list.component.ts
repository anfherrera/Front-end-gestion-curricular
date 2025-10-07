import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MATERIAL_IMPORTS } from '../material.imports';

export interface Curso {
  codigo: string;
  nombre: string;
  docente: string;
  cupos: number;
  creditos?: number;
  espacio?: string;
  estado: 'Disponible' | 'Cerrado' | 'En espera' | 'Preinscripción' | 'Inscripción' | 'Abierto' | 'Publicado' | 'Borrador';
}

@Component({
  selector: 'app-curso-list',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  templateUrl: './curso-list.component.html',
  styleUrls: ['./curso-list.component.css']
})
export class CursoListComponent implements AfterViewInit, OnChanges {
  @Input() cursos: Curso[] = [];
  @Input() displayedColumns: string[] = ['codigo', 'nombre', 'docente', 'cupos', 'estado', 'acciones'];
  @Input() acciones: string[] = []; // ejemplo: ['inscribir', 'aprobar', 'rechazar']

  @Output() accionClick = new EventEmitter<{ accion: string; curso: Curso }>();

  dataSource = new MatTableDataSource<Curso>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cursos']) {
      this.dataSource.data = this.cursos;
    }
  }

  aplicarFiltro(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.dataSource.filter = valor.trim().toLowerCase();
  }

  ejecutarAccion(accion: string, curso: Curso) {
    this.accionClick.emit({ accion, curso });
  }

  getAccionDisplayName(accion: string): string {
    switch (accion) {
      case 'preinscribir':
        return 'Señalar el curso';
      case 'inscribir':
        return 'Inscribirse';
      case 'ver':
        return 'Ver detalles';
      default:
        return accion.charAt(0).toUpperCase() + accion.slice(1);
    }
  }

  getAccionIcon(accion: string): string {
    switch (accion) {
      case 'preinscribir':
        return 'touch_app';
      case 'inscribir':
        return 'person_add';
      case 'ver':
        return 'visibility';
      default:
        return 'more_vert';
    }
  }

  getAccionIconClass(accion: string): string {
    switch (accion) {
      case 'preinscribir':
        return 'preinscribir-icon';
      case 'inscribir':
        return 'inscribir-icon';
      case 'ver':
        return 'ver-icon';
      default:
        return 'default-icon';
    }
  }
}
