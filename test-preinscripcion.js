// 🧪 ARCHIVO DE PRUEBA PARA EL ENDPOINT DE PREINSCRIPCIONES
// Copia y pega este código en la consola del navegador para probar

const probarPreinscripcion = async (usuarioId = 4, cursoId = 1) => {
  console.log('🚀 Iniciando prueba del endpoint de preinscripción...');
  console.log('👤 Usuario ID:', usuarioId);
  console.log('📚 Curso ID:', cursoId);
  
  // Prueba 1: Sin condición (como estaba antes)
  const datosSinCondicion = {
    idUsuario: usuarioId,
    idCurso: cursoId,
    nombreSolicitud: "Preinscripción - Prueba sin condición"
  };
  
  // Prueba 2: Con condición "Repetición"
  const datosConCondicion = {
    idUsuario: usuarioId,
    idCurso: cursoId,
    nombreSolicitud: "Preinscripción - Prueba con condición",
    condicion: "Repetición"
  };
  
  console.log('📊 Datos sin condición:', datosSinCondicion);
  console.log('📊 Datos con condición:', datosConCondicion);
  
  try {
    // Probar endpoint sin condición
    console.log('\n1️⃣ Probando endpoint SIN condición...');
    const response1 = await fetch('/api/cursos-intersemestrales/cursos-verano/preinscripciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosSinCondicion)
    });
    
    console.log('📡 Status Code (sin condición):', response1.status);
    
    if (response1.ok) {
      const resultado1 = await response1.json();
      console.log('✅ ÉXITO sin condición:', resultado1);
    } else {
      const error1 = await response1.text();
      console.log('❌ ERROR sin condición:', response1.status, error1);
    }
    
    // Probar endpoint con condición
    console.log('\n2️⃣ Probando endpoint CON condición...');
    const response2 = await fetch('/api/cursos-intersemestrales/cursos-verano/preinscripciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosConCondicion)
    });
    
    console.log('📡 Status Code (con condición):', response2.status);
    
    if (response2.ok) {
      const resultado2 = await response2.json();
      console.log('✅ ÉXITO con condición:', resultado2);
      console.log('🔍 Condición guardada:', resultado2.condicion);
      return resultado2;
    } else {
      const error2 = await response2.text();
      console.log('❌ ERROR con condición:', response2.status, error2);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return null;
  }
};

// Función para obtener preinscripciones de un curso
const obtenerPreinscripciones = async (cursoId = 1) => {
  console.log('🔍 Obteniendo preinscripciones del curso...');
  
  try {
    const response = await fetch(`/api/cursos-intersemestrales/preinscripciones/curso/${cursoId}`);
    
    if (response.ok) {
      const preinscripciones = await response.json();
      console.log('✅ Preinscripciones obtenidas:', preinscripciones);
      
      // Verificar si alguna tiene condición
      preinscripciones.forEach((pre, index) => {
        console.log(`📋 Preinscripción ${index + 1}:`);
        console.log(`   - ID: ${pre.id_preinscripcion || pre.id_solicitud}`);
        console.log(`   - Estudiante: ${pre.objUsuario?.nombre_completo || 'Sin nombre'}`);
        console.log(`   - Condición: ${pre.condicion || 'SIN CONDICIÓN'}`);
        console.log(`   - Estado: ${pre.estado || 'Sin estado'}`);
      });
      
      return preinscripciones;
    } else {
      console.log('❌ Error obteniendo preinscripciones:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return null;
  }
};

// Función para probar diferentes condiciones
const probarTodasLasCondiciones = async (usuarioId = 4, cursoId = 1) => {
  console.log('🧪 Probando todas las condiciones...');
  
  const condiciones = ['Primera_Vez', 'Habilitación', 'Repetición'];
  const resultados = [];
  
  for (const condicion of condiciones) {
    console.log(`\n🔄 Probando condición: ${condicion}`);
    
    const datos = {
      idUsuario: usuarioId,
      idCurso: cursoId,
      nombreSolicitud: `Preinscripción - Prueba ${condicion}`,
      condicion: condicion
    };
    
    try {
      const response = await fetch('/api/cursos-intersemestrales/cursos-verano/preinscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });
      
      if (response.ok) {
        const resultado = await response.json();
        console.log(`✅ ${condicion} - ÉXITO:`, resultado);
        resultados.push({ condicion, resultado, exito: true });
      } else {
        const error = await response.text();
        console.log(`❌ ${condicion} - ERROR:`, response.status, error);
        resultados.push({ condicion, error, exito: false });
      }
    } catch (error) {
      console.error(`❌ ${condicion} - Error de conexión:`, error);
      resultados.push({ condicion, error, exito: false });
    }
  }
  
  return resultados;
};

// Función principal de prueba
const ejecutarPruebasPreinscripcion = async () => {
  console.log('🎯 INICIANDO PRUEBAS COMPLETAS DE PREINSCRIPCIONES');
  console.log('='.repeat(60));
  
  // 1. Probar endpoint básico
  console.log('\n1️⃣ Probando endpoint básico...');
  const resultadoBasico = await probarPreinscripcion();
  
  // 2. Obtener preinscripciones existentes
  console.log('\n2️⃣ Obteniendo preinscripciones existentes...');
  const preinscripciones = await obtenerPreinscripciones();
  
  // 3. Probar todas las condiciones
  console.log('\n3️⃣ Probando todas las condiciones...');
  const resultadosCondiciones = await probarTodasLasCondiciones();
  
  // 4. Resumen
  console.log('\n📋 RESUMEN DE PRUEBAS:');
  console.log('='.repeat(30));
  console.log('✅ Prueba básica:', resultadoBasico ? 'EXITOSA' : 'FALLIDA');
  console.log('✅ Preinscripciones obtenidas:', preinscripciones ? 'EXITOSA' : 'FALLIDA');
  
  const exitosas = resultadosCondiciones.filter(r => r.exito).length;
  console.log(`✅ Condiciones probadas: ${exitosas}/${resultadosCondiciones.length}`);
  
  if (exitosas === resultadosCondiciones.length) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS!');
    console.log('✅ El endpoint de preinscripciones acepta condiciones');
    console.log('✅ El frontend puede enviar la condición correctamente');
  } else {
    console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON');
    console.log('❌ Revisar si el backend acepta el campo "condicion"');
  }
};

// Instrucciones de uso
console.log(`
🧪 ARCHIVO DE PRUEBA PARA PREINSCRIPCIONES
==========================================

📋 FUNCIONES DISPONIBLES:

1. probarPreinscripcion(usuarioId, cursoId) - Prueba básica
2. obtenerPreinscripciones(cursoId) - Obtiene preinscripciones
3. probarTodasLasCondiciones(usuarioId, cursoId) - Prueba todas las condiciones
4. ejecutarPruebasPreinscripcion() - Ejecuta todas las pruebas

🚀 PARA USAR:

// Prueba básica
probarPreinscripcion(4, 1);

// Obtener preinscripciones
obtenerPreinscripciones(1);

// Probar todas las condiciones
probarTodasLasCondiciones(4, 1);

// Ejecutar todas las pruebas
ejecutarPruebasPreinscripcion();

📝 NOTA: Asegúrate de que el backend esté corriendo y que tengas un usuario y curso válidos
`);

// Exportar funciones para uso global
window.probarPreinscripcion = probarPreinscripcion;
window.obtenerPreinscripciones = obtenerPreinscripciones;
window.probarTodasLasCondiciones = probarTodasLasCondiciones;
window.ejecutarPruebasPreinscripcion = ejecutarPruebasPreinscripcion;
