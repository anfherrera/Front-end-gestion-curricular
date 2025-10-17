/**
 * 🧪 Script de Prueba para el Endpoint de Estudiantes
 * 
 * Este script prueba el endpoint GET /api/estadisticas/total-estudiantes
 * desde el navegador usando la consola de desarrollador.
 */

// Función para probar el endpoint de estudiantes
async function probarEndpointEstudiantes() {
    console.log('🧪 Iniciando prueba del endpoint de estudiantes...');
    
    try {
        const response = await fetch('http://localhost:5000/api/estadisticas/total-estudiantes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Agregar token si es necesario
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('📡 Respuesta del servidor:', response);
        console.log('📊 Status:', response.status);
        console.log('📋 Headers:', response.headers);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // Verificar estructura de la respuesta
        if (data.totalEstudiantes !== undefined && 
            data.fechaConsulta && 
            data.descripcion) {
            console.log('🎉 Estructura de respuesta correcta!');
            console.log(`👥 Total de estudiantes: ${data.totalEstudiantes}`);
            console.log(`📅 Fecha de consulta: ${data.fechaConsulta}`);
            console.log(`📝 Descripción: ${data.descripcion}`);
        } else {
            console.warn('⚠️ Estructura de respuesta inesperada:', data);
        }

        return data;

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🔌 Error de conexión: Verifica que el backend esté ejecutándose en http://localhost:5000');
        }
        
        return null;
    }
}

// Función para probar múltiples veces
async function probarEndpointMultiple(veces = 3) {
    console.log(`🔄 Probando endpoint ${veces} veces...`);
    
    for (let i = 1; i <= veces; i++) {
        console.log(`\n--- Prueba ${i}/${veces} ---`);
        await probarEndpointEstudiantes();
        
        if (i < veces) {
            console.log('⏳ Esperando 2 segundos...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// Función para probar con diferentes headers
async function probarConHeaders() {
    console.log('🧪 Probando con diferentes headers...');
    
    const headers = [
        { 'Content-Type': 'application/json' },
        { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        { 'Content-Type': 'application/json', 'User-Agent': 'Frontend-Test' }
    ];

    for (let i = 0; i < headers.length; i++) {
        console.log(`\n--- Prueba con headers ${i + 1} ---`);
        console.log('Headers:', headers[i]);
        
        try {
            const response = await fetch('http://localhost:5000/api/estadisticas/total-estudiantes', {
                method: 'GET',
                headers: headers[i]
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Éxito:', data);
            } else {
                console.log('❌ Error:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

// Función para verificar CORS
async function verificarCORS() {
    console.log('🌐 Verificando CORS...');
    
    try {
        const response = await fetch('http://localhost:5000/api/estadisticas/total-estudiantes', {
            method: 'OPTIONS'
        });
        
        console.log('📡 Respuesta OPTIONS:', response);
        console.log('📋 Headers CORS:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        });
        
    } catch (error) {
        console.error('❌ Error verificando CORS:', error);
    }
}

// Función principal de prueba
async function ejecutarTodasLasPruebas() {
    console.log('🚀 Iniciando suite completa de pruebas...');
    console.log('='.repeat(50));
    
    // Prueba básica
    await probarEndpointEstudiantes();
    
    console.log('\n' + '='.repeat(50));
    
    // Prueba múltiple
    await probarEndpointMultiple(2);
    
    console.log('\n' + '='.repeat(50));
    
    // Prueba con headers
    await probarConHeaders();
    
    console.log('\n' + '='.repeat(50));
    
    // Verificar CORS
    await verificarCORS();
    
    console.log('\n🎉 Suite de pruebas completada!');
}

// Exportar funciones para uso en consola
window.probarEndpointEstudiantes = probarEndpointEstudiantes;
window.probarEndpointMultiple = probarEndpointMultiple;
window.probarConHeaders = probarConHeaders;
window.verificarCORS = verificarCORS;
window.ejecutarTodasLasPruebas = ejecutarTodasLasPruebas;

console.log('🧪 Script de prueba cargado!');
console.log('📋 Comandos disponibles:');
console.log('  - probarEndpointEstudiantes()');
console.log('  - probarEndpointMultiple(3)');
console.log('  - probarConHeaders()');
console.log('  - verificarCORS()');
console.log('  - ejecutarTodasLasPruebas()');
console.log('\n💡 Ejemplo: probarEndpointEstudiantes()');
