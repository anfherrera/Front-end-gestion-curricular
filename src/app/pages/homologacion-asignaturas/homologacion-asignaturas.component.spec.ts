import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomologacionAsignaturasComponent } from './homologacion-asignaturas.component';

describe('HomologacionAsignaturasComponent', () => {
  let component: HomologacionAsignaturasComponent;
  let fixture: ComponentFixture<HomologacionAsignaturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomologacionAsignaturasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomologacionAsignaturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
