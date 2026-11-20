import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AuthService } from '@core/services/auth.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have the 'Front-end-gestion-curricular' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toEqual('Front-end-gestion-curricular');
  });

  it('should render the router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  describe('período actual al arrancar', () => {
    let inicializar: jasmine.Spy;

    beforeEach(() => {
      spyOn(TestBed.inject(AuthService), 'restoreSession');
      inicializar = spyOn(TestBed.inject(PeriodosAcademicosService), 'inicializarPeriodoActual');
    });

    it('sin sesión no lo pide (el backend responde 403 sin token)', () => {
      spyOn(TestBed.inject(AuthService), 'isAuthenticated').and.returnValue(false);
      TestBed.createComponent(AppComponent).detectChanges();
      expect(inicializar).not.toHaveBeenCalled();
    });

    it('con sesión lo pide', () => {
      spyOn(TestBed.inject(AuthService), 'isAuthenticated').and.returnValue(true);
      TestBed.createComponent(AppComponent).detectChanges();
      expect(inicializar).toHaveBeenCalledTimes(1);
    });
  });
});
