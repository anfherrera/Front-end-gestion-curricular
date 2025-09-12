# Integración Frontend-Backend - Sistema de Gestión Curricular

## 📋 Resumen de la Integración

Este documento describe la configuración y estructura para la integración entre el frontend Angular y el backend Java del sistema de gestión curricular.

## 🏗️ Arquitectura

### Frontend (Angular)
- **Tecnología**: Angular 19.2.15
- **Puerto**: 4200 (desarrollo)
- **URL Base**: `http://localhost:4200`

### Backend (Java)
- **Tecnología**: Java (Spring Boot)
- **Puerto**: 8080 (desarrollo)
- **URL Base**: `http://localhost:8080/api`

## 🔧 Configuración

### 1. Variables de Entorno

#### Desarrollo (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

#### Producción (`environment.production.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'
};
```

### 2. Endpoints Centralizados

Todos los endpoints están centralizados en `src/app/core/utils/api-endpoints.ts`:

```typescript
export class ApiEndpoints {
  private static readonly BASE_URL = environment.apiUrl;

  // Autenticación
  static readonly AUTH = {
    LOGIN: `${this.BASE_URL}/auth/login`,
    REFRESH: `${this.BASE_URL}/auth/refresh`,
    LOGOUT: `${this.BASE_URL}/auth/logout`,
    PROFILE: `${this.BASE_URL}/auth/profile`
  };

  // Cursos Intersemestrales
  static readonly CURSOS_INTERSEMESTRALES = {
    BASE: `${this.BASE_URL}/cursos-intersemestrales`,
    BY_ID: (id: string) => `${this.BASE_URL}/cursos-intersemestrales/${id}`,
    // ... más endpoints
  };
}
```

## 🔐 Autenticación

### JWT Token
- **Almacenamiento**: localStorage
- **Interceptores**: JWT automático en todas las peticiones
- **Expiración**: Manejo automático con logout

### Flujo de Autenticación
1. Login → `/auth/login`
2. Token almacenado en localStorage
3. Interceptor agrega token a headers
4. Refresh automático si es necesario

## 📡 Servicios

### Servicios Principales
- `ApiService`: Servicio base con métodos comunes
- `AuthService`: Manejo de autenticación y sesiones
- `CursosIntersemestralesService`: Gestión de cursos intersemestrales
- `HomologacionAsignaturasService`: Homologación de asignaturas
- `PazSalvoService`: Gestión de paz y salvo
- `ReingresoEstudianteService`: Reingreso de estudiantes
- `PruebasEcaesService`: Gestión de pruebas ECAES
- `ModuloEstadisticoService`: Módulo estadístico

## 🛡️ Seguridad

### Guards
- `AuthGuard`: Protege rutas que requieren autenticación
- `RoleGuard`: Protege rutas basadas en roles de usuario

### Interceptores
- `JwtInterceptor`: Agrega token JWT automáticamente
- `ErrorInterceptor`: Manejo centralizado de errores
- `AuthInterceptor`: Manejo de autenticación

## 📊 Roles de Usuario

```typescript
export enum UserRole {
  ADMIN = 'admin',
  FUNCIONARIO = 'funcionario',
  COORDINADOR = 'coordinador',
  SECRETARIA = 'secretaria',
  ESTUDIANTE = 'estudiante'
}
```

## 🔄 Flujo de Datos

### 1. Solicitudes
```
Frontend → ApiService → HttpClient → Backend
```

### 2. Respuestas
```
Backend → HttpClient → ApiService → Component
```

### 3. Manejo de Errores
```
Error → ErrorInterceptor → Notificación → Usuario
```

## 📝 Endpoints del Backend

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/profile` - Obtener perfil

### Cursos Intersemestrales
- `GET /cursos-intersemestrales` - Listar solicitudes
- `POST /cursos-intersemestrales` - Crear solicitud
- `GET /cursos-intersemestrales/{id}` - Obtener solicitud
- `PUT /cursos-intersemestrales/{id}` - Actualizar solicitud
- `PUT /cursos-intersemestrales/{id}/aprobar` - Aprobar solicitud
- `PUT /cursos-intersemestrales/{id}/rechazar` - Rechazar solicitud

### Documentos
- `GET /cursos-intersemestrales/{id}/documentos` - Listar documentos
- `POST /cursos-intersemestrales/{id}/documentos/upload` - Subir documento
- `GET /documentos/{id}/download` - Descargar documento

## 🚀 Comandos de Desarrollo

### Frontend
```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
ng serve

# Build para producción
ng build --prod

# Tests
ng test
```

### Backend (Java)
```bash
# Compilar
mvn compile

# Ejecutar
mvn spring-boot:run

# Tests
mvn test
```

## 🔍 Testing

### Postman Collection
El backend incluye una colección de Postman (`gestionCurricular.postman_collection.json`) para testing de la API.

### Configuración de Testing
- **Frontend**: Karma + Jasmine
- **Backend**: JUnit + Mockito
- **E2E**: Cypress (opcional)

## 📋 Checklist de Integración

- [x] Configuración de endpoints centralizados
- [x] Servicios actualizados con endpoints correctos
- [x] Interceptores JWT configurados
- [x] Guards de autenticación y roles
- [x] Manejo de errores centralizado
- [x] Variables de entorno configuradas
- [x] Documentación de integración

## 🐛 Troubleshooting

### Problemas Comunes

1. **CORS Error**
   - Verificar configuración CORS en el backend
   - Asegurar que el backend permita requests desde `http://localhost:4200`

2. **Token Expirado**
   - Verificar configuración de expiración en el backend
   - Revisar el manejo automático de refresh token

3. **404 Not Found**
   - Verificar que los endpoints coincidan entre frontend y backend
   - Revisar la configuración de rutas en el backend

4. **Error de Autenticación**
   - Verificar que el interceptor JWT esté funcionando
   - Revisar el formato del token en localStorage

## 📞 Soporte

Para problemas de integración, revisar:
1. Logs del navegador (F12)
2. Logs del backend
3. Network tab en DevTools
4. Configuración de endpoints
