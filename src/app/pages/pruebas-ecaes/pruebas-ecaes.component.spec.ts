import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PruebasEcaesComponent } from './pruebas-ecaes.component';

describe('PruebasEcaesComponent', () => {
  let component: PruebasEcaesComponent;
  let fixture: ComponentFixture<PruebasEcaesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PruebasEcaesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PruebasEcaesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
