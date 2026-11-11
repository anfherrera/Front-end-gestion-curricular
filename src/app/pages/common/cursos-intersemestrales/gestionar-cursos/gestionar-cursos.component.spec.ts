import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { CursoEstadosService } from '../../../../core/services/curso-estados.service';
import { ErrorHandlerService } from '../../../../shared/components/error-handler/error-handler.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { GestionarCursosComponent } from './gestionar-cursos.component';

describe('GestionarCursosComponent', () => {
  let component: GestionarCursosComponent;
  let fixture: ComponentFixture<GestionarCursosComponent>;
  let cursosServiceSpy: jasmine.SpyObj<CursosIntersemestralesService>;
  let estadosServiceSpy: jasmine.SpyObj<CursoEstadosService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandlerService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    cursosServiceSpy = jasmine.createSpyObj('CursosIntersemestralesService', [
      'getTodosLosCursosParaFuncionarios',
      'getMateriasFiltro',
      'getTodasLasMaterias',
      'getTodosLosDocentes',
      'createCurso',
      'updateCurso',
      'deleteCurso'
    ]);
    estadosServiceSpy = jasmine.createSpyObj('CursoEstadosService', [
      'getEstadosDisponibles', 
      'getEstadosPermitidos', 
      'getEstadosParaRol',
      'getColorEstado',
      'getIconoEstado',
      'validarTransicionEstado'
    ]);
    errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Mockear los métodos que se llaman en ngOnInit
    cursosServiceSpy.getTodosLosCursosParaFuncionarios.and.returnValue(of([]));
    cursosServiceSpy.getMateriasFiltro.and.returnValue(of([]));
    cursosServiceSpy.getTodasLasMaterias.and.returnValue(of([]));
    cursosServiceSpy.getTodosLosDocentes.and.returnValue(of([]));
    estadosServiceSpy.getEstadosDisponibles.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [
        GestionarCursosComponent,
        HttpClientTestingModule,
        MatSnackBarModule,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CursosIntersemestralesService, useValue: cursosServiceSpy },
        { provide: CursoEstadosService, useValue: estadosServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionarCursosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
