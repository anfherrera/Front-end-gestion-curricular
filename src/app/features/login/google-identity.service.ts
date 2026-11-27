import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '@env/environment';

/** Lo mínimo de Google Identity Services (https://accounts.google.com/gsi/client) que usa la aplicación. */
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (respuesta: { credential: string }) => void;
    hd?: string;
    ux_mode?: 'popup' | 'redirect';
    use_fedcm_for_prompt?: boolean;
  }): void;
  renderButton(contenedor: HTMLElement, opciones: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const SCRIPT_GOOGLE = 'https://accounts.google.com/gsi/client';

/** Dominio de las cuentas institucionales; Google lo usa para sugerir la cuenta de la universidad. */
export const DOMINIO_INSTITUCIONAL = 'unicauca.edu.co';

/**
 * Botón "Iniciar sesión con Google" con la cuenta institucional. Google entrega un ID token (credential) que el
 * backend verifica en /usuarios/login/google. Si no hay Client ID en el environment, el botón no se muestra.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly documento = inject(DOCUMENT);
  private readonly zona = inject(NgZone);
  private readonly enNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private cargaScript?: Promise<GoogleAccountsId>;

  /** true si el inicio con Google está configurado y se puede mostrar en esta plataforma */
  get disponible(): boolean {
    return this.enNavegador && !!environment.googleClientId;
  }

  /**
   * Dibuja el botón de Google dentro de {@code contenedor}. {@code alIniciar} recibe el ID token dentro de la zona
   * de Angular. Devuelve false si el script de Google no se pudo cargar (sin red o bloqueado).
   */
  async mostrarBoton(contenedor: HTMLElement, alIniciar: (credencial: string) => void): Promise<boolean> {
    if (!this.disponible) {
      return false;
    }
    try {
      const google = await this.cargarScript();
      google.initialize({
        client_id: environment.googleClientId,
        callback: ({ credential }) => this.zona.run(() => alIniciar(credential)),
        hd: DOMINIO_INSTITUCIONAL,
        ux_mode: 'popup',
        use_fedcm_for_prompt: true,
      });
      google.renderButton(contenedor, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        locale: 'es',
        width: Math.min(contenedor.clientWidth || 320, 400),
      });
      return true;
    } catch {
      return false;
    }
  }

  private cargarScript(): Promise<GoogleAccountsId> {
    this.cargaScript ??= new Promise<GoogleAccountsId>((resolver, rechazar) => {
      const listo = () =>
        window.google?.accounts?.id ? resolver(window.google.accounts.id) : rechazar(new Error('GIS no disponible'));
      if (window.google?.accounts?.id) {
        listo();
        return;
      }
      const script = this.documento.createElement('script');
      script.src = SCRIPT_GOOGLE;
      script.async = true;
      script.defer = true;
      script.onload = listo;
      script.onerror = () => {
        this.cargaScript = undefined; // se puede reintentar al volver a la pantalla
        rechazar(new Error('No se pudo cargar Google Identity Services'));
      };
      this.documento.head.appendChild(script);
    });
    return this.cargaScript;
  }
}
