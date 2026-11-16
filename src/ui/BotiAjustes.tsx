import React from 'react';
import { View } from 'react-native';
import { useBoti } from '../lib/boti';
import { Boti } from './Boti';
import { Card, Toggle } from './kit';
import { T } from './T';
import { C } from './theme';

function Fila({ titulo, texto, valor, onChange, activa = true }: { titulo: string; texto: string; valor: boolean; onChange: (v: boolean) => void; activa?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: activa ? 1 : 0.45 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={14} weight={700}>
          {titulo}
        </T>
        <T size={12} lh={1.4} color={C.muted}>
          {texto}
        </T>
      </View>
      <Toggle value={valor} onChange={activa ? onChange : () => {}} label={titulo} />
    </View>
  );
}

/** Para la pantalla de Perfil: la persona decide cómo quiere a Boti. */
export function BotiAjustes() {
  const { ajustes, cambiar, decir } = useBoti();
  return (
    <Card style={{ gap: 14, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Boti pose={ajustes.activo ? 'saludo' : 'dormido'} size={74} />
        <View style={{ flex: 1, gap: 3 }}>
          <T size={16} weight={800}>
            Boti, tu mascota
          </T>
          <T size={12.5} lh={1.4} color={C.muted}>
            {ajustes.activo ? 'Te da pistas, se mueve y juega contigo. Tócalo para ver qué hace.' : 'Está dormido. Actívalo cuando quieras que vuelva a acompañarte.'}
          </T>
        </View>
      </View>
      <Fila titulo="Boti activo" texto="Apagado, Boti no se mueve, no suena y no te acompaña." valor={ajustes.activo} onChange={(v) => cambiar({ activo: v })} />
      <Fila
        titulo="Que me acompañe"
        texto="Boti flota en la pantalla. Puedes arrastrarlo a otro lugar."
        valor={ajustes.compania}
        activa={ajustes.activo}
        onChange={(v) => {
          cambiar({ compania: v });
          if (v) setTimeout(() => decir('¡Aquí estoy otra vez! Tócame si quieres una pista.', { pose: 'saludo', emocion: 'alegre' }), 400);
        }}
      />
      <Fila titulo="Sonidos suaves" texto="Un sonidito muy bajito cuando lo tocas o te avisa algo." valor={ajustes.sonidos} activa={ajustes.activo} onChange={(v) => cambiar({ sonidos: v })} />
    </Card>
  );
}
