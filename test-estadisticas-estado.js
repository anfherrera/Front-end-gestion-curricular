// test-estadisticas-estado.js

const BASE_URL = 'http://localhost:5000/api/estadisticas';

/**
 * Prueba el endpoint de Estado de Solicitudes
 */
async function probarEstadoSolicitudes() {
    console.log('--- Probando Estado de Solicitudes ---');
    try {
        const response = await fetch(`${BASE_URL}/estado-solicitudes`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ Estado de Solicitudes:', data);
        return data;
    } catch (error) {
        console.error('❌ Error al obtener estado de solicitudes:', error);
        return null;
    }
}

/**
 * Prueba todos los endpoints de estadísticas
 */
async function probarTodosLosEndpoints() {
    console.log('--- Probando TODOS los endpoints de estadísticas ---');
    const resultados = {};
    
    // Endpoint de total de estudiantes
    try {
        const response = await fetch(`${BASE_URL}/total-estudiantes`);
        if (response.ok) {
            resultados.totalEstudiantes = await response.json();
            console.log('✅ Total Estudiantes:', resultados.totalEstudiantes);
        }
    } catch (error) {
        console.error('❌ Error en total estudiantes:', error);
    }
    
    // Endpoint de estudiantes por programa
    try {
        const response = await fetch(`${BASE_URL}/estudiantes-por-programa`);
        if (response.ok) {
            resultados.estudiantesPorPrograma = await response.json();
            console.log('✅ Estudiantes por Programa:', resultados.estudiantesPorPrograma);
        }
    } catch (error) {
        console.error('❌ Error en estudiantes por programa:', error);
    }
    
    // Endpoint de estadísticas por proceso
    try {
        const response = await fetch(`${BASE_URL}/estadisticas-por-proceso`);
        if (response.ok) {
            resultados.estadisticasPorProceso = await response.json();
            console.log('✅ Estadísticas por Proceso:', resultados.estadisticasPorProceso);
        }
    } catch (error) {
        console.error('❌ Error en estadísticas por proceso:', error);
    }
    
    // Endpoint de estado de solicitudes
    try {
        const response = await fetch(`${BASE_URL}/estado-solicitudes`);
        if (response.ok) {
            resultados.estadoSolicitudes = await response.json();
            console.log('✅ Estado de Solicitudes:', resultados.estadoSolicitudes);
        }
    } catch (error) {
        console.error('❌ Error en estado de solicitudes:', error);
    }
    
    console.log('--- Resultados Completos ---', resultados);
    return resultados;
}

/**
 * Función para mostrar estadísticas de estado de forma visual
 */
function mostrarEstadisticasEstado(data) {
    if (!data || !data.estados) {
        console.log('❌ No hay datos de estados para mostrar');
        return;
    }
    
    console.log('📊 ESTADÍSTICAS POR ESTADO:');
    console.log(`📋 Total de Solicitudes: ${data.totalSolicitudes}`);
    console.log('─'.repeat(50));
    
    Object.entries(data.estados).forEach(([estado, info]) => {
        const emoji = {
            'Aprobado': '✅',
            'Enviada': '📤',
            'Rechazado': '❌',
            'En_Proceso': '🕐',
            'En Proceso': '🔄',
            'Pendiente': '⏸️'
        }[estado] || '📊';
        
        console.log(`${emoji} ${estado}:`);
        console.log(`   Cantidad: ${info.cantidad}`);
        console.log(`   Porcentaje: ${info.porcentaje}%`);
        console.log(`   Descripción: ${info.descripcion}`);
        console.log(`   Color: ${info.color}`);
        console.log(`   Icono: ${info.icono}`);
        console.log('─'.repeat(30));
    });
}

// Exportar funciones para que puedan ser llamadas desde la consola
window.probarEstadoSolicitudes = probarEstadoSolicitudes;
window.probarTodosLosEndpoints = probarTodosLosEndpoints;
window.mostrarEstadisticasEstado = mostrarEstadisticasEstado;

console.log('Script test-estadisticas-estado.js cargado. Puedes usar:');
console.log('  probarEstadoSolicitudes()');
console.log('  probarTodosLosEndpoints()');
console.log('  mostrarEstadisticasEstado(data)');
console.log('');
console.log('Ejemplo de uso:');
console.log('  const data = await probarEstadoSolicitudes();');
console.log('  mostrarEstadisticasEstado(data);');
