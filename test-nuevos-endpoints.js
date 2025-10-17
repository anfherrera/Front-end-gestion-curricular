/**
 * 🧪 Script de Prueba para los Nuevos Endpoints de Estadísticas
 * 
 * Este script prueba los nuevos endpoints:
 * - GET /api/estadisticas/estudiantes-por-programa
 * - GET /api/estadisticas/estadisticas-por-proceso
 */

// Función para probar el endpoint de estudiantes por programa
async function probarEstudiantesPorPrograma() {
    console.log('🧪 Probando endpoint de estudiantes por programa...');
    
    try {
        const response = await fetch('http://localhost:5000/api/estadisticas/estudiantes-por-programa', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Respuesta del servidor:', response);
        console.log('📊 Status:', response.status);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // Verificar estructura de la respuesta
        if (data.estudiantesPorPrograma && data.fechaConsulta && data.descripcion) {
            console.log('🎉 Estructura de respuesta correcta!');
            console.log('📚 Programas encontrados:', Object.keys(data.estudiantesPorPrograma).length);
            
            // Mostrar detalle por programa
            Object.entries(data.estudiantesPorPrograma).forEach(([programa, cantidad]) => {
                console.log(`  📖 ${programa}: ${cantidad} estudiantes`);
            });
        } else {
            console.warn('⚠️ Estructura de respuesta inesperada:', data);
        }

        return data;

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        return null;
    }
}

// Función para probar el endpoint de estadísticas detalladas por proceso
async function probarEstadisticasPorProceso() {
    console.log('🧪 Probando endpoint de estadísticas por proceso...');
    
    try {
        const response = await fetch('http://localhost:5000/api/estadisticas/estadisticas-por-proceso', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Respuesta del servidor:', response);
        console.log('📊 Status:', response.status);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // Verificar estructura de la respuesta
        if (data.estadisticasPorProceso && data.fechaConsulta && data.descripcion) {
            console.log('🎉 Estructura de respuesta correcta!');
            console.log('📋 Procesos encontrados:', Object.keys(data.estadisticasPorProceso).length);
            
            // Mostrar detalle por proceso
            Object.entries(data.estadisticasPorProceso).forEach(([proceso, estadisticas]) => {
                console.log(`  📊 ${proceso}:`, estadisticas);
            });
        } else {
            console.warn('⚠️ Estructura de respuesta inesperada:', data);
        }

        return data;

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        return null;
    }
}

// Función para probar todos los endpoints de estadísticas
async function probarTodosLosEndpoints() {
    console.log('🚀 Probando todos los endpoints de estadísticas...');
    console.log('='.repeat(60));
    
    // 1. Total de estudiantes (ya implementado)
    console.log('\n--- 1. Total de Estudiantes ---');
    await probarTotalEstudiantes();
    
    console.log('\n' + '='.repeat(60));
    
    // 2. Estudiantes por programa
    console.log('\n--- 2. Estudiantes por Programa ---');
    await probarEstudiantesPorPrograma();
    
    console.log('\n' + '='.repeat(60));
    
    // 3. Estadísticas por proceso
    console.log('\n--- 3. Estadísticas por Proceso ---');
    await probarEstadisticasPorProceso();
    
    console.log('\n🎉 Pruebas completadas!');
}

// Función para probar el endpoint de total de estudiantes (ya existente)
async function probarTotalEstudiantes() {
    console.log('🧪 Probando endpoint de total de estudiantes...');
    
    try {
        const response = await fetch('http://localhost:5000/api/estadisticas/total-estudiantes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Total de estudiantes:', data.totalEstudiantes);
        return data;

    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Función para comparar datos entre endpoints
async function compararDatos() {
    console.log('🔍 Comparando datos entre endpoints...');
    
    try {
        const [totalEstudiantes, estudiantesPorPrograma] = await Promise.all([
            probarTotalEstudiantes(),
            probarEstudiantesPorPrograma()
        ]);

        if (totalEstudiantes && estudiantesPorPrograma) {
            const totalDesdeProgramas = Object.values(estudiantesPorPrograma.estudiantesPorPrograma)
                .reduce((sum, cantidad) => sum + cantidad, 0);
            
            console.log('📊 Comparación:');
            console.log(`  Total desde endpoint: ${totalEstudiantes.totalEstudiantes}`);
            console.log(`  Suma por programas: ${totalDesdeProgramas}`);
            
            if (totalEstudiantes.totalEstudiantes === totalDesdeProgramas) {
                console.log('✅ Los datos coinciden perfectamente!');
            } else {
                console.log('⚠️ Los datos no coinciden. Verificar lógica del backend.');
            }
        }
    } catch (error) {
        console.error('❌ Error en la comparación:', error);
    }
}

// Función para probar rendimiento
async function probarRendimiento() {
    console.log('⚡ Probando rendimiento de los endpoints...');
    
    const endpoints = [
        'http://localhost:5000/api/estadisticas/total-estudiantes',
        'http://localhost:5000/api/estadisticas/estudiantes-por-programa',
        'http://localhost:5000/api/estadisticas/estadisticas-por-proceso'
    ];

    for (const endpoint of endpoints) {
        const startTime = performance.now();
        
        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            console.log(`📡 ${endpoint.split('/').pop()}: ${duration.toFixed(2)}ms`);
        } catch (error) {
            console.error(`❌ Error en ${endpoint}:`, error);
        }
    }
}

// Función para probar en paralelo
async function probarEnParalelo() {
    console.log('🔄 Probando llamadas en paralelo...');
    
    const startTime = performance.now();
    
    try {
        const [totalEstudiantes, estudiantesPorPrograma, estadisticasPorProceso] = await Promise.all([
            fetch('http://localhost:5000/api/estadisticas/total-estudiantes').then(r => r.json()),
            fetch('http://localhost:5000/api/estadisticas/estudiantes-por-programa').then(r => r.json()),
            fetch('http://localhost:5000/api/estadisticas/estadisticas-por-proceso').then(r => r.json())
        ]);

        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Todas las llamadas completadas en: ${duration.toFixed(2)}ms`);
        console.log('📊 Datos obtenidos:');
        console.log('  - Total estudiantes:', totalEstudiantes.totalEstudiantes);
        console.log('  - Programas:', Object.keys(estudiantesPorPrograma.estudiantesPorPrograma).length);
        console.log('  - Procesos:', Object.keys(estadisticasPorProceso.estadisticasPorProceso).length);
        
    } catch (error) {
        console.error('❌ Error en llamadas paralelas:', error);
    }
}

// Exportar funciones para uso en consola
window.probarEstudiantesPorPrograma = probarEstudiantesPorPrograma;
window.probarEstadisticasPorProceso = probarEstadisticasPorProceso;
window.probarTodosLosEndpoints = probarTodosLosEndpoints;
window.compararDatos = compararDatos;
window.probarRendimiento = probarRendimiento;
window.probarEnParalelo = probarEnParalelo;

console.log('🧪 Script de prueba de nuevos endpoints cargado!');
console.log('📋 Comandos disponibles:');
console.log('  - probarEstudiantesPorPrograma()');
console.log('  - probarEstadisticasPorProceso()');
console.log('  - probarTodosLosEndpoints()');
console.log('  - compararDatos()');
console.log('  - probarRendimiento()');
console.log('  - probarEnParalelo()');
console.log('\n💡 Ejemplo: probarTodosLosEndpoints()');
