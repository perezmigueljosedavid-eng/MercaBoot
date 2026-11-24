// Arma supabase/actualizacion-v2-todo.sql: UN solo archivo con todo lo que la versión 2 le agrega a la base de datos.
// Así, para actualizar la base de datos real, basta con pegar ese archivo en el Editor SQL de Supabase y tocar «Run».
//
//   node scripts/armar-sql-v2.cjs            → escribe supabase/actualizacion-v2-todo.sql
//   node scripts/armar-sql-v2.cjs --revisar  → no escribe nada; termina con error si el archivo está desactualizado
//                                              o si alguna parte tiene algo que borra (DROP, TRUNCATE…)
//
// El archivo grande NUNCA se edita a mano: se arma desde las partes (supabase/actualizacion-v2-*.sql). Si cambias una parte,
// vuelve a correr este script.
//
// Reglas que se revisan solas (la base de datos la comparten la versión final registrada, «Mercaboot Voz» y «Mercaboot 2»,
// así que la actualización tiene que ser aditiva):
//   · nada de DROP, TRUNCATE ni ALTER … DROP / RENAME (se entra a la base sin quitar ni renombrar nada de lo que ya usan las apps);
//   · cada parte se puede correr varias veces sin problema (eso lo prueban los scripts de prueba contra una base de copia).
// Autor: José David Pérez Miguel
const fs = require('fs');
const path = require('path');

const carpeta = path.join(__dirname, '..', 'supabase');
const SALIDA = path.join(carpeta, 'actualizacion-v2-todo.sql');

// Ya están en la base de datos real (no se repiten aquí): esquema.sql y las actualizaciones 2.1, final, seguridad, detalle de
// productos, receta-ia y v2-productos. Lo que falta, en este orden (cada parte solo depende de las anteriores):
const PARTES = [
  ['actualizacion-v2-reportes.sql', 'Reportar y bloquear'],
  ['actualizacion-v2-codigos.sql', 'Códigos de barras compartidos'],
  ['actualizacion-v2-boti.sql', 'Boti: lo que la gente busca y no encuentra'],
  ['actualizacion-v2-notificaciones.sql', 'Avisos al teléfono y alertas de productos'],
  ['actualizacion-v2-pagos.sql', 'Pagos: link de tarjeta y link por pedido'],
  ['actualizacion-v2-cuenta.sql', 'Eliminar mi cuenta'],
];

// Quita los comentarios del SQL (los de dos guiones y los de bloque) para buscar instrucciones peligrosas sin confundirse con el texto explicativo.
function sinComentarios(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

const PROHIBIDO = [
  [/\bdrop\s+(table|function|trigger|policy|index|view|column|schema|type|extension|constraint|sequence|role|publication)\b/i, 'DROP'],
  [/\btruncate\b/i, 'TRUNCATE'],
  [/\balter\s+table\b[^;]*\b(drop|rename)\b/i, 'ALTER … DROP/RENAME'],
  [/\balter\s+(function|type|schema)\b[^;]*\brename\b/i, 'ALTER … RENAME'],
];

function armar() {
  const trozos = [];
  const problemas = [];
  for (const [archivo] of PARTES) {
    const ruta = path.join(carpeta, archivo);
    if (!fs.existsSync(ruta)) {
      problemas.push(`Falta ${archivo}`);
      continue;
    }
    const sql = fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n');
    const limpio = sinComentarios(sql);
    for (const [re, nombre] of PROHIBIDO) if (re.test(limpio)) problemas.push(`${archivo} tiene ${nombre}: la actualización debe ser solo aditiva`);
    // «notify» se manda una sola vez, al final de todo
    trozos.push(sql.replace(/^notify pgrst, 'reload schema';[ \t]*\n?/gim, '').trimEnd() + '\n');
  }
  if (problemas.length) return { problemas };

  const indice = PARTES.map(([archivo, titulo], i) => `--   Parte ${i + 1} de ${PARTES.length}: ${titulo}  (viene de ${archivo})`).join('\n');
  const cabecera = `-- ============================================================================
-- Mercaboot · versión 2 · TODA la actualización de la base de datos en un solo archivo
-- Autor: José David Pérez Miguel
--
-- Archivo generado: lo arma «node scripts/armar-sql-v2.cjs» juntando las partes de supabase/actualizacion-v2-*.sql.
-- No lo edites aquí: cambia la parte que corresponda y vuelve a armarlo.
--
-- Cómo usarlo:  Supabase → tu proyecto → SQL Editor → New query → pega TODO este archivo → Run.
--               Debe terminar con «Success. No rows returned». Todo ocurre en una sola operación: si algo falla, no se aplica nada.
--
-- Es SOLO ADITIVO: agrega tablas, funciones, columnas y reglas nuevas. No borra ni renombra nada de lo que ya usan la versión final
-- registrada, «Mercaboot Voz» y «Mercaboot 2», que comparten esta base de datos. Se puede correr varias veces sin problema.
--
-- Qué trae (en este orden):
${indice}
--
-- Ya debe estar aplicado antes: esquema.sql y las actualizaciones 2.1, final, seguridad, detalle de productos,
-- receta-ia y v2-productos (en tu base de datos real ya lo están).
-- ============================================================================

`;
  const partes = trozos.map((t, i) => `\n-- ═════════════════════════ Parte ${i + 1} de ${PARTES.length} · ${PARTES[i][1]} ═════════════════════════\n\n${t}`);
  const pie = `\n-- ═════════════════════════ Fin ═════════════════════════\n-- Le avisa a la API de Supabase que hay funciones nuevas (para que la app las vea al instante).\nnotify pgrst, 'reload schema';\n`;
  return { texto: cabecera + partes.join('') + pie };
}

const { texto, problemas } = armar();
if (problemas) {
  console.error('No se pudo armar la actualización:\n  · ' + problemas.join('\n  · '));
  process.exit(1);
}

if (process.argv.includes('--revisar')) {
  const actual = fs.existsSync(SALIDA) ? fs.readFileSync(SALIDA, 'utf8').replace(/\r\n/g, '\n') : null;
  if (actual !== texto) {
    console.error('supabase/actualizacion-v2-todo.sql está desactualizado. Corre: node scripts/armar-sql-v2.cjs');
    process.exit(1);
  }
  console.log('actualizacion-v2-todo.sql está al día y solo agrega cosas (sin DROP ni TRUNCATE).');
} else {
  fs.writeFileSync(SALIDA, texto);
  console.log(`Listo: ${path.relative(process.cwd(), SALIDA)} (${PARTES.length} partes, ${(texto.length / 1024).toFixed(1)} KB)`);
}
