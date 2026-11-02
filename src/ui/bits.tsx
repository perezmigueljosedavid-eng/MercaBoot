const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "24 dic" */
export function fechaCorta(ms: number) {
  const d = new Date(ms);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** Texto de precio: "$110 por kg" o "Precio por confirmar". */
export function textoPrecio(precio?: number, unidad?: string) {
  if (precio == null) return 'Precio por confirmar';
  const p = Number.isInteger(precio) ? `$${precio}` : `$${precio.toFixed(2)}`;
  return unidad ? `${p} por ${unidad}` : p;
}

/** "hace 5 min", "hace 3 h", "ayer", "hace 4 días" */
export function haceCuanto(ms: number, ahora = Date.now()) {
  const min = Math.max(0, Math.round((ahora - ms) / 60000));
  if (min < 1) return 'justo ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return fechaCorta(ms);
}
