import React from 'react';
import { View } from 'react-native';
import type { Insignia } from '../ia/comparar';
import { Tag } from './kit';
import { T } from './T';
import { C } from './theme';

/** Lo que significa cada insignia: se dan solo cuando hay con qué comparar y nunca esconden a las demás tiendas. */
export const NOMBRE_INSIGNIA: Record<Insignia, string> = {
  cerca: 'Más cercana',
  calificada: 'Mejor calificada',
  barata: 'Más económica',
};

const TONO: Record<Insignia, { bg: string; fg: string }> = {
  cerca: { bg: C.greenTint, fg: C.greenDark },
  calificada: { bg: C.amberTint, fg: C.amberText },
  barata: { bg: C.green, fg: C.white },
};

/** "★ 4.5 (12)" o "Sin reseñas". */
export function textoEstrellas(estrellas?: number | null, resenas?: number): string {
  if (estrellas == null) return 'Sin reseñas';
  return `★ ${estrellas.toFixed(1)}${resenas ? ` (${resenas})` : ''}`;
}

export function Insignias({ lista }: { lista?: Insignia[] }) {
  if (!lista?.length) return null;
  return (
    <>
      {lista.map((i) => (
        <Tag key={i} bg={TONO[i].bg} fg={TONO[i].fg}>
          {NOMBRE_INSIGNIA[i]}
        </Tag>
      ))}
    </>
  );
}

/**
 * Una línea de rasgos de una tienda o de una oferta: estrellas, entrega a domicilio, en qué destaca y una nota.
 * Las tiendas sin reseñas se muestran sin estrellas, sin castigo.
 */
export function Rasgos({
  estrellas,
  resenas,
  aDomicilio,
  insignias,
  porEncargo,
  nota,
  compacto = false,
}: {
  estrellas?: number | null;
  resenas?: number;
  aDomicilio?: boolean;
  insignias?: Insignia[];
  porEncargo?: boolean;
  nota?: string;
  compacto?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: compacto ? 6 : 8 }}>
      <T size={12} weight={estrellas != null ? 700 : 500} color={estrellas != null ? C.amberText : C.muted}>
        {textoEstrellas(estrellas, resenas)}
      </T>
      {aDomicilio ? (
        <Tag bg={C.greenTint} fg={C.greenDark}>
          A domicilio
        </Tag>
      ) : null}
      {porEncargo ? (
        <Tag bg={C.grey} fg={C.greyText}>
          Por encargo
        </Tag>
      ) : null}
      <Insignias lista={insignias} />
      {nota ? (
        <T size={12} color={C.muted}>
          {nota}
        </T>
      ) : null}
    </View>
  );
}
