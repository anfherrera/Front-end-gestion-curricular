import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageProcessesComponent } from './manage-processes.component';

describe('ManageProcessesComponent', () => {
  let component: ManageProcessesComponent;
  let fixture: ComponentFixture<ManageProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageProcessesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageProcessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
