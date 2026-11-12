import { HttpHeaders } from '@angular/common/http';

export function descargarBlob(blob: Blob, nombre: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre || 'documento.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/** Nombre de archivo de la cabecera Content-Disposition, o null si no viene. */
export function nombreDeContentDisposition(headers: HttpHeaders | null | undefined): string | null {
  const cd = headers?.get('Content-Disposition');
  if (!cd) return null;
  const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const raw = match?.[1] || match?.[2];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}
