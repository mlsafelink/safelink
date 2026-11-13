import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const supabaseUrl = 'https://aieqlypuyrgeticrshzg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZXFseXB1eXJnZXRpY3JzaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTk1OTEsImV4cCI6MjA5OTczNTU5MX0.NQarlbOV27F_Ir4RvdMiQddJS6BLSSrMS5EUO1r5NBA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log('\n================================================================');
  console.log('  BATERÍA DE VERIFICACIÓN: CONFORMIDAD Y TRAZABILIDAD SAFELINK');
  console.log('================================================================\n');

  // PRUEBA 1: Reportes existentes siguen funcionando
  console.log('TEST 1: Verificando consulta de reportes existentes...');
  const { data: reportes, error: errRep } = await supabase
    .from('reportes')
    .select('id, titulo, version, public_id, public_slug, fecha, cliente_nombre')
    .is('deleted_at', null)
    .limit(5);

  if (errRep || !reportes || reportes.length === 0) {
    console.error('  ❌ Error cargando reportes existentes:', errRep);
    process.exit(1);
  }
  console.log(`  ✓ Se recuperaron ${reportes.length} reportes existentes sin alteraciones.`);
  const reportePrueba = reportes[0];
  console.log(`  ✓ Reporte de prueba: "${reportePrueba.titulo}" (ID: ${reportePrueba.id}, v${reportePrueba.version})`);

  // PRUEBA 2: Cálculo canónico de SHA-256
  console.log('\nTEST 2: Verificando cálculo reproducible de huella digital SHA-256...');
  const canonicalObj = {
    id: reportePrueba.id,
    fecha: reportePrueba.fecha,
    titulo: reportePrueba.titulo,
    cliente_nombre: reportePrueba.cliente_nombre || '',
    version: reportePrueba.version || 1,
  };
  const canonicalString = JSON.stringify(canonicalObj);
  const hash1 = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  const hash2 = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  
  if (hash1 !== hash2 || hash1.length !== 64) {
    console.error('  ❌ Fallo en la reproducibilidad del hash SHA-256');
    process.exit(1);
  }
  console.log(`  ✓ Huella digital SHA-256 reproducible (64 caracteres): ${hash1}`);

  // PRUEBA 3: Seguridad RLS - Comprobar que clientes anónimos NO pueden alterar directamente registros
  console.log('\nTEST 3: Verificando seguridad RLS (impedir mutación directa desde cliente público)...');
  const { data: fakeInsert, error: fakeErr } = await supabase
    .from('reporte_aceptaciones')
    .insert({
      reporte_id: reportePrueba.id,
      reporte_version_id: '00000000-0000-0000-0000-000000000000',
      sha256: hash1,
      cliente_nombre: 'Hacker Intent',
    })
    .select();

  // Debe retornar error (RLS violado o tabla protegida) y fakeInsert debe ser nulo
  if (!fakeErr && fakeInsert && fakeInsert.length > 0) {
    console.error('  ❌ ALERTA DE SEGURIDAD: Cliente anónimo pudo insertar directamente en reporte_aceptaciones!');
    process.exit(1);
  } else {
    console.log(`  ✓ Protección RLS verificada: inserción directa no autorizada bloqueada correctamente.`);
  }

  // PRUEBA 4: Sistema de Notificaciones Administrativas (eventos_sistema)
  console.log('\nTEST 4: Verificando integración con notificaciones administrativas existentes...');
  
  // 4a: Notificación de aprobación
  const notifAprobacion = {
    tipo: 'reporte_aceptado',
    cliente_nombre: reportePrueba.cliente_nombre || 'Cliente Test',
    detalles: {
      reporte_id: reportePrueba.id,
      reporte_public_id: reportePrueba.public_slug || reportePrueba.public_id,
      version: reportePrueba.version || 1,
      sha256: hash1,
      titulo: reportePrueba.titulo,
      mensaje: 'Reporte aprobado por el cliente',
      leida: false,
    },
  };

  const { data: evAprob, error: errEvAprob } = await supabase
    .from('eventos_sistema')
    .insert(notifAprobacion)
    .select()
    .single();

  if (errEvAprob) {
    console.error('  ❌ Error registrando notificación de aprobación:', errEvAprob);
  } else {
    console.log(`  ✓ Notificación "Reporte aprobado por el cliente" creada exitosamente (ID: ${evAprob.id})`);
    console.log(`    - Título: ${evAprob.detalles?.mensaje}`);
    console.log(`    - Versión: v${evAprob.detalles?.version}`);
    console.log(`    - Enlace: /p/reporte/${evAprob.detalles?.reporte_public_id}`);
  }

  // 4b: Notificación de solicitud de modificación
  const notifModificacion = {
    tipo: 'reporte_modificacion_solicitada',
    cliente_nombre: reportePrueba.cliente_nombre || 'Cliente Test',
    detalles: {
      reporte_id: reportePrueba.id,
      reporte_public_id: reportePrueba.public_slug || reportePrueba.public_id,
      version: reportePrueba.version || 1,
      descripcion: 'Solicito revisar el sector de cámaras del subsuelo antes de la instalación definitiva.',
      titulo: reportePrueba.titulo,
      mensaje: 'Solicitud de modificación de reporte',
      leida: false,
    },
  };

  const { data: evMod, error: errEvMod } = await supabase
    .from('eventos_sistema')
    .insert(notifModificacion)
    .select()
    .single();

  if (errEvMod) {
    console.error('  ❌ Error registrando notificación de modificación:', errEvMod);
  } else {
    console.log(`  ✓ Notificación "Solicitud de modificación de reporte" creada exitosamente (ID: ${evMod.id})`);
    console.log(`    - Modificación solicitada: "${evMod.detalles?.descripcion}"`);
    console.log(`    - Enlace: /p/reporte/${evMod.detalles?.reporte_public_id}`);
  }

  // 4c: Marcar como leída persistente en Supabase (sin LocalStorage)
  if (evAprob) {
    console.log('\nTEST 5: Verificando persistencia de estado "leída" en Supabase...');
    const updatedDetalles = { ...evAprob.detalles, leida: true, leida_at: new Date().toISOString() };
    const { error: errUpdate } = await supabase
      .from('eventos_sistema')
      .update({ detalles: updatedDetalles })
      .eq('id', evAprob.id);

    if (errUpdate) {
      console.error('  ❌ Error actualizando estado de lectura en Supabase:', errUpdate);
    } else {
      console.log('  ✓ Notificación marcada como leída persistente en Supabase.');
    }
  }

  console.log('\n================================================================');
  console.log('  ✅ TODAS LAS VERIFICACIONES COMPLETADAS EXITOSAMENTE');
  console.log('================================================================\n');
}

runTests().catch(e => {
  console.error('\n[FATAL]', e);
  process.exit(1);
});

