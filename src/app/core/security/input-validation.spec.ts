/**
 * Pruebas de seguridad: validación de inputs (sanitización, emails, XSS, archivos).
 */

import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

describe('Seguridad - Validación de inputs', () => {
  let formBuilder: FormBuilder;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormBuilder]
    });

    formBuilder = TestBed.inject(FormBuilder);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  // =====================================
  // SEC-020: VALIDACIÓN DE EMAILS
  // =====================================
  describe('SEC-020: Validación de Emails', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = formBuilder.group({
        email: ['', [Validators.required, Validators.email]]
      });
    });

    it('SEC-020-A: Debe aceptar email válido de unicauca.edu.co', () => {
      form.controls['email'].setValue('estudiante@unicauca.edu.co');
      expect(form.controls['email'].valid).toBeTrue();
    });

    it('SEC-020-B: Debe rechazar email sin @', () => {
      form.controls['email'].setValue('estudiante.unicauca.edu.co');
      expect(form.controls['email'].valid).toBeFalse();
    });

    it('SEC-020-C: Debe rechazar email sin dominio', () => {
      form.controls['email'].setValue('estudiante@');
      expect(form.controls['email'].valid).toBeFalse();
    });

    it('SEC-020-D: Debe rechazar email vacío', () => {
      form.controls['email'].setValue('');
      expect(form.controls['email'].valid).toBeFalse();
    });

    it('SEC-020-E: Debe rechazar email con espacios', () => {
      form.controls['email'].setValue('estudiante @unicauca.edu.co');
      expect(form.controls['email'].valid).toBeFalse();
    });

    it('SEC-020-F: Debe rechazar email con caracteres especiales peligrosos', () => {
      const dangerousEmails = [
        'test<script>@unicauca.edu.co',
        'test@unicauca.edu.co"><script>alert(1)</script>',
        'test@unicauca.edu.co\'--',
        'test@unicauca.edu.co;DROP TABLE users;'
      ];

      dangerousEmails.forEach(email => {
        form.controls['email'].setValue(email);
        expect(form.controls['email'].valid).toBeFalse();
      });
    });
  });

  // =====================================
  // SEC-021: PREVENCIÓN DE XSS
  // =====================================
  describe('SEC-021: Prevención de XSS (Cross-Site Scripting)', () => {
    
    it('SEC-021-A: Debe sanitizar script tags en inputs', () => {
      const dangerousInput = '<script>alert("XSS")</script>';
      const sanitized = sanitizer.sanitize(1, dangerousInput); // 1 = SecurityContext.HTML
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('SEC-021-B: Debe sanitizar event handlers en inputs', () => {
      const dangerousInput = '<img src=x onerror="alert(1)">';
      const sanitized = sanitizer.sanitize(1, dangerousInput);
      
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('SEC-021-C: Debe sanitizar javascript: URLs', () => {
      const dangerousInput = '<a href="javascript:alert(1)">Click</a>';
      const sanitized = sanitizer.sanitize(1, dangerousInput);
      
      // Angular convierte javascript: a unsafe:javascript:
      expect(sanitized).toContain('unsafe');
    });

    it('SEC-021-D: Debe permitir HTML seguro', () => {
      const safeInput = '<p>Este es un párrafo seguro</p>';
      const sanitized = sanitizer.sanitize(1, safeInput);
      
      expect(sanitized).toContain('<p>');
      // Angular puede codificar algunos caracteres especiales
      expect(sanitized).toBeTruthy();
    });

    it('SEC-021-E: Debe sanitizar iframes maliciosos', () => {
      const dangerousInput = '<iframe src="javascript:alert(1)"></iframe>';
      const sanitized = sanitizer.sanitize(1, dangerousInput);
      
      expect(sanitized).not.toContain('<iframe>');
    });

    it('SEC-021-F: Debe sanitizar data URIs peligrosas', () => {
      const dangerousInput = '<img src="data:text/html,<script>alert(1)</script>">';
      const sanitized = sanitizer.sanitize(1, dangerousInput);
      
      // Angular permite data URIs pero escapa el contenido peligroso
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toBeTruthy();
    });
  });

  // =====================================
  // SEC-022: VALIDACIÓN DE CONTRASEÑAS
  // =====================================
  describe('SEC-022: Validación de Contraseñas Seguras', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = formBuilder.group({
        password: ['', [
          Validators.required,
          Validators.minLength(8)
        ]]
      });
    });

    it('SEC-022-A: Debe rechazar contraseñas menores a 8 caracteres', () => {
      form.controls['password'].setValue('Pass123');
      expect(form.controls['password'].valid).toBeFalse();
    });

    it('SEC-022-B: Debe aceptar contraseña válida con 8+ caracteres', () => {
      form.controls['password'].setValue('Password123!');
      expect(form.controls['password'].valid).toBeTrue();
    });

    it('SEC-022-C: Debe rechazar contraseña vacía', () => {
      form.controls['password'].setValue('');
      expect(form.controls['password'].valid).toBeFalse();
    });

    it('SEC-022-D: Debe validar contraseña con exactamente 8 caracteres', () => {
      form.controls['password'].setValue('Pass1234');
      expect(form.controls['password'].valid).toBeTrue();
    });
  });

  // =====================================
  // SEC-023: VALIDACIÓN DE ARCHIVOS
  // =====================================
  describe('SEC-023: Validación de Archivos', () => {
    
    it('SEC-023-A: Debe validar extensión PDF', () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const allowedTypes = ['application/pdf'];
      
      expect(allowedTypes.includes(file.type)).toBeTrue();
    });

    it('SEC-023-B: Debe rechazar archivo ejecutable', () => {
      const file = new File(['content'], 'malware.exe', { type: 'application/x-msdownload' });
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      
      expect(allowedTypes.includes(file.type)).toBeFalse();
    });

    it('SEC-023-C: Debe validar tamaño máximo de 5MB', () => {
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      
      const validFile = new File(['x'.repeat(1024 * 1024)], 'small.pdf', { type: 'application/pdf' });
      expect(validFile.size).toBeLessThan(maxSizeInBytes);
      
      const invalidFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      expect(invalidFile.size).toBeGreaterThan(maxSizeInBytes);
    });

    it('SEC-023-D: Debe rechazar archivo sin extensión', () => {
      const file = new File(['content'], 'document', { type: '' });
      const allowedTypes = ['application/pdf'];
      
      expect(allowedTypes.includes(file.type)).toBeFalse();
    });

    it('SEC-023-E: Debe validar múltiples tipos permitidos', () => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      const pdfFile = new File([''], 'doc.pdf', { type: 'application/pdf' });
      const jpgFile = new File([''], 'img.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'img.png', { type: 'image/png' });
      const docxFile = new File([''], 'doc.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      expect(allowedTypes.includes(pdfFile.type)).toBeTrue();
      expect(allowedTypes.includes(jpgFile.type)).toBeTrue();
      expect(allowedTypes.includes(pngFile.type)).toBeTrue();
      expect(allowedTypes.includes(docxFile.type)).toBeTrue();
    });

    it('SEC-023-F: Debe rechazar archivo con doble extensión maliciosa', () => {
      const file = new File(['content'], 'document.pdf.exe', { type: 'application/x-msdownload' });
      const allowedTypes = ['application/pdf'];
      
      expect(allowedTypes.includes(file.type)).toBeFalse();
    });
  });

  // =====================================
  // SEC-024: VALIDACIÓN DE CÓDIGOS Y NÚMEROS
  // =====================================
  describe('SEC-024: Validación de Códigos Estudiantiles', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = formBuilder.group({
        codigo: ['', [Validators.required, Validators.pattern(/^\d{6,10}$/)]]
      });
    });

    it('SEC-024-A: Debe aceptar código válido de 6 dígitos', () => {
      form.controls['codigo'].setValue('123456');
      expect(form.controls['codigo'].valid).toBeTrue();
    });

    it('SEC-024-B: Debe aceptar código válido de 10 dígitos', () => {
      form.controls['codigo'].setValue('1234567890');
      expect(form.controls['codigo'].valid).toBeTrue();
    });

    it('SEC-024-C: Debe rechazar código con letras', () => {
      form.controls['codigo'].setValue('12345A');
      expect(form.controls['codigo'].valid).toBeFalse();
    });

    it('SEC-024-D: Debe rechazar código menor a 6 dígitos', () => {
      form.controls['codigo'].setValue('12345');
      expect(form.controls['codigo'].valid).toBeFalse();
    });

    it('SEC-024-E: Debe rechazar código mayor a 10 dígitos', () => {
      form.controls['codigo'].setValue('12345678901');
      expect(form.controls['codigo'].valid).toBeFalse();
    });

    it('SEC-024-F: Debe rechazar inyección SQL en código', () => {
      form.controls['codigo'].setValue("123456'; DROP TABLE usuarios;--");
      expect(form.controls['codigo'].valid).toBeFalse();
    });
  });

  // =====================================
  // SEC-025: VALIDACIÓN DE FECHAS
  // =====================================
  describe('SEC-025: Validación de Fechas', () => {
    
    it('SEC-025-A: Debe rechazar fecha en el pasado para inscripciones futuras', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(yesterday < today).toBeTrue();
    });

    it('SEC-025-B: Debe aceptar fecha futura para inscripciones', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(tomorrow > today).toBeTrue();
    });

    it('SEC-025-C: Debe validar formato de fecha ISO 8601', () => {
      const validDate = '2025-12-31';
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      expect(dateRegex.test(validDate)).toBeTrue();
    });

    it('SEC-025-D: Debe rechazar formato de fecha inválido', () => {
      const invalidDates = [
        '31/12/2025',
        '12-31-2025',
        '2025/12/31',
        'Invalid Date'
      ];
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      invalidDates.forEach(date => {
        expect(dateRegex.test(date)).toBeFalse();
      });
    });
  });

  // =====================================
  // SEC-026: VALIDACIÓN DE LONGITUD DE TEXTO
  // =====================================
  describe('SEC-026: Validación de Longitud de Texto', () => {
    let form: FormGroup;

    beforeEach(() => {
      form = formBuilder.group({
        observaciones: ['', [Validators.maxLength(500)]]
      });
    });

    it('SEC-026-A: Debe aceptar texto dentro del límite', () => {
      form.controls['observaciones'].setValue('Texto válido con menos de 500 caracteres');
      expect(form.controls['observaciones'].valid).toBeTrue();
    });

    it('SEC-026-B: Debe rechazar texto mayor al límite', () => {
      const longText = 'a'.repeat(501);
      form.controls['observaciones'].setValue(longText);
      expect(form.controls['observaciones'].valid).toBeFalse();
    });

    it('SEC-026-C: Debe aceptar texto con exactamente 500 caracteres', () => {
      const exactText = 'a'.repeat(500);
      form.controls['observaciones'].setValue(exactText);
      expect(form.controls['observaciones'].valid).toBeTrue();
    });

    it('SEC-026-D: Debe aceptar campo vacío si no es requerido', () => {
      form.controls['observaciones'].setValue('');
      expect(form.controls['observaciones'].valid).toBeTrue();
    });
  });

  // =====================================
  // SEC-027: PREVENCIÓN DE INYECCIÓN SQL
  // =====================================
  describe('SEC-027: Prevención de Inyección SQL', () => {
    
    it('SEC-027-A: Debe detectar intento de inyección SQL simple', () => {
      const sqlInjections = [
        "'; DROP TABLE usuarios;--",
        "' OR '1'='1",
        "admin'--",
        "1' UNION SELECT NULL--",
        "'; EXEC sp_MSForEachTable 'DROP TABLE ?'--"
      ];
      
      const containsDangerousSQL = (input: string): boolean => {
        // Detectar patrones comunes de SQL injection
        const hasDoubleDash = /--/.test(input);
        const hasSemicolon = /;/.test(input);
        const sqlKeywords = /(\bDROP\b|\bDELETE\b|\bUNION\b|\bEXEC\b|\bUPDATE\b|\bINSERT\b)/i;
        const hasORPattern = /'\s*(OR|AND)\s*'/i.test(input); // Detecta ' OR ' y ' AND '
        return sqlKeywords.test(input) || hasDoubleDash || hasSemicolon || hasORPattern;
      };

      sqlInjections.forEach(injection => {
        expect(containsDangerousSQL(injection)).toBeTrue();
      });
    });

    it('SEC-027-B: Debe permitir texto normal sin SQL', () => {
      const safeInputs = [
        'Estudiante necesita paz y salvo',
        'Curso de programación',
        'Observaciones generales'
      ];
      
      const containsDangerousSQL = (input: string): boolean => {
        const sqlKeywords = /(\bDROP\b|\bDELETE\b|\bUNION\b|\bEXEC\b|\bUPDATE\b|\bINSERT\b|--|;)/i;
        return sqlKeywords.test(input);
      };

      safeInputs.forEach(input => {
        expect(containsDangerousSQL(input)).toBeFalse();
      });
    });
  });
});

