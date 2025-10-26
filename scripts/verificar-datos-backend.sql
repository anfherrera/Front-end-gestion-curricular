-- ========================================
-- 🔍 SCRIPT DE DIAGNÓSTICO: Verificar Datos del Backend
-- ========================================

-- 1. ¿Cuántos cursos hay en total?
SELECT 
    COUNT(*) as total_cursos,
    COUNT(DISTINCT periodoAcademico) as total_periodos,
    COUNT(DISTINCT estado) as total_estados
FROM cursos_ofertados_verano;

-- 2. Ver todos los cursos (simple)
SELECT 
    id_curso,
    nombre_curso,
    codigo_curso,
    estado,
    periodoAcademico,
    fecha_inicio,
    fecha_fin,
    id_materia,
    id_docente
FROM cursos_ofertados_verano
ORDER BY fecha_inicio DESC;

-- 3. Ver cursos CON materias y docentes (con JOINs)
SELECT 
    cv.id_curso,
    cv.nombre_curso,
    cv.codigo_curso,
    cv.estado,
    cv.periodoAcademico,
    cv.fecha_inicio,
    cv.fecha_fin,
    m.codigo as materia_codigo,
    m.nombre as materia_nombre,
    CONCAT(u.nombre, ' ', u.apellido) as docente
FROM cursos_ofertados_verano cv
LEFT JOIN materias m ON cv.id_materia = m.id_materia
LEFT JOIN usuarios u ON cv.id_docente = u.id_usuario
ORDER BY cv.fecha_inicio DESC;

-- 4. ¿Hay cursos con materias que NO existen?
SELECT 
    cv.id_curso,
    cv.nombre_curso,
    cv.id_materia,
    'Materia NO existe en la BD' as problema
FROM cursos_ofertados_verano cv
LEFT JOIN materias m ON cv.id_materia = m.id_materia
WHERE cv.id_materia IS NOT NULL 
  AND m.id_materia IS NULL;

-- 5. ¿Hay cursos con docentes que NO existen?
SELECT 
    cv.id_curso,
    cv.nombre_curso,
    cv.id_docente,
    'Docente NO existe en la BD' as problema
FROM cursos_ofertados_verano cv
LEFT JOIN usuarios u ON cv.id_docente = u.id_usuario
WHERE cv.id_docente IS NOT NULL 
  AND u.id_usuario IS NULL;

-- 6. Resumen por estado
SELECT 
    estado,
    COUNT(*) as cantidad,
    MIN(fecha_inicio) as fecha_inicio_mas_antigua,
    MAX(fecha_fin) as fecha_fin_mas_reciente
FROM cursos_ofertados_verano
GROUP BY estado
ORDER BY cantidad DESC;

-- 7. Resumen por período académico
SELECT 
    periodoAcademico,
    COUNT(*) as cantidad_cursos,
    COUNT(DISTINCT id_materia) as materias_distintas,
    COUNT(DISTINCT id_docente) as docentes_distintos
FROM cursos_ofertados_verano
WHERE periodoAcademico IS NOT NULL
GROUP BY periodoAcademico
ORDER BY periodoAcademico DESC;

-- 8. Ver estructura de la tabla
DESCRIBE cursos_ofertados_verano;

-- ========================================
-- 📋 INTERPRETACIÓN DE RESULTADOS
-- ========================================

/*
QUERY 1: Si devuelve 0, NO hay cursos en la BD → Necesitas insertar datos
QUERY 2: Si devuelve datos, los cursos SÍ existen
QUERY 3: Si devuelve 0 pero Query 2 devuelve datos → Los JOINs están fallando
QUERY 4: Si devuelve filas → Hay cursos con id_materia que no existe en la tabla materias
QUERY 5: Si devuelve filas → Hay cursos con id_docente que no existe en la tabla usuarios

SOLUCIÓN para Query 4 y 5:
- Opción 1: Actualizar los IDs incorrectos en cursos_ofertados_verano
- Opción 2: Insertar los registros faltantes en materias/usuarios
- Opción 3: Usar INNER JOIN en lugar de LEFT JOIN (solo devuelve cursos con datos completos)
*/

