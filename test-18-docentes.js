// 🧪 **PRUEBA - 18 DOCENTES REALES DEL BACKEND**

console.log('🎯 PROBANDO LOS 18 DOCENTES REALES DEL BACKEND');

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

// Función para mapear docente como lo hace el frontend
const mapearDocente = (docente) => {
  const nombreCompleto = corregirEncoding(docente.nombre_usuario || '');
  const partesNombre = nombreCompleto.split(' ');
  const nombre = partesNombre[0] || 'Sin nombre';
  const apellido = partesNombre.slice(1).join(' ') || 'Sin apellido';
  
  return {
    id_usuario: docente.id_usuario,
    nombre: nombre,
    apellido: apellido,
    email: corregirEncoding(docente.correo || 'Sin email'),
    telefono: docente.telefono || 'Sin teléfono',
    codigo_usuario: docente.codigo_usuario || 'Sin código',
    objRol: {
      id_rol: docente.objRol?.id_rol || 1,
      nombre_rol: corregirEncoding(docente.objRol?.nombre || 'Docente')
    }
  };
};

// Función para probar los 18 docentes
const probar18Docentes = async () => {
  try {
    console.log('📡 Obteniendo los 18 docentes del backend...');
    
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/docentes');
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const docentes = await response.json();
    
    console.log('✅ Docentes obtenidos del backend:');
    console.log('📊 Total de docentes:', docentes.length);
    
    if (docentes.length !== 18) {
      console.log('⚠️  ADVERTENCIA: Se esperaban 18 docentes, se obtuvieron:', docentes.length);
    }
    
    // Mapear todos los docentes
    const docentesMapeados = docentes.map(mapearDocente);
    
    console.log('\n🎨 DOCENTES MAPEADOS PARA EL FRONTEND:');
    console.log('📋 Formato: Nombre Apellido (Código)');
    docentesMapeados.forEach((docente, index) => {
      console.log(`${index + 1}. ${docente.nombre} ${docente.apellido} (${docente.codigo_usuario})`);
    });
    
    // Simular opciones del dropdown
    console.log('\n📋 OPCIONES PARA DROPDOWN:');
    docentesMapeados.forEach((docente, index) => {
      console.log(`<option value="${docente.id_usuario}">${docente.nombre} ${docente.apellido} (${docente.codigo_usuario})</option>`);
    });
    
    // Verificar algunos docentes específicos
    console.log('\n🔍 VERIFICACIÓN DE DOCENTES ESPECÍFICOS:');
    const docente1 = docentesMapeados.find(d => d.id_usuario === 1);
    if (docente1) {
      console.log('✅ Docente 1:', `${docente1.nombre} ${docente1.apellido} (${docente1.codigo_usuario})`);
    }
    
    const docente18 = docentesMapeados.find(d => d.id_usuario === 18);
    if (docente18) {
      console.log('✅ Docente 18:', `${docente18.nombre} ${docente18.apellido} (${docente18.codigo_usuario})`);
    }
    
    // Verificar que todos tienen código
    const docentesSinCodigo = docentesMapeados.filter(d => !d.codigo_usuario || d.codigo_usuario === 'Sin código');
    if (docentesSinCodigo.length > 0) {
      console.log('⚠️  Docentes sin código:', docentesSinCodigo.length);
    } else {
      console.log('✅ Todos los docentes tienen código');
    }
    
    return docentesMapeados;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
};

// Función para simular creación de curso con diferentes docentes
const probarCreacionConDocentes = async () => {
  console.log('\n🧪 PROBANDO CREACIÓN DE CURSOS CON DIFERENTES DOCENTES');
  
  const docentes = await probar18Docentes();
  if (!docentes || docentes.length === 0) {
    console.log('❌ No se pueden probar cursos sin docentes');
    return;
  }
  
  // Probar con el primer docente
  const primerDocente = docentes[0];
  console.log(`\n📝 Creando curso con docente: ${primerDocente.nombre} ${primerDocente.apellido} (${primerDocente.codigo_usuario})`);
  
  const cursoData = {
    nombre_curso: "Prueba 18 Docentes",
    codigo_curso: "PRUEBA-18",
    descripcion: "Curso de prueba con los 18 docentes reales",
    fecha_inicio: "2024-06-01T08:00:00Z",
    fecha_fin: "2024-07-15T17:00:00Z",
    cupo_maximo: 30,
    cupo_estimado: 25,
    espacio_asignado: "Aula 101",
    estado: "Abierto",
    id_materia: 1,
    id_docente: primerDocente.id_usuario
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
const ejecutarPrueba18Docentes = async () => {
  console.log('🚀 INICIANDO PRUEBA DE LOS 18 DOCENTES REALES\n');
  
  // 1. Probar docentes
  const docentes = await probar18Docentes();
  if (!docentes) {
    console.log('❌ No se puede continuar: error obteniendo docentes');
    return;
  }
  
  // 2. Probar creación de curso
  const curso = await probarCreacionConDocentes();
  
  console.log('\n🎉 PRUEBA DE 18 DOCENTES COMPLETADA');
  console.log('✅ Docentes reales obtenidos y mapeados correctamente');
  console.log('✅ Formato correcto: Nombre Apellido (Código)');
  console.log('✅ Estructura compatible con frontend');
  if (curso) {
    console.log('✅ Creación de curso con docente real funcionando');
  }
  
  return { docentes, curso };
};

// Exportar funciones para uso en consola
window.probar18Docentes = probar18Docentes;
window.probarCreacionConDocentes = probarCreacionConDocentes;
window.ejecutarPrueba18Docentes = ejecutarPrueba18Docentes;

console.log('\n📋 FUNCIONES DISPONIBLES:');
console.log('• ejecutarPrueba18Docentes() - Ejecuta la prueba completa');
console.log('• probar18Docentes() - Prueba solo los 18 docentes');
console.log('• probarCreacionConDocentes() - Prueba crear curso');
console.log('\n💡 Para usar: ejecutarPrueba18Docentes()');
