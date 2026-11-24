import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  LO_QUE_SE_QUEDA,
  PALABRA_DE_CONFIRMACION,
  confirmacionValida,
  loQueSeBorra,
  otraOpcion,
  pedidosEnCurso,
  textoPedidosEnCurso,
} from '../lib/eliminarCuenta';
import { useStore } from '../store';
import { BackBtn, Btn, Card, Field, Screen, goBack } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

function Punto({ children, color = C.red }: { children: React.ReactNode; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <T size={14} color={color} weight={800}>
        •
      </T>
      <T size={14} lh={1.5} color={C.greyText} style={{ flex: 1 }}>
        {children}
      </T>
    </View>
  );
}

/**
 * «Eliminar mi cuenta»: borra para siempre la cuenta y todo lo suyo. Dice con claridad qué se borra y qué se queda, no deja seguir
 * mientras haya pedidos en curso y pide escribir ELIMINAR para que no se haga por un toque equivocado.
 * El borrado de verdad lo hace la base de datos (borrar_mi_cuenta), en una sola operación: o se borra todo o no se borra nada.
 * Autor: José David Pérez Miguel
 */
export default function EliminarCuenta() {
  const { cuenta, negocio, s, eliminarCuenta, avisar } = useStore();
  const [texto, setTexto] = useState('');
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState('');
  if (!cuenta) return null;

  const tieneNegocio = !!negocio;
  const enCurso = pedidosEnCurso(s.pedidos, cuenta.id, negocio?.id);
  const puede = confirmacionValida(texto) && !borrando;

  async function borrar() {
    if (!puede) return;
    setBorrando(true);
    setError('');
    const err = await eliminarCuenta(texto);
    if (err) {
      setBorrando(false);
      setError(err);
      return;
    }
    avisar('Tu cuenta se eliminó. Gracias por haber usado Mercaboot.');
    router.replace('/');
  }

  return (
    <Screen bottomInset contentStyle={{ gap: 16, paddingHorizontal: 20, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, marginLeft: -8 }}>
        <BackBtn />
        <T size={18} weight={700}>
          Eliminar mi cuenta
        </T>
      </View>

      <Card style={{ gap: 6, padding: 16, backgroundColor: C.redTint, borderColor: C.redLine }}>
        <T size={16} weight={800} color={C.red}>
          Esto no se puede deshacer
        </T>
        <T size={14} lh={1.5} color={C.red}>
          Vas a borrar para siempre la cuenta de {cuenta.correo}. Nadie, ni el equipo de Mercaboot, podrá recuperarla.
        </T>
      </Card>

      {enCurso > 0 ? (
        <Card style={{ gap: 6, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
          <T size={14} weight={700} lh={1.45} color={C.amberDeep} accessibilityRole="alert">
            {textoPedidosEnCurso(enCurso, tieneNegocio)}
          </T>
        </Card>
      ) : null}

      <Card style={{ gap: 10, padding: 16 }}>
        <T size={16} weight={800}>
          Se borra para siempre
        </T>
        {loQueSeBorra({ tiene: tieneNegocio, delDirectorio: !!negocio?.delDirectorio }).map((t) => (
          <Punto key={t}>{t}</Punto>
        ))}
      </Card>

      <Card style={{ gap: 10, padding: 16 }}>
        <T size={16} weight={800}>
          Lo que puede quedarse (sin tu nombre)
        </T>
        {LO_QUE_SE_QUEDA.map((t) => (
          <Punto key={t} color={C.green}>
            {t}
          </Punto>
        ))}
      </Card>

      <Card style={{ gap: 6, padding: 16, backgroundColor: C.greenTint, borderColor: C.greenTint }}>
        <T size={14} lh={1.5} color={C.greenDark}>
          {otraOpcion(tieneNegocio)}
        </T>
      </Card>

      <Card style={{ gap: 12, padding: 16 }}>
        <Field
          label={`Para confirmar, escribe ${PALABRA_DE_CONFIRMACION}`}
          value={texto}
          onChangeText={(t) => {
            setTexto(t);
            if (error) setError('');
          }}
          placeholder={PALABRA_DE_CONFIRMACION}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          editable={!borrando}
        />
        {error ? (
          <T size={13} weight={600} lh={1.4} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
        <Btn
          label={borrando ? 'Eliminando…' : 'Eliminar mi cuenta para siempre'}
          disabled={!puede}
          onPress={() => void borrar()}
          style={{ backgroundColor: C.red }}
        />
        <Btn label="Mejor no, volver" variant="outline" onPress={() => goBack()} disabled={borrando} />
      </Card>
    </Screen>
  );
}
