/**
 * Reclamar un negocio del directorio.
 *
 * Las tiendas que ya estaban en la lista de la comunidad aparecen en Mercaboot sin dueño. Para que nadie se quede con
 * una tienda ajena, cada una tiene un CÓDIGO DE RECLAMO secreto que el equipo de Mercaboot le entrega solo al dueño.
 *
 * Desde el Avance 2 el código se revisa en la nube (supabase/esquema.sql), no en el teléfono: allá solo está la
 * "huella" del código (SHA-256), el límite de intentos es por negocio y por cuenta, y no se puede saltar desde la app.
 * Para crear un código nuevo:   node scripts/codigo-reclamo.mjs <id-del-negocio>
 */

/** A quién le piden su código los dueños. Cámbialo por tu WhatsApp o correo, por ejemplo «por WhatsApp al 951 000 0000». */
export const DONDE_PEDIR_CODIGO = 'al equipo de Mercaboot';
