/**
 * Los textos del «Aviso con un toque» (el botón «Avisar a mis clientes» que aparece al marcar un producto como agotado o disponible).
 * Son los mismos que sugiere la pantalla de avisos, escritos en el mismo tono. Nunca pasan de 300 letras, que es lo que acepta
 * la base de datos, aunque el nombre del producto sea muy largo.
 * Autor: José David Pérez Miguel
 */

const MAXIMO_AVISO = 300;

/** El nombre como se dice en una frase: sin espacios de más y en minúsculas («Aguacate Hass» → «aguacate hass»). */
function nombreEnFrase(nombre: string): string {
  return nombre.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** El texto del aviso que se publica: «Ya hay aguacate.» / «Ya no hay aguacate por hoy.» (o, si es por encargo, de pedidos). */
export function textoDeAvisoRapido(nombre: string, hay: boolean, porEncargo = false): string {
  const p = nombreEnFrase(nombre);
  const texto = porEncargo
    ? hay
      ? `Ya recibo pedidos de ${p}.`
      : `Por hoy ya no recibo pedidos de ${p}.`
    : hay
      ? `Ya hay ${p}.`
      : `Ya no hay ${p} por hoy.`;
  return texto.length <= MAXIMO_AVISO ? texto : texto.slice(0, MAXIMO_AVISO - 1).trimEnd() + '…';
}

/** Lo que dice el cartelito justo después de marcar el producto. */
export function fraseDelCartel(nombre: string, hay: boolean, porEncargo = false): string {
  const n = nombre.replace(/\s+/g, ' ').trim();
  if (porEncargo) return hay ? `«${n}» ya recibe pedidos.` : `«${n}» ya no recibe pedidos.`;
  return hay ? `«${n}» ya aparece como disponible.` : `«${n}» aparece como agotado.`;
}

/** El mensaje de confirmación cuando el aviso ya quedó publicado. */
export function confirmacionDeAviso(nombre: string, hay: boolean): string {
  return hay ? `Listo: tus clientes ya ven que hay ${nombreEnFrase(nombre)}.` : 'Listo: el aviso quedó publicado en tu negocio.';
}
