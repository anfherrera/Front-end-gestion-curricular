// 🧪 ARCHIVO DE PRUEBA PARA EL ENDPOINT PUT
// Copia y pega este código en la consola del navegador para probar el endpoint

const probarEndpoint = async () => {
  try {
    console.log('🧪 Probando endpoint PUT para actualizar curso...');
    
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/cursos-verano/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Agregar headers de autenticación si es necesario
        // 'Authorization': 'Bearer tu-token-aqui'
      },
      body: JSON.stringify({
        cupo_estimado: 25,
        espacio_asignado: "Aula 101",
        estado: "Preinscripcion"  // Sin tilde para el backend
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const resultado = await response.json();
    console.log('✅ Respuesta del backend:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Función para probar con diferentes datos
const probarConDatosMinimos = async () => {
  try {
    console.log('🧪 Probando con datos mínimos...');
    
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/cursos-verano/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estado: "Preinscripcion"  // Sin tilde para el backend
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const resultado = await response.json();
    console.log('✅ Respuesta del backend:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Función para obtener detalles del curso actual
const obtenerCursoActual = async () => {
  try {
    console.log('🔍 Obteniendo curso actual...');
    
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/cursos-verano/1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const curso = await response.json();
    console.log('📋 Curso actual:', curso);
    return curso;
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

console.log('🚀 Funciones disponibles:');
console.log('- probarEndpoint() - Probar actualización completa');
console.log('- probarConDatosMinimos() - Probar solo cambio de estado');
console.log('- obtenerCursoActual() - Ver datos actuales del curso');

// Ejecutar automáticamente la obtención del curso actual
obtenerCursoActual();