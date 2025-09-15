import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MATERIAL_IMPORTS } from '../material.imports';

export interface Curso {
  codigo: string;
  nombre: string;
  docente: string;
  cupos: number;
  estado: 'Disponible' | 'Cerrado' | 'En espera';
}

@Component({
  selector: 'app-curso-list',
  standalone: true,
  imports: [...MATERIAL_IMPORTS],
  templateUrl: './curso-list.component.html',
  styleUrls: ['./curso-list.component.css']
})
export class CursoListComponent implements AfterViewInit {
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

  ngOnChanges() {
    this.dataSource.data = this.cursos;
  }

  aplicarFiltro(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.dataSource.filter = valor.trim().toLowerCase();
  }

  ejecutarAccion(accion: string, curso: Curso) {
    this.accionClick.emit({ accion, curso });
  }
}
