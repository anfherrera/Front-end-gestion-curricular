import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { PreinscribirEstudiantesComponent } from './preinscribir-estudiantes.component';

describe('PreinscribirEstudiantesComponent', () => {
  let component: PreinscribirEstudiantesComponent;
  let fixture: ComponentFixture<PreinscribirEstudiantesComponent>;
  let cursosServiceSpy: jasmine.SpyObj<CursosIntersemestralesService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    cursosServiceSpy = jasmine.createSpyObj('CursosIntersemestralesService', [
      'getCursosDisponibles',
      'getSolicitudesCursoNuevo',
      'aprobarPreinscripcion',
      'rechazarPreinscripcion'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Mockear los métodos que se llaman en ngOnInit
    cursosServiceSpy.getCursosDisponibles.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        PreinscribirEstudiantesComponent,
        HttpClientTestingModule,
        MatSnackBarModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CursosIntersemestralesService, useValue: cursosServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreinscribirEstudiantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
