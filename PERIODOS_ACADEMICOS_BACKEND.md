# 📅 Períodos Académicos - Integración Backend

## 📋 Arquitectura Implementada

Se ha implementado una arquitectura donde **el backend es la única fuente de verdad** para los períodos académicos:

### 🗂️ Ubicación Backend
```
C:\Users\Daniel\Desktop\Universidad\Trabajo de grado\Desarrollo\Back\Back-end-gestion-curricular\gestion_curricular\src\main\java\co\edu\unicauca\decanatura\gestion_curricular\dominio\modelos\Enums\PeriodoAcademicoEnum.java
```

### 🌐 Endpoints API
```
GET /api/periodos-academicos/futuros
GET /api/periodos-academicos/recientes  
GET /api/periodos-academicos/todos
GET /api/periodos-academicos/actual
GET /api/periodos-academicos/validar/{periodo}
GET /api/periodos-academicos/info/{periodo}
```

### 📊 Períodos Disponibles (2020-2030)
```
2020-1, 2020-2
2021-1, 2021-2
2022-1, 2022-2
2023-1, 2023-2
2024-1, 2024-2
2025-1, 2025-2
2026-1, 2026-2
2027-1, 2027-2
2028-1, 2028-2
2029-1, 2029-2
2030-1, 2030-2
```

## 🔧 Implementación Backend

### ✅ Enum Creado
El enum `PeriodoAcademicoEnum` ya ha sido creado en el backend con las siguientes características:

### 📍 Ubicación
```
C:\Users\Daniel\Desktop\Universidad\Trabajo de grado\Desarrollo\Back\Back-end-gestion-curricular\gestion_curricular\src\main\java\co\edu\unicauca\decanatura\gestion_curricular\dominio\modelos\Enums\PeriodoAcademicoEnum.java
```

### 🎯 Características del Enum

```java
package co.edu.unicauca.decanatura.gestion_curricular.dominio.modelos.Enums;

public enum PeriodoAcademicoEnum {
    // 2020
    PERIODO_2020_1("2020-1"),
    PERIODO_2020_2("2020-2"),
    
    // 2021
    PERIODO_2021_1("2021-1"),
    PERIODO_2021_2("2021-2"),
    
    // 2022
    PERIODO_2022_1("2022-1"),
    PERIODO_2022_2("2022-2"),
    
    // 2023
    PERIODO_2023_1("2023-1"),
    PERIODO_2023_2("2023-2"),
    
    // 2024
    PERIODO_2024_1("2024-1"),
    PERIODO_2024_2("2024-2"),
    
    // 2025
    PERIODO_2025_1("2025-1"),
    PERIODO_2025_2("2025-2"),
    
    // 2026
    PERIODO_2026_1("2026-1"),
    PERIODO_2026_2("2026-2"),
    
    // 2027
    PERIODO_2027_1("2027-1"),
    PERIODO_2027_2("2027-2"),
    
    // 2028
    PERIODO_2028_1("2028-1"),
    PERIODO_2028_2("2028-2"),
    
    // 2029
    PERIODO_2029_1("2029-1"),
    PERIODO_2029_2("2029-2"),
    
    // 2030
    PERIODO_2030_1("2030-1"),
    PERIODO_2030_2("2030-2");
    
    private final String valor;
    
    PeriodoAcademicoEnum(String valor) {
        this.valor = valor;
    }
    
    public String getValor() {
        return valor;
    }
    
    public static PeriodoAcademicoEnum fromValor(String valor) {
        for (PeriodoAcademicoEnum periodo : values()) {
            if (periodo.valor.equals(valor)) {
                return periodo;
            }
        }
        throw new IllegalArgumentException("Período académico no válido: " + valor);
    }
}
```

## 🎯 Funcionalidades del Frontend

### 📱 Desplegable Dinámico
- **Consumo desde backend**: Obtiene períodos desde la API
- **Períodos futuros**: Muestra períodos del año actual en adelante
- **Fallback inteligente**: Si no hay futuros, muestra los últimos 5 años
- **Fallback final**: Períodos hardcodeados si el backend no está disponible

### 🔄 Flujo de Carga
```typescript
// 1. Intenta cargar períodos futuros
GET /api/periodos-academicos/futuros

// 2. Si falla, carga períodos recientes
GET /api/periodos-academicos/recientes

// 3. Si falla, usa fallback hardcodeado
['2024-1', '2024-2', '2025-1', '2025-2']
```

## 📤 Endpoint de Publicación

El frontend envía el período académico al endpoint:
```
POST localhost:5000/api/solicitudes-ecaes/publicarFechasEcaes
```

### 📋 Estructura JSON
```json
{
  "periodoAcademico": "2024-2",
  "inscripcion_est_by_facultad": "2024-03-01T00:00:00Z",
  "registro_recaudo_ordinario": "2024-04-01T00:00:00Z",
  "registro_recaudo_extraordinario": "2024-04-15T00:00:00Z",
  "citacion": "2025-05-01T00:00:00Z",
  "aplicacion": "2025-05-20T00:00:00Z",
  "resultados_individuales": "2025-06-15T00:00:00Z"
}
```

## ✅ Estado Actual

- ✅ Enum creado en backend Java
- ✅ Controlador API implementado
- ✅ Endpoints REST disponibles
- ✅ Frontend consume desde backend
- ✅ Desplegable implementado
- ✅ Validación de períodos
- ✅ Integración con formulario
- ✅ Fallbacks implementados
- ✅ Compilación exitosa

## 🚀 Próximos Pasos

1. ✅ **Completado**: Crear el enum `PeriodoAcademicoEnum` en el backend Java
2. ✅ **Completado**: Crear controlador con endpoints API
3. ✅ **Completado**: Frontend consume períodos desde backend
4. ⏳ **Pendiente**: Probar la integración completa frontend-backend
5. ⏳ **Pendiente**: Actualizar otros componentes que usen períodos académicos
