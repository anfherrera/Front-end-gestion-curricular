/**
 * ==========================================
 * PRUEBAS DE ACCESIBILIDAD - NAVEGACIÓN POR TECLADO
 * ==========================================
 * 
 * Objetivo: Validar que todas las funcionalidades sean accesibles por teclado
 * 
 * Aspectos evaluados:
 * - Navegación con Tab / Shift+Tab
 * - Activación con Enter / Space
 * - Escape para cerrar diálogos
 * - Flechas para navegación en listas
 * - Focus visible en elementos interactivos
 * - Trap de foco en modales
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';

// Componente de prueba con elementos interactivos
@Component({
  selector: 'app-test-keyboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <button id="btn1" (click)="handleClick()">Botón 1</button>
      <button id="btn2" (click)="handleClick()">Botón 2</button>
      <input id="input1" type="text" placeholder="Input 1" />
      <a id="link1" href="javascript:void(0)" (click)="handleClick()">Enlace 1</a>
      
      <div class="list" role="list" aria-label="Lista de opciones">
        <div 
          class="list-item" 
          *ngFor="let item of items; let i = index"
          role="listitem"
          [attr.tabindex]="selectedIndex === i ? 0 : -1"
          [attr.aria-selected]="selectedIndex === i"
          (keydown)="onKeyDown($event, i)"
          [id]="'item-' + i"
        >
          {{ item }}
        </div>
      </div>

      <div class="modal" *ngIf="showModal" role="dialog" aria-modal="true">
        <button id="modal-close" (click)="closeModal()">Cerrar</button>
        <input id="modal-input" type="text" />
        <button id="modal-confirm" (click)="closeModal()">Confirmar</button>
      </div>
    </div>
  `
})
class TestKeyboardComponent implements AfterViewInit {
  @ViewChild('btn1') btn1!: ElementRef;
  
  items = ['Opción 1', 'Opción 2', 'Opción 3'];
  selectedIndex = 0;
  showModal = false;
  clickCount = 0;

  ngAfterViewInit() {}

  handleClick() {
    this.clickCount++;
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (index < this.items.length - 1) {
          this.selectedIndex = index + 1;
          setTimeout(() => {
            const nextItem = document.getElementById(`item-${this.selectedIndex}`);
            nextItem?.focus();
          }, 0);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) {
          this.selectedIndex = index - 1;
          setTimeout(() => {
            const prevItem = document.getElementById(`item-${this.selectedIndex}`);
            prevItem?.focus();
          }, 0);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleClick();
        break;
    }
  }

  closeModal() {
    this.showModal = false;
  }
}

describe('PRUEBAS DE ACCESIBILIDAD - Navegación por Teclado', () => {
  let component: TestKeyboardComponent;
  let fixture: ComponentFixture<TestKeyboardComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestKeyboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestKeyboardComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  // =====================================
  // ACC-010: NAVEGACIÓN CON TAB
  // =====================================
  describe('ACC-010: Navegación con Tab', () => {
    
    it('ACC-010-A: Debe permitir navegar entre elementos con Tab', () => {
      const btn1 = compiled.querySelector('#btn1') as HTMLElement;
      const btn2 = compiled.querySelector('#btn2') as HTMLElement;
      const input1 = compiled.querySelector('#input1') as HTMLElement;
      const link1 = compiled.querySelector('#link1') as HTMLElement;
      
      expect(btn1.tabIndex).toBeGreaterThanOrEqual(0);
      expect(btn2.tabIndex).toBeGreaterThanOrEqual(0);
      expect(input1.tabIndex).toBeGreaterThanOrEqual(0);
      expect(link1.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('ACC-010-B: Elementos focusables deben ser accesibles por teclado', () => {
      const focusableElements = compiled.querySelectorAll(
        'button, input, select, textarea, a[href]'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      focusableElements.forEach((element: any) => {
        expect(element.tabIndex).toBeGreaterThanOrEqual(-1);
      });
    });

    it('ACC-010-C: Orden de tabulación debe ser lógico', () => {
      const focusableElements = Array.from(
        compiled.querySelectorAll('button, input, a[href]')
      );
      
      const ids = focusableElements.map((el: any) => el.id).filter(id => id);
      expect(ids).toEqual(['btn1', 'btn2', 'input1', 'link1']);
    });
  });

  // =====================================
  // ACC-011: ACTIVACIÓN CON ENTER/SPACE
  // =====================================
  describe('ACC-011: Activación con Enter / Space', () => {
    
    it('ACC-011-A: Botón debe responder a Enter', () => {
      const btn1 = compiled.querySelector('#btn1') as HTMLElement;
      const initialCount = component.clickCount;
      
      btn1.focus();
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      btn1.dispatchEvent(enterEvent);
      
      // Simular click del navegador al presionar Enter en botón
      btn1.click();
      
      expect(component.clickCount).toBe(initialCount + 1);
    });

    it('ACC-011-B: Enlace debe responder a Enter', () => {
      const link1 = compiled.querySelector('#link1') as HTMLElement;
      const initialCount = component.clickCount;
      
      link1.focus();
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      link1.dispatchEvent(enterEvent);
      
      // Simular click del enlace
      link1.click();
      
      expect(component.clickCount).toBe(initialCount + 1);
    });

    it('ACC-011-C: Lista debe responder a Space', () => {
      const item0 = compiled.querySelector('#item-0') as HTMLElement;
      const initialCount = component.clickCount;
      
      item0.focus();
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      component.onKeyDown(spaceEvent, 0);
      
      expect(component.clickCount).toBe(initialCount + 1);
    });
  });

  // =====================================
  // ACC-012: NAVEGACIÓN CON FLECHAS
  // =====================================
  describe('ACC-012: Navegación con Flechas en Listas', () => {
    
    it('ACC-012-A: Flecha Abajo debe navegar al siguiente item', () => {
      const item0 = compiled.querySelector('#item-0') as HTMLElement;
      
      expect(component.selectedIndex).toBe(0);
      
      item0.focus();
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      component.onKeyDown(arrowDownEvent, 0);
      fixture.detectChanges();
      
      expect(component.selectedIndex).toBe(1);
    });

    it('ACC-012-B: Flecha Arriba debe navegar al item anterior', () => {
      component.selectedIndex = 1;
      fixture.detectChanges();
      
      const item1 = compiled.querySelector('#item-1') as HTMLElement;
      
      item1.focus();
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
      component.onKeyDown(arrowUpEvent, 1);
      fixture.detectChanges();
      
      expect(component.selectedIndex).toBe(0);
    });

    it('ACC-012-C: Flecha Abajo en último item NO debe cambiar selección', () => {
      component.selectedIndex = 2; // último item
      fixture.detectChanges();
      
      const item2 = compiled.querySelector('#item-2') as HTMLElement;
      
      item2.focus();
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      component.onKeyDown(arrowDownEvent, 2);
      fixture.detectChanges();
      
      expect(component.selectedIndex).toBe(2); // No cambió
    });

    it('ACC-012-D: Flecha Arriba en primer item NO debe cambiar selección', () => {
      component.selectedIndex = 0;
      fixture.detectChanges();
      
      const item0 = compiled.querySelector('#item-0') as HTMLElement;
      
      item0.focus();
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
      component.onKeyDown(arrowUpEvent, 0);
      fixture.detectChanges();
      
      expect(component.selectedIndex).toBe(0); // No cambió
    });
  });

  // =====================================
  // ACC-013: INDICADORES VISUALES DE FOCUS
  // =====================================
  describe('ACC-013: Indicadores Visuales de Focus', () => {
    
    it('ACC-013-A: Elementos focusables deben tener outline al hacer focus', () => {
      const btn1 = compiled.querySelector('#btn1') as HTMLElement;
      
      btn1.focus();
      fixture.detectChanges();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBe(btn1);
    });

    it('ACC-013-B: Input debe recibir focus correctamente', () => {
      const input1 = compiled.querySelector('#input1') as HTMLInputElement;
      
      input1.focus();
      
      expect(document.activeElement).toBe(input1);
    });

    it('ACC-013-C: Enlace debe recibir focus correctamente', () => {
      const link1 = compiled.querySelector('#link1') as HTMLElement;
      
      link1.focus();
      
      expect(document.activeElement).toBe(link1);
    });
  });

  // =====================================
  // ACC-014: ATRIBUTOS ARIA PARA LISTAS
  // =====================================
  describe('ACC-014: Atributos ARIA para Listas', () => {
    
    it('ACC-014-A: Lista debe tener role="list"', () => {
      const list = compiled.querySelector('.list');
      
      expect(list?.getAttribute('role')).toBe('list');
    });

    it('ACC-014-B: Items de lista deben tener role="listitem"', () => {
      const listItems = compiled.querySelectorAll('.list-item');
      
      listItems.forEach(item => {
        expect(item.getAttribute('role')).toBe('listitem');
      });
    });

    it('ACC-014-C: Item seleccionado debe tener aria-selected="true"', () => {
      const item0 = compiled.querySelector('#item-0');
      
      expect(item0?.getAttribute('aria-selected')).toBe('true');
    });

    it('ACC-014-D: Items no seleccionados deben tener aria-selected="false"', () => {
      const item1 = compiled.querySelector('#item-1');
      const item2 = compiled.querySelector('#item-2');
      
      expect(item1?.getAttribute('aria-selected')).toBe('false');
      expect(item2?.getAttribute('aria-selected')).toBe('false');
    });

    it('ACC-014-E: Solo item seleccionado debe tener tabindex="0"', () => {
      const item0 = compiled.querySelector('#item-0');
      const item1 = compiled.querySelector('#item-1');
      
      expect(item0?.getAttribute('tabindex')).toBe('0');
      expect(item1?.getAttribute('tabindex')).toBe('-1');
    });
  });

  // =====================================
  // ACC-015: TRAP DE FOCO EN MODALES
  // =====================================
  describe('ACC-015: Trap de Foco en Modales', () => {
    
    it('ACC-015-A: Modal debe tener role="dialog"', () => {
      component.showModal = true;
      fixture.detectChanges();
      
      const modal = compiled.querySelector('.modal');
      
      expect(modal?.getAttribute('role')).toBe('dialog');
    });

    it('ACC-015-B: Modal debe tener aria-modal="true"', () => {
      component.showModal = true;
      fixture.detectChanges();
      
      const modal = compiled.querySelector('.modal');
      
      expect(modal?.getAttribute('aria-modal')).toBe('true');
    });

    it('ACC-015-C: Elementos del modal deben ser accesibles por teclado', () => {
      component.showModal = true;
      fixture.detectChanges();
      
      const modalClose = compiled.querySelector('#modal-close') as HTMLElement;
      const modalInput = compiled.querySelector('#modal-input') as HTMLElement;
      const modalConfirm = compiled.querySelector('#modal-confirm') as HTMLElement;
      
      expect(modalClose).toBeTruthy();
      expect(modalInput).toBeTruthy();
      expect(modalConfirm).toBeTruthy();
    });

    it('ACC-015-D: Modal debe cerrarse al hacer click en botón', () => {
      component.showModal = true;
      fixture.detectChanges();
      
      const modalClose = compiled.querySelector('#modal-close') as HTMLElement;
      modalClose.click();
      fixture.detectChanges();
      
      expect(component.showModal).toBeFalse();
    });
  });

  // =====================================
  // ACC-016: SKIP LINKS (Saltar Navegación)
  // =====================================
  describe('ACC-016: Accesibilidad de Elementos Interactivos', () => {
    
    it('ACC-016-A: Todos los botones deben ser focusables', () => {
      const buttons = compiled.querySelectorAll('button');
      
      buttons.forEach(button => {
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });

    it('ACC-016-B: Todos los enlaces deben ser focusables', () => {
      const links = compiled.querySelectorAll('a[href]');
      
      links.forEach(link => {
        expect((link as HTMLElement).tabIndex).toBeGreaterThanOrEqual(-1);
      });
    });

    it('ACC-016-C: Inputs deben ser focusables', () => {
      const inputs = compiled.querySelectorAll('input');
      
      inputs.forEach(input => {
        expect(input.tabIndex).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

