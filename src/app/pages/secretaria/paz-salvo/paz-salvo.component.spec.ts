import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PazSalvoComponent } from './paz-salvo.component';

describe('PazSalvoComponent', () => {
  let component: PazSalvoComponent;
  let fixture: ComponentFixture<PazSalvoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PazSalvoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PazSalvoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
