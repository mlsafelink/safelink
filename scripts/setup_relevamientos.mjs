/**
 * Script de setup y verificación: tabla relevamientos
 * Corrige RLS y verifica INSERT/UPDATE/SELECT/DELETE
 * Ejecutar: node scripts/setup_relevamientos.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = 'https://aieqlypuyrgeticrshzg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZXFseXB1eXJnZXRpY3JzaHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTk1OTEsImV4cCI6MjA5OTczNTU5MX0.NQarlbOV27F_Ir4RvdMiQddJS6BLSSrMS5EUO1r5NBA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   SafeLink Note — Verificación tabla relevamientos   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  /* ─── PASO 1: verificar tabla ─── */
  console.log('PASO 1 — Verificando tabla...');
  const { error: checkErr } = await supabase
    .from('relevamientos')
    .select('id')
    .limit(1);

  if (checkErr) {
    console.log(`  ✗ TABLA NO ENCONTRADA: ${checkErr.message}`);
    console.log('\n  ► Ejecutá primero en Supabase SQL Editor:');
    console.log('    supabase/migrations/20260922_relevamientos.sql');
    console.log('  ► Luego ejecutá el parche de RLS:');
    console.log('    supabase/migrations/20260922_relevamientos_rls_patch.sql\n');
    process.exit(1);
  }
  console.log('  ✓ Tabla encontrada.\n');

  /* ─── PASO 2: INSERT ─── */
  console.log('PASO 2 — INSERT de prueba...');
  const { data: ins, error: insErr } = await supabase
    .from('relevamientos')
    .insert([{
      cliente:       'Test Cliente SA',
      direccion:     'Av. Corrientes 1234, CABA',
      contacto:      '11-9999-0000',
      tipos_trabajo: ['CAMARAS', 'ELECTRICIDAD'],
      observaciones: 'Prueba automática de verificación.',
      fotos:         [],
      materiales:    [{
        id: 'mat-001', nombre: 'Cable UTP Cat6',
        cantidad: '10', costo: '5000', observacion: 'rollo'
      }],
      estado: 'PENDIENTE',
    }])
    .select()
    .single();

  if (insErr) {
    console.log(`  ✗ INSERT fallido: ${insErr.message}`);
    if (insErr.message.includes('row-level security')) {
      console.log('\n  ► El problema es RLS. Ejecutá en Supabase SQL Editor:');
      console.log('    supabase/migrations/20260922_relevamientos_rls_patch.sql\n');
    }
    process.exit(1);
  }
  const id = ins.id;
  console.log(`  ✓ INSERT OK`);
  console.log(`    id:            ${id}`);
  console.log(`    estado:        ${ins.estado}`);
  console.log(`    tipos_trabajo: ${JSON.stringify(ins.tipos_trabajo)}`);

  /* ─── PASO 3: UPDATE ─── */
  console.log('\nPASO 3 — UPDATE → FINALIZADO...');
  const { data: upd, error: updErr } = await supabase
    .from('relevamientos')
    .update({ estado: 'FINALIZADO', observaciones: 'Observación actualizada.' })
    .eq('id', id)
    .select('id, estado, updated_at')
    .single();

  if (updErr) {
    console.log(`  ✗ UPDATE fallido: ${updErr.message}`);
    process.exit(1);
  }
  console.log(`  ✓ UPDATE OK — estado: ${upd.estado}`);

  /* ─── PASO 4: SELECT completo ─── */
  console.log('\nPASO 4 — SELECT completo...');
  const { data: sel, error: selErr } = await supabase
    .from('relevamientos')
    .select('*')
    .eq('id', id)
    .single();

  if (selErr) {
    console.log(`  ✗ SELECT fallido: ${selErr.message}`);
    process.exit(1);
  }
  console.log(`  ✓ SELECT OK`);
  console.log(`    cliente:       ${sel.cliente}`);
  console.log(`    tipos_trabajo: ${JSON.stringify(sel.tipos_trabajo)}`);
  console.log(`    estado:        ${sel.estado}`);
  console.log(`    materiales:    ${JSON.stringify(sel.materiales)}`);
  console.log(`    fotos count:   ${sel.fotos?.length ?? 0}`);

  /* ─── PASO 5: DELETE limpieza ─── */
  console.log('\nPASO 5 — Limpiando registro de prueba...');
  const { error: delErr } = await supabase
    .from('relevamientos')
    .delete()
    .eq('id', id);

  if (delErr) {
    console.log(`  ✗ DELETE fallido: ${delErr.message}`);
    process.exit(1);
  }
  console.log('  ✓ DELETE OK\n');

  console.log('══════════════════════════════════════════════════════');
  console.log('  ✅  TODAS LAS PRUEBAS PASARON — tabla lista para usar');
  console.log('══════════════════════════════════════════════════════\n');
}

run().catch(e => {
  console.error('\n[FATAL]', e?.message ?? e);
  process.exit(1);
});
