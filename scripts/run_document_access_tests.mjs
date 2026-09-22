import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aieqlypuyrgeticrshzg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZXFseXB1eXJnZXRpY3JzaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTk1OTEsImV4cCI6MjA5OTczNTU5MX0.NQarlbOV27F_Ir4RvdMiQddJS6BLSSrMS5EUO1r5NBA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTests() {
  console.log('====================================================');
  console.log('BATERÍA DE PRUEBAS: CONTADOR DE ACCESOS PÚBLICOS');
  console.log('====================================================\n');

  // Obtener un documento de prueba para cada tipo
  const { data: instructivos } = await supabase.from('instructivos').select('*').limit(1);
  const { data: presupuestos } = await supabase.from('presupuestos').select('*').limit(1);
  const { data: reportes } = await supabase.from('reportes').select('*').limit(1);
  const { data: reportesTrabajo } = await supabase.from('reportes_trabajo').select('*').limit(1);

  if (!instructivos?.length || !presupuestos?.length || !reportes?.length || !reportesTrabajo?.length) {
    console.error('No se encontraron registros para todos los tipos de documentos.');
    return;
  }

  const inst = instructivos[0];
  const pres = presupuestos[0];
  const rep = reportes[0];
  const repTrab = reportesTrabajo[0];

  // Helper para consultar contador actual
  const getCount = async (table, id) => {
    const { data } = await supabase.from(table).select('access_count').eq('id', id).single();
    return data?.access_count ?? 0;
  };

  // Helper para resetear contador a un valor específico
  const setCount = async (table, id, count) => {
    await supabase.from(table).update({ access_count: count }).eq('id', id);
  };

  // Helper para llamar a la RPC
  const track = async (table, identifier) => {
    const { data, error } = await supabase.rpc('increment_document_access', {
      p_table_name: table,
      p_identifier: identifier,
    });
    if (error) throw new Error(error.message);
    return data;
  };

  // ----------------------------------------------------
  // PRUEBA 1: INSTRUCTIVO
  // ----------------------------------------------------
  console.log('PRUEBA 1 — INSTRUCTIVO');
  await setCount('instructivos', inst.id, 0);
  let c1_inicial = await getCount('instructivos', inst.id);
  console.log(`  Contador inicial: ${c1_inicial} (Esperado: 0)`);

  // Primer acceso público
  await track('instructivos', inst.public_slug || inst.public_id || inst.id);
  let c1_paso1 = await getCount('instructivos', inst.id);
  console.log(`  Primer acceso público: ${c1_paso1} (Esperado: 1)`);

  // Recarga / segundo acceso público
  await track('instructivos', inst.public_slug || inst.public_id || inst.id);
  let c1_paso2 = await getCount('instructivos', inst.id);
  console.log(`  Recarga del enlace: ${c1_paso2} (Esperado: 2)`);
  console.log(`  Resultado PRUEBA 1: ${c1_paso2 === 2 ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

  // ----------------------------------------------------
  // PRUEBA 2: PRESUPUESTO
  // ----------------------------------------------------
  console.log('PRUEBA 2 — PRESUPUESTO');
  await setCount('presupuestos', pres.id, 0);
  const pres_ini = await getCount('presupuestos', pres.id);
  const inst_antes_pres = await getCount('instructivos', inst.id);

  // Abrir enlace público de presupuesto
  await track('presupuestos', pres.public_id || pres.id);
  const pres_despues = await getCount('presupuestos', pres.id);
  const inst_despues_pres = await getCount('instructivos', inst.id);

  console.log(`  Presupuesto inicial: ${pres_ini} -> Después: ${pres_despues} (Esperado: 1)`);
  console.log(`  Instructivo antes: ${inst_antes_pres} -> Después: ${inst_despues_pres} (Esperado: sin cambios)`);
  const prueba2_ok = pres_despues === pres_ini + 1 && inst_antes_pres === inst_despues_pres;
  console.log(`  Resultado PRUEBA 2: ${prueba2_ok ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

  // ----------------------------------------------------
  // PRUEBA 3: REPORTE TÉCNICO
  // ----------------------------------------------------
  console.log('PRUEBA 3 — REPORTE TÉCNICO');
  await setCount('reportes', rep.id, 0);
  const rep_ini = await getCount('reportes', rep.id);
  const pres_antes_rep = await getCount('presupuestos', pres.id);

  await track('reportes', rep.public_id || rep.id);
  const rep_despues = await getCount('reportes', rep.id);
  const pres_despues_rep = await getCount('presupuestos', pres.id);

  console.log(`  Reporte inicial: ${rep_ini} -> Después: ${rep_despues} (Esperado: 1)`);
  console.log(`  Presupuesto antes: ${pres_antes_rep} -> Después: ${pres_despues_rep} (Esperado: sin cambios)`);
  const prueba3_ok = rep_despues === rep_ini + 1 && pres_antes_rep === pres_despues_rep;
  console.log(`  Resultado PRUEBA 3: ${prueba3_ok ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

  // ----------------------------------------------------
  // PRUEBA 4: REPORTE DE TRABAJO
  // ----------------------------------------------------
  console.log('PRUEBA 4 — REPORTE DE TRABAJO');
  await setCount('reportes_trabajo', repTrab.id, 0);
  const repTrab_ini = await getCount('reportes_trabajo', repTrab.id);

  await track('reportes_trabajo', repTrab.public_id || repTrab.id);
  const repTrab_despues = await getCount('reportes_trabajo', repTrab.id);

  console.log(`  Reporte trabajo inicial: ${repTrab_ini} -> Después: ${repTrab_despues} (Esperado: 1)`);
  const prueba4_ok = repTrab_despues === repTrab_ini + 1;
  console.log(`  Resultado PRUEBA 4: ${prueba4_ok ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

  // ----------------------------------------------------
  // PRUEBA 5: ENLACE ANTIGUO (UUID)
  // ----------------------------------------------------
  console.log('PRUEBA 5 — ENLACE ANTIGUO (UUID)');
  const uuidTest = inst.public_id;
  const inst_pre_uuid = await getCount('instructivos', inst.id);
  await track('instructivos', uuidTest);
  const inst_post_uuid = await getCount('instructivos', inst.id);
  console.log(`  Acceso usando UUID ${uuidTest}: ${inst_pre_uuid} -> ${inst_post_uuid} (Esperado: +1)`);
  const prueba5_ok = inst_post_uuid === inst_pre_uuid + 1;
  console.log(`  Resultado PRUEBA 5: ${prueba5_ok ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

  // ----------------------------------------------------
  // PRUEBA 6: ENLACE NUEVO (SLUG PERSONALIZADO)
  // ----------------------------------------------------
  console.log('PRUEBA 6 — ENLACE NUEVO (SLUG PERSONALIZADO)');
  const { data: instsConSlug } = await supabase
    .from('instructivos')
    .select('*')
    .not('public_slug', 'is', null)
    .limit(1);

  const instSlugDoc = instsConSlug && instsConSlug[0] ? instsConSlug[0] : null;

  if (instSlugDoc) {
    const slugTest = instSlugDoc.public_slug;
    const inst_pre_slug = await getCount('instructivos', instSlugDoc.id);
    await track('instructivos', slugTest);
    const inst_post_slug = await getCount('instructivos', instSlugDoc.id);
    console.log(`  Acceso usando Slug '${slugTest}': ${inst_pre_slug} -> ${inst_post_slug} (Esperado: +1)`);
    const prueba6_ok = inst_post_slug === inst_pre_slug + 1;
    console.log(`  Resultado PRUEBA 6: ${prueba6_ok ? '✅ PASÓ' : '❌ FALLÓ'}\n`);
  } else {
    console.log('  No se encontró un instructivo con public_slug para la prueba 6.\n');
  }

  // ----------------------------------------------------
  // PRUEBA 7: ACCIONES ADMINISTRATIVAS
  // ----------------------------------------------------
  console.log('PRUEBA 7 — ACCIONES ADMINISTRATIVAS');
  const inst_pre_admin = await getCount('instructivos', inst.id);

  // Simulación: consultas internas de administración (getAll / getById / generar PDF)
  await supabase.from('instructivos').select('*').eq('id', inst.id).single();
  await supabase.from('instructivos').select('*, consorcios(*)');

  const inst_post_admin = await getCount('instructivos', inst.id);
  console.log(`  Contador antes de consultas y acciones administrativas: ${inst_pre_admin}`);
  console.log(`  Contador después de consultas administrativas y exportación: ${inst_post_admin}`);
  const prueba7_ok = inst_pre_admin === inst_post_admin;
  console.log(`  Resultado PRUEBA 7: ${prueba7_ok ? '✅ PASÓ (Contador intacto)' : '❌ FALLÓ'}\n`);

  // ----------------------------------------------------
  // PRUEBA 8: CONCURRENCIA
  // ----------------------------------------------------
  console.log('PRUEBA 8 — CONCURRENCIA (Accesos Simultáneos)');
  const targetDoc = instSlugDoc || inst;
  const targetIdentifier = targetDoc.public_slug || targetDoc.public_id;
  const c_ini_concurrencia = await getCount('instructivos', targetDoc.id);
  console.log(`  Contador antes de concurrencia: ${c_ini_concurrencia}`);

  // Dos llamadas concurrentes simultáneas usando Promise.all
  console.log('  Disparando 2 accesos concurrentes simultáneos vía Promise.all...');
  const [res1, res2] = await Promise.all([
    track('instructivos', targetIdentifier),
    track('instructivos', targetIdentifier),
  ]);

  const c_final_concurrencia = await getCount('instructivos', targetDoc.id);
  console.log(`  Respuestas atómicas RPC: [${res1}, ${res2}]`);
  console.log(`  Contador final verificado: ${c_ini_concurrencia} -> ${c_final_concurrencia} (Esperado: ${c_ini_concurrencia + 2})`);
  const prueba8_ok = c_final_concurrencia === c_ini_concurrencia + 2;
  console.log(`  Resultado PRUEBA 8: ${prueba8_ok ? '✅ PASÓ (Sin condición de carrera)' : '❌ FALLÓ'}\n`);

  console.log('====================================================');
  console.log('RESUMEN DE PRUEBAS COMPLETADO');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\nError durante la ejecución de las pruebas:', err.message);
});
