// 🧪 ARCHIVO DE PRUEBA PARA EL ENDPOINT PUT
// Copia y pega este código en la consola del navegador para probar

const probarEndpointPUT = async (cursoId = 217) => {
  console.log('🚀 Iniciando prueba del endpoint PUT...');
  console.log('📋 Curso ID:', cursoId);
  
  const datosPrueba = {
    cupo_estimado: 30,
    espacio_asignado: "Lab 301",
    estado: "Abierto"
  };
  
  console.log('📊 Datos de prueba:', datosPrueba);
  
  try {
    const response = await fetch(`/api/cursos-intersemestrales/cursos-verano/${cursoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosPrueba)
    });
    
    console.log('📡 Status Code:', response.status);
    console.log('📡 Status Text:', response.statusText);
    
    if (response.ok) {
      const resultado = await response.json();
      console.log('✅ ÉXITO: Curso actualizado');
      console.log('📄 Respuesta del backend:', resultado);
      return resultado;
    } else {
      const error = await response.text();
      console.log('❌ ERROR:', response.status, response.statusText);
      console.log('📄 Detalles del error:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return null;
  }
};

// Función para probar con diferentes datos
const probarConDatosPersonalizados = async (cursoId, cupo, espacio, estado) => {
  console.log('🧪 Probando con datos personalizados...');
  
  const datosPersonalizados = {
    cupo_estimado: cupo,
    espacio_asignado: espacio,
    estado: estado
  };
  
  console.log('📊 Datos personalizados:', datosPersonalizados);
  
  try {
    const response = await fetch(`/api/cursos-intersemestrales/cursos-verano/${cursoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosPersonalizados)
    });
    
    if (response.ok) {
      const resultado = await response.json();
      console.log('✅ ÉXITO con datos personalizados');
      console.log('📄 Respuesta:', resultado);
      return resultado;
    } else {
      const error = await response.text();
      console.log('❌ ERROR con datos personalizados:', response.status, error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return null;
  }
};

// Función para verificar que el curso existe
const verificarCurso = async (cursoId = 217) => {
  console.log('🔍 Verificando que el curso existe...');
  
  try {
    const response = await fetch(`/api/cursos-intersemestrales/cursos-verano/${cursoId}`);
    
    if (response.ok) {
      const curso = await response.json();
      console.log('✅ Curso encontrado:', curso);
      return curso;
    } else {
      console.log('❌ Curso no encontrado:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Error verificando curso:', error);
    return null;
  }
};

// Función principal de prueba
const ejecutarPruebasCompletas = async () => {
  console.log('🎯 INICIANDO PRUEBAS COMPLETAS DEL ENDPOINT PUT');
  console.log('='.repeat(50));
  
  // 1. Verificar que el curso existe
  console.log('\n1️⃣ Verificando curso...');
  const curso = await verificarCurso(217);
  
  if (!curso) {
    console.log('❌ No se puede continuar: curso no encontrado');
    return;
  }
  
  // 2. Probar endpoint PUT con datos básicos
  console.log('\n2️⃣ Probando endpoint PUT...');
  const resultado1 = await probarEndpointPUT(217);
  
  // 3. Probar con datos personalizados
  console.log('\n3️⃣ Probando con datos personalizados...');
  const resultado2 = await probarConDatosPersonalizados(217, 25, "Aula 205", "Publicado");
  
  // 4. Resumen
  console.log('\n📋 RESUMEN DE PRUEBAS:');
  console.log('='.repeat(30));
  console.log('✅ Verificación de curso:', curso ? 'EXITOSA' : 'FALLIDA');
  console.log('✅ Prueba básica PUT:', resultado1 ? 'EXITOSA' : 'FALLIDA');
  console.log('✅ Prueba personalizada PUT:', resultado2 ? 'EXITOSA' : 'FALLIDA');
  
  if (resultado1 && resultado2) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS!');
    console.log('✅ El endpoint PUT está funcionando correctamente');
    console.log('✅ El frontend puede usar la funcionalidad de edición');
  } else {
    console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON');
    console.log('❌ Revisar la implementación del backend');
  }
};

// Instrucciones de uso
console.log(`
🧪 ARCHIVO DE PRUEBA PARA EL ENDPOINT PUT
==========================================

📋 FUNCIONES DISPONIBLES:

1. probarEndpointPUT(cursoId) - Prueba básica
2. probarConDatosPersonalizados(cursoId, cupo, espacio, estado) - Prueba personalizada
3. verificarCurso(cursoId) - Verifica que el curso existe
4. ejecutarPruebasCompletas() - Ejecuta todas las pruebas

🚀 PARA USAR:

// Prueba básica
probarEndpointPUT(1);

// Prueba personalizada
probarConDatosPersonalizados(1, 30, "Lab 301", "Abierto");

// Ejecutar todas las pruebas
ejecutarPruebasCompletas();

📝 NOTA: Asegúrate de que el backend esté corriendo en puerto 5000
`);

// Exportar funciones para uso global
window.probarEndpointPUT = probarEndpointPUT;
window.probarConDatosPersonalizados = probarConDatosPersonalizados;
window.verificarCurso = verificarCurso;
window.ejecutarPruebasCompletas = ejecutarPruebasCompletas;
