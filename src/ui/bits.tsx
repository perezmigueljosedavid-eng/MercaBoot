import React from 'react';
import { View } from 'react-native';
import { TIPOS_AVISO } from '../data/contenido';
import { festividad as buscarFiesta } from '../data/festividades';
import type { TipoAviso } from '../data/tipos';
import { C } from './theme';
import { T } from './T';
import { Badge, Tag } from './kit';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "24 dic" */
export function fechaCorta(ms: number) {
  const d = new Date(ms);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** Cuánto le queda a un aviso, solo si dura más de este día. */
export function vigencia(hasta?: number, ahora = Date.now()) {
  if (!hasta) return null;
  if (hasta - ahora <= 24 * 3600 * 1000) return null;
  return `Hasta el ${fechaCorta(hasta)}`;
}

export interface AvisoMostrable {
  tipo: TipoAviso;
  texto: string;
  negocio?: string;
  hasta?: number;
  /** Id de la fiesta (en los avisos guardados) o su nombre corto (en lo que responde el asistente). */
  festividad?: string;
}

/** Nombre de la fiesta a partir de su id; si no es un id conocido se muestra tal cual. */
export const nombreFiesta = (idONombre?: string) => (idONombre ? (buscarFiesta(idONombre)?.corto ?? idONombre) : null);

/** Fila de aviso: insignia de color + "negocio · texto", y la fiesta a la que se refiere si la tiene. */
export function AvisoFila({ a, mostrarNegocio = true }: { a: AvisoMostrable; mostrarNegocio?: boolean }) {
  const t = TIPOS_AVISO[a.tipo];
  const dura = vigencia(a.hasta);
  const fiesta = nombreFiesta(a.festividad);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={{ marginTop: 1 }}>
        <Badge bg={t.bg} fg={t.fg}>
          {t.badge}
        </Badge>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <T size={14} lh={1.35}>
          {mostrarNegocio && a.negocio ? (
            <>
              <T size={14} weight={700}>
                {a.negocio}
              </T>
              {' · '}
            </>
          ) : null}
          {a.texto}
        </T>
        {fiesta || dura ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            {fiesta ? (
              <Tag bg={C.amberTint} fg={C.amberText}>
                {fiesta}
              </Tag>
            ) : null}
            {dura ? (
              <T size={12} weight={600} color={C.amberText}>
                {dura}
              </T>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
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

/** «4:35 pm» */
export function horaCorta(ms: number) {
  const d = new Date(ms);
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
