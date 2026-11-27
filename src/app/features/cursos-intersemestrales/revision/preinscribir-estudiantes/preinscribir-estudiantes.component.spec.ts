import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { AuthService } from '@core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CursoOfertadoVerano, SolicitudCursoVerano } from '@core/models/cursos-intersemestrales.model';
import { UserRole } from '@core/enums/roles.enum';

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
      'getCursosPorEstado',
      'getCursoPorId',
      'getPreinscripcionesPorCurso',
      'getSolicitudesCursoNuevo',
      'aprobarPreinscripcion',
      'rechazarPreinscripcion',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario', 'getRole']);
    authServiceSpy.getRole.and.returnValue(UserRole.FUNCIONARIO);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    // Mockear los métodos que se llaman en ngOnInit
    cursosServiceSpy.getCursosDisponibles.and.returnValue(of([]));
    cursosServiceSpy.getCursosPorEstado.and.returnValue(of([]));
    cursosServiceSpy.getPreinscripcionesPorCurso.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PreinscribirEstudiantesComponent, HttpClientTestingModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: CursosIntersemestralesService, useValue: cursosServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreinscribirEstudiantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el estado con el texto legible y deja tal cual los que no conoce', () => {
    const curso: CursoOfertadoVerano = {
      id_curso: 3,
      nombre_curso: 'Metodología de la Investigación',
      codigo_curso: 'MET-101',
      descripcion: '',
      fecha_inicio: '2026-12-01T00:00:00',
      fecha_fin: '2027-01-15T00:00:00',
      cupo_maximo: 30,
      cupo_disponible: 30,
      cupo_estimado: 30,
      espacio_asignado: 'Salón 101',
      estado: 'Inscripción',
      objMateria: { id_materia: 3, codigo: 'MET-101', nombre: 'Metodología de la Investigación', creditos: 3 },
    };
    const solicitud = (id: number, estado: string): SolicitudCursoVerano => ({
      id_solicitud: id,
      nombre_solicitud: 'Preinscripción Curso de Verano',
      fecha_solicitud: new Date('2026-11-20T10:00:00'),
      estado,
      objUsuario: {
        id_usuario: 27,
        nombre_completo: 'Daniel Cisneros',
        codigo: '104612345678',
        correo: 'dcisneros@unicauca.edu.co',
      },
      tipoSolicitud: 'PREINSCRIPCION',
    });
    cursosServiceSpy.getCursoPorId.and.returnValue(of(curso));
    cursosServiceSpy.getPreinscripcionesPorCurso.and.returnValue(
      of([solicitud(1, 'APROBADA_FUNCIONARIO'), solicitud(2, 'ENVIADA'), solicitud(3, 'Aprobado')])
    );

    component.cargarSolicitudesPorCurso(3);
    fixture.detectChanges();

    // Solo el texto de la etiqueta, sin el nombre del icono
    const etiquetas = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.etiqueta-estado'), (el) =>
      Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .trim()
    );
    expect(etiquetas).toEqual(['Aprobada por Funcionario', 'Enviada', 'Aprobado']);
  });
});
