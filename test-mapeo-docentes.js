// 🧪 **PRUEBA RÁPIDA - MAPEO DE DOCENTES**

console.log('🎯 PROBANDO MAPEO DE DOCENTES CORREGIDO');

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

// Datos de ejemplo del backend (con encoding problemático)
const docenteBackend = {
  "id_usuario": 2,
  "apellido": "Garc??a",
  "objRol": {
    "id_rol": 2,
    "nombre": "Docente"
  },
  "telefono": "3007654321",
  "nombre": "Mar??a",
  "email": "maria.garcia@unicauca.edu.co"
};

// Mapear como lo hace el frontend
const docenteMapeado = {
  id_usuario: docenteBackend.id_usuario,
  nombre: corregirEncoding(docenteBackend.nombre || 'Sin nombre'),
  apellido: corregirEncoding(docenteBackend.apellido || 'Sin apellido'),
  email: corregirEncoding(docenteBackend.email || 'Sin email'),
  telefono: docenteBackend.telefono || 'Sin teléfono',
  objRol: {
    id_rol: docenteBackend.objRol?.id_rol || 2,
    nombre_rol: corregirEncoding(docenteBackend.objRol?.nombre || 'Docente')
  }
};

console.log('📋 Docente del backend:', docenteBackend);
console.log('✅ Docente mapeado:', docenteMapeado);

// Verificar que el mapeo funciona
if (docenteMapeado.nombre === 'María' && docenteMapeado.apellido === 'García') {
  console.log('🎉 ¡MAPEO CORRECTO! Los nombres se muestran bien');
} else {
  console.log('❌ Mapeo incorrecto. Revisar la función corregirEncoding');
}

// Función para probar con datos reales del backend
const probarMapeoReal = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/cursos-intersemestrales/docentes');
    const docentes = await response.json();
    
    console.log('\n🔍 Probando mapeo con datos reales...');
    
    const docentesMapeados = docentes.map(docente => ({
      id_usuario: docente.id_usuario,
      nombre: corregirEncoding(docente.nombre || 'Sin nombre'),
      apellido: corregirEncoding(docente.apellido || 'Sin apellido'),
      email: corregirEncoding(docente.email || 'Sin email'),
      telefono: docente.telefono || 'Sin teléfono',
      objRol: {
        id_rol: docente.objRol?.id_rol || 2,
        nombre_rol: corregirEncoding(docente.objRol?.nombre || 'Docente')
      }
    }));
    
    console.log('📊 Total de docentes:', docentesMapeados.length);
    console.log('📋 Primeros 3 docentes mapeados:');
    docentesMapeados.slice(0, 3).forEach((docente, index) => {
      console.log(`${index + 1}. ${docente.nombre} ${docente.apellido} (${docente.email})`);
    });
    
    return docentesMapeados;
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
};

// Exportar función para uso en consola
window.probarMapeoReal = probarMapeoReal;

console.log('\n💡 Para probar con datos reales: probarMapeoReal()');
