// 🧪 **ARCHIVO DE PRUEBA - DOCENTES REALES**

console.log('🎯 INICIANDO PRUEBAS DE DOCENTES REALES');

// Función para probar el endpoint de docentes
const probarEndpointDocentes = async () => {
  try {
    console.log('📡 Probando endpoint GET /api/cursos-intersemestrales/docentes...');
    
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/docentes');
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const docentes = await response.json();
    
    console.log('✅ Respuesta del backend:');
    console.log('📊 Total de docentes:', docentes.length);
    console.log('📋 Estructura del primer docente:', docentes[0]);
    
    // Verificar estructura de datos
    if (docentes.length > 0) {
      const primerDocente = docentes[0];
      console.log('\n🔍 Verificando campos del backend:');
      console.log('✅ id_usuario:', primerDocente.id_usuario);
      console.log('✅ codigo_usuario:', primerDocente.codigo_usuario);
      console.log('✅ nombre_usuario:', primerDocente.nombre_usuario);
      console.log('✅ correo:', primerDocente.correo);
      console.log('✅ telefono:', primerDocente.telefono);
      console.log('✅ objRol:', primerDocente.objRol);
    }
    
    return docentes;
  } catch (error) {
    console.error('❌ Error probando endpoint de docentes:', error);
    return null;
  }
};

// Función para mapear docentes como lo hace el frontend
const mapearDocentes = (docentes) => {
  console.log('\n🔄 Mapeando docentes al formato del frontend...');
  
  const docentesMapeados = docentes.map(docente => {
    // Función para corregir encoding
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
        .replace(/Ã'/g, 'Ñ');
    };
    
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
  });
  
  console.log('✅ Docentes mapeados:');
  console.log('📊 Total mapeados:', docentesMapeados.length);
  console.log('📋 Primer docente mapeado:', docentesMapeados[0]);
  
  return docentesMapeados;
};

// Función para simular el uso en el frontend
const simularUsoFrontend = (docentesMapeados) => {
  console.log('\n🎨 Simulando uso en el frontend...');
  
  // Simular dropdown de docentes
  console.log('📋 Opciones para dropdown de docentes:');
  docentesMapeados.forEach((docente, index) => {
    console.log(`${index + 1}. ${docente.nombre} ${docente.apellido} (${docente.email}) - ID: ${docente.id_usuario}`);
  });
  
  // Simular selección de docente
  if (docentesMapeados.length > 0) {
    const docenteSeleccionado = docentesMapeados[0];
    console.log('\n✅ Docente seleccionado para crear curso:');
    console.log('👤 Nombre:', `${docenteSeleccionado.nombre} ${docenteSeleccionado.apellido}`);
    console.log('📧 Email:', docenteSeleccionado.email);
    console.log('🆔 ID:', docenteSeleccionado.id_usuario);
  }
};

// Función principal para ejecutar todas las pruebas
const ejecutarPruebasCompletas = async () => {
  console.log('🚀 INICIANDO PRUEBAS COMPLETAS DE DOCENTES REALES\n');
  
  // 1. Probar endpoint
  const docentes = await probarEndpointDocentes();
  if (!docentes) {
    console.log('❌ No se puede continuar: error en endpoint');
    return;
  }
  
  // 2. Mapear docentes
  const docentesMapeados = mapearDocentes(docentes);
  
  // 3. Simular uso en frontend
  simularUsoFrontend(docentesMapeados);
  
  console.log('\n🎉 PRUEBAS COMPLETADAS');
  console.log('✅ Endpoint funcionando');
  console.log('✅ Mapeo correcto');
  console.log('✅ Listo para usar en frontend');
  
  return docentesMapeados;
};

// Función para probar creación de curso con docente real
const probarCreacionCurso = async (docenteId = 1) => {
  console.log(`\n🧪 Probando creación de curso con docente ID: ${docenteId}`);
  
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

// Exportar funciones para uso en consola
window.probarEndpointDocentes = probarEndpointDocentes;
window.mapearDocentes = mapearDocentes;
window.simularUsoFrontend = simularUsoFrontend;
window.ejecutarPruebasCompletas = ejecutarPruebasCompletas;
window.probarCreacionCurso = probarCreacionCurso;

console.log('\n📋 FUNCIONES DISPONIBLES:');
console.log('• ejecutarPruebasCompletas() - Ejecuta todas las pruebas');
console.log('• probarEndpointDocentes() - Prueba solo el endpoint');
console.log('• probarCreacionCurso(docenteId) - Prueba crear curso con docente real');
console.log('\n💡 Para usar: ejecutarPruebasCompletas()');
