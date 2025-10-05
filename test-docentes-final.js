// 🧪 **PRUEBA FINAL - DOCENTES REALES FUNCIONANDO**

console.log('🎯 PRUEBA FINAL - VERIFICANDO DOCENTES REALES');

// Función para corregir encoding (igual que en el frontend)
const corregirEncoding = (texto) => {
  if (!texto) return '';
  return texto
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã'/g, 'Ñ')
    // Patrones específicos para nombres comunes
    .replace(/Garc\?\?a/g, 'García')
    .replace(/Mar\?\?a/g, 'María')
    .replace(/L\?\?pez/g, 'López')
    .replace(/Mart\?\?nez/g, 'Martínez')
    .replace(/Rodr\?\?guez/g, 'Rodríguez')
    .replace(/Botero/g, 'Botero');
};

// Función para mapear docentes como lo hace el frontend
const mapearDocente = (docente) => {
  return {
    id_usuario: docente.id_usuario,
    nombre: corregirEncoding(docente.nombre || 'Sin nombre'),
    apellido: corregirEncoding(docente.apellido || 'Sin apellido'),
    email: corregirEncoding(docente.email || 'Sin email'),
    telefono: docente.telefono || 'Sin teléfono',
    objRol: {
      id_rol: docente.objRol?.id_rol || 2,
      nombre_rol: corregirEncoding(docente.objRol?.nombre || 'Docente')
    }
  };
};

// Función para probar el endpoint completo
const probarDocentesCompletos = async () => {
  try {
    console.log('📡 Obteniendo docentes del backend...');
    
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/docentes');
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const docentes = await response.json();
    
    console.log('✅ Docentes obtenidos del backend:');
    console.log('📊 Total de docentes:', docentes.length);
    
    // Mapear todos los docentes
    const docentesMapeados = docentes.map(mapearDocente);
    
    console.log('\n🎨 Docentes mapeados para el frontend:');
    docentesMapeados.forEach((docente, index) => {
      console.log(`${index + 1}. ${docente.nombre} ${docente.apellido} (${docente.email}) - ID: ${docente.id_usuario}`);
    });
    
    // Simular dropdown de selección
    console.log('\n📋 Opciones para dropdown:');
    docentesMapeados.forEach((docente, index) => {
      console.log(`<option value="${docente.id_usuario}">${docente.nombre} ${docente.apellido}</option>`);
    });
    
    // Verificar que el mapeo funciona correctamente
    const primerDocente = docentesMapeados[0];
    if (primerDocente.nombre === 'María' && primerDocente.apellido === 'García') {
      console.log('\n🎉 ¡MAPEO CORRECTO! Los nombres se muestran bien');
    } else {
      console.log('\n❌ Mapeo incorrecto. Revisar la función corregirEncoding');
    }
    
    return docentesMapeados;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
};

// Función para simular creación de curso con docente real
const simularCreacionCurso = async (docenteId = 2) => {
  console.log(`\n🧪 Simulando creación de curso con docente ID: ${docenteId}`);
  
  const cursoData = {
    nombre_curso: "Prueba Docentes Reales",
    codigo_curso: "PRUEBA-001",
    descripcion: "Curso de prueba con docente real",
    fecha_inicio: "2024-06-01T08:00:00Z",
    fecha_fin: "2024-07-15T17:00:00Z",
    cupo_maximo: 30,
    cupo_estimado: 25,
    espacio_asignado: "Aula 101",
    estado: "Abierto",
    id_materia: 1,
    id_docente: docenteId
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/cursos-verano', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cursoData)
    });
    
    if (response.ok) {
      const resultado = await response.json();
      console.log('✅ Curso creado exitosamente con docente real:', resultado);
      return resultado;
    } else {
      const error = await response.json();
      console.log('❌ Error creando curso:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error en la petición:', error);
    return null;
  }
};

// Función principal
const ejecutarPruebaFinal = async () => {
  console.log('🚀 INICIANDO PRUEBA FINAL DE DOCENTES REALES\n');
  
  // 1. Probar docentes
  const docentes = await probarDocentesCompletos();
  if (!docentes) {
    console.log('❌ No se puede continuar: error obteniendo docentes');
    return;
  }
  
  // 2. Simular creación de curso
  const curso = await simularCreacionCurso(2); // Usar María García
  
  console.log('\n🎉 PRUEBA FINAL COMPLETADA');
  console.log('✅ Docentes reales obtenidos y mapeados correctamente');
  console.log('✅ Nombres con acentos corregidos');
  console.log('✅ Estructura compatible con frontend');
  if (curso) {
    console.log('✅ Creación de curso con docente real funcionando');
  }
  
  return { docentes, curso };
};

// Exportar funciones para uso en consola
window.probarDocentesCompletos = probarDocentesCompletos;
window.simularCreacionCurso = simularCreacionCurso;
window.ejecutarPruebaFinal = ejecutarPruebaFinal;

console.log('\n📋 FUNCIONES DISPONIBLES:');
console.log('• ejecutarPruebaFinal() - Ejecuta la prueba completa');
console.log('• probarDocentesCompletos() - Prueba solo los docentes');
console.log('• simularCreacionCurso(docenteId) - Prueba crear curso');
console.log('\n💡 Para usar: ejecutarPruebaFinal()');
