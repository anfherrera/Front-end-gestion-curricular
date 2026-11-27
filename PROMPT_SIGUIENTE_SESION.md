# Prompt para la siguiente sesión del frontend

Copia el bloque de abajo como primer mensaje de la sesión nueva. Escrito el 2026-11-25, con la rama `revision-25-backend` en `433405e` (PR #2 abierto contra `main`, CI en verde).

---

Continúa la revisión del frontend (Angular 19, `d:\Cursos\Trabajo de grado\Front-end-gestion-curricular`, rama `revision-25-backend`, PR #2). El `CHECKLIST-CALIDAD.md` está cerrado; lo último fue aplicar el estilo institucional (sección "Estilo institucional aplicado en todo el front"). Lee primero `src/app/core/design-system/README.md`, `tokens.css` y `design-tokens.ts`.

Hay dos trabajos, en este orden. Haz cada uno en commits pequeños, en español, sin subirlos hasta que yo diga "sí", y anota cada uno en `CHECKLIST-CALIDAD.md` con el mismo formato: qué se hizo, verificación y cambios visibles esperados.

## Parte A: terminar de unificar la interfaz

Colores, fuentes e iconos ya siguen la guía, y `npm run lint:estilos` (`scripts/comprobar-estilos.mjs`) impide volver a escribir colores hex o fuentes a mano. Quedan cuatro cosas, medidas el 2026-11-25. Hazlas en este orden y comprueba cada una con capturas:

1. **Colores con transparencia (pequeño, poco riesgo).** Hay 41 `rgba()` con colores que no son institucionales, en 15 archivos. Los más repetidos:
   - `rgba(0, 19, 140, …)`, 20 veces: parece el primario, pero el primario es `0, 0, 102`
   - `rgba(220, 53, 69, …)`, `rgba(40, 167, 69, …)`, `rgba(255, 193, 7, …)` y `rgba(244, 67, 54, …)`: Bootstrap y Material
   - `rgba(33, 150, 243, …)` y `rgba(30, 136, 229, …)`
   - Archivos principales: `cursos-verano-dashboard.component.css` (9), `cursos-intersemestrales.component.css` del estudiante (5) y `curso-dialog.component.css` (5)

   Pásalos a la paleta. Para los tintes, usa los fondos de notificación de la guía o `color-mix(in srgb, var(--token) X%, transparent)`. Hay además un `color: green` en `curso-list.component.css:66`. Después, amplía `comprobar-estilos.mjs` para que también rechace `rgb()`/`rgba()` con color (los de negro y blanco, que son sombras, se permiten) y los colores por nombre salvo `white`, `transparent` y `inherit`.

2. **Bordes redondeados (pequeño).** Hay 24 valores distintos:
   - Más usados: 8px ×129, 12px ×83, 50% ×23, 4px ×22, 6px ×20, 16px ×16, 20px ×8, 10px ×5, 3px ×4, 100px ×4, 999px ×2, 28px y 24px
   - Crea una escala en `tokens.css` (por ejemplo `--radio-sm: 4px`, `--radio-md: 8px`, `--radio-lg: 12px`, `--radio-xl: 16px`, `--radio-pill: 100px`, `--radio-circulo: 50%`; los diálogos de Material usan 28px). Pasa cada valor al paso más cercano
   - Mira la guía TIC (botones en píldora: `material.css` ya usa 100px) antes de fijar la escala
   - Añade la regla al script de estilos

3. **Tamaños de letra (el cambio más visible).** Hay 57 valores distintos y ninguna regla usa la escala de la guía, que ya está en `tokens.css`:
   - Escala: `--text-h1-size` 32px, `--text-h2-size` 22px, `--text-h3-size` 18px, `--text-body-size` 14px, `--text-body2-size` 12px y `--text-button-size` 12px, con sus `-line`
   - Valores más usados: 14px ×57, 0.9rem ×49, 13px ×42, 16px ×40, 12px ×38, 1rem ×37, 1.1rem ×33, 18px ×31, 20px ×26, 1.2rem ×22, 0.95rem ×18, 28px, 24px y 1.5rem ×16, y 0.8rem y 0.85rem ×15
   - Hay iconos grandes (48px, 64px, 3rem…) que no son texto y no deben entrar en la escala de texto: decide para ellos una escala aparte (`--tam-icono-*`)
   - Archivos con más tamaños: `cursos-verano-dashboard` (35), `inscripcion-modal` (33), `tendencias-comparativas` (26), `ver-solicitud` (25), `recomendaciones-cursos-verano` y `gestionar-cursos` (23)
   - Ve por carpetas (un commit por carpeta) y compara capturas en cada paso. Si hacen falta pasos intermedios (16px, 20px, 24px para títulos de tarjeta o cifras de KPI), añádelos como tokens con nombre (`--text-subtitulo-size`, `--text-cifra-size`…); no dejes números sueltos
   - Al final, añade la regla al script de estilos

4. **`!important` (sin cambios visibles).** Hay 832. Los peores:
   - `visualizar-solicitudes.component.css` (182), `revision/dashboard` (51), `material.css` (46), `gestionar-cursos` (42), `curso-dialog` (42) y `cursos-verano-dashboard` (30)
   - Quítalos donde no hagan falta, comprobando con capturas que nada cambia
   - No es obligatorio llegar a 0: los de `material.css` sobre clases de MDC pueden ser necesarios

Para comparar, saca capturas antes y después de cada paso con `npm run capturas -- <carpeta>` (`scripts/capturas-pantallas.mjs`: 19 pantallas de 5 roles, 1366 px). Con `ALTO=3200` captura páginas largas a media escala. Necesita el front en :4200 y el backend en :5000. Mira las imágenes de las dos carpetas y describe las diferencias.

Verifica cada commit con:

- `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`
- `npm run lint` y `npm run lint:estilos`
- `npx prettier --check` de los archivos tocados
- `npx ng build`, sin avisos
- `npx ng test --watch=false --code-coverage`: mira que salga "Executed N of N" con N igual al total (ahora 785)
- `npm run test:navegacion`, con backend

## Parte B: iniciar sesión con la cuenta institucional de Google (@unicauca.edu.co)

Objetivo: añadir un botón "Ingresar con cuenta institucional" que entre con Google, como hacen los sistemas de la universidad. El login con correo y contraseña se mantiene, porque los usuarios de prueba (juanp@, josefina@…) no son cuentas reales de Google. No copies el nombre, el logo ni el aspecto de SIMCA ni de otro sistema real; usa la identidad del propio proyecto.

**Antes de empezar, pregúntame por el Client ID.** Hace falta un ID de cliente OAuth de tipo "Aplicación web" creado en Google Cloud Console, con los orígenes JavaScript autorizados `http://localhost:4200` y el dominio de Vercel del front. Sin él no se puede probar. Si la cuenta de Google Workspace de la universidad bloquea apps de terceros, el administrador tendría que permitirla; con un proyecto en modo "Prueba" solo entran los usuarios de prueba que se añadan.

Diseño propuesto (cambia el backend, que está en `../Back-end-gestion-curricular`, rama `main`, con revisión cerrada):

- **Front:**
  - Google Identity Services: cargar `https://accounts.google.com/gsi/client` solo en el navegador (la app tiene SSR; usar `isPlatformBrowser`)
  - Botón con `google.accounts.id.initialize({ client_id, callback, hd: 'unicauca.edu.co' })` y `renderButton`
  - El callback recibe `credential` (un ID token JWT de Google) y llama a `AuthService.loginGoogle(credential)`, que hace `POST /api/usuarios/login/google` con `{ credential }` y recibe el mismo `LoginRespuesta` que `login()`
  - A partir de ahí, el mismo flujo de sesión de `login.component.ts`
  - El Client ID va en `environment.*.ts` (`googleClientId`); no es secreto
  - Mensajes de error con `ErrorHandlerService`:
    - 403 "La cuenta no pertenece a @unicauca.edu.co"
    - 404 o 403 "Tu cuenta no está registrada en el sistema; contacta al administrador"
  - Specs del servicio y del componente
- **Backend:**
  - Endpoint `POST /api/usuarios/login/google`, con `permitAll` en `SeguridadConfig`
  - Verificar la firma del ID token con las claves públicas de Google (`com.google.api-client:google-api-client`, `GoogleIdTokenVerifier`, o `NimbusJwtDecoder` con `https://www.googleapis.com/oauth2/v3/certs`)
  - Comprobar `aud` = Client ID (propiedad `app.google.client-id`, por variable de entorno), `iss`, `exp`, `email_verified` y que `hd` sea `unicauca.edu.co` (y el correo termine en `@unicauca.edu.co`)
  - Buscar al usuario por correo. Si no existe, responder error sin crearlo: el rol lo asigna el administrador
  - Generar el JWT con `JwtUtil.generarToken`, igual que `/login`, devolver `LoginDTORespuesta` y registrar la auditoría (`SecurityAuditService`)
  - Seguir la arquitectura hexagonal del backend y su forma de trabajar: caracterización antes, pruebas y `clean verify` en JDK 17 (`JAVA_HOME="C:/Program Files/Java/jdk-17"`)
- **Para probar de verdad**, crea por la pantalla de admin un usuario con una cuenta real @unicauca.edu.co y el rol que corresponda

## Entorno

- Backend: `cd ../Back-end-gestion-curricular/gestion_curricular && JAVA_HOME="C:/Program Files/Java/jdk-17" SPRING_DATASOURCE_USERNAME=root SPRING_DATASOURCE_PASSWORD=root ./mvnw -q spring-boot:run` (puerto 5000)
- Front: `npx ng serve` (puerto 4200)
- Usuarios de prueba, todos con `password123`:
  - admin@ (administrador)
  - juanp@ (funcionario)
  - josefina@ (coordinador)
  - maria@ (secretaría)
  - dcisneros@ (estudiante)
  - decano@ (decano; está solo en la base local)
- La base local tiene datos: 36 usuarios, unas 60 solicitudes de todos los procesos, 3 cursos de verano y 78 notificaciones
- Commits: en español, con commit local; pregunta antes de cada push (cuenta de GitHub `anfherrera`)
