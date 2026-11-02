import React, { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import type { AltaNegocio } from '../store';
import { useStore } from '../store';
import { BackBtn, Btn, Card, Screen } from '../ui/kit';
import { ConfirmarReclamo, NegocioForm, useNegocioForm } from '../ui/NegocioForm';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/**
 * Para quien ya tiene cuenta de cliente y también quiere vender: abre (o reclama) su negocio con la misma cuenta.
 * Sus favoritos como cliente se conservan.
 */
export default function AbrirNegocio() {
  const params = useLocalSearchParams<{ reclamar?: string }>();
  const { cuenta, abrirNegocio, comprobarReclamo, cambiarModo } = useStore();
  const f = useNegocioForm(params.reclamar);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Negocio del directorio con código correcto, esperando que la persona confirme «¿Es tu negocio?»
  const [pendiente, setPendiente] = useState<AltaNegocio | null>(null);

  if (!cuenta) return <Redirect href="/" />;

  // Ya administra un negocio: no se abre otro, solo se cambia de modo
  if (cuenta.negocioId) {
    return (
      <Screen bottomInset contentStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
          <BackBtn />
        </View>
        <View style={{ gap: 16, paddingTop: 12, paddingHorizontal: 24 }}>
          <T size={26} weight={800} ls={-0.02}>
            Ya tienes un negocio
          </T>
          <T size={15} lh={1.45} color={C.muted}>
            Tu cuenta ya administra un negocio. Para atenderlo, cambia al modo comerciante.
          </T>
          <Btn
            label="Cambiar a modo comerciante"
            onPress={() => {
              const err = cambiarModo('comerciante');
              if (err) return setError(err);
              router.replace('/comerciante');
            }}
          />
          {error ? (
            <T size={14} weight={600} color={C.red} accessibilityRole="alert">
              {error}
            </T>
          ) : null}
        </View>
      </Screen>
    );
  }

  async function terminar(alta: AltaNegocio) {
    setCargando(true);
    const err = await abrirNegocio(alta);
    setCargando(false);
    if (err) return setError(err);
    router.replace('/comerciante');
  }

  async function abrir() {
    const v = f.validar();
    if ('error' in v) return setError(v.error);
    if ('reclamarId' in v.alta) {
      // Primero se revisa el código; solo si es correcto se pregunta «¿Es tu negocio?»
      setCargando(true);
      const err = await comprobarReclamo(v.alta.reclamarId, v.alta.codigo);
      setCargando(false);
      if (err) return setError(err);
      return setPendiente(v.alta);
    }
    await terminar(v.alta);
  }

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 16 }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
        <BackBtn />
      </View>
      <View style={{ flex: 1, gap: 16, paddingTop: 8, paddingHorizontal: 24, paddingBottom: 16 }}>
        <T size={28} weight={800} ls={-0.02}>
          Abre tu negocio
        </T>
        <Card style={{ padding: 14, gap: 4, backgroundColor: C.greenTint, borderColor: C.greenTint }}>
          <T size={14} weight={700} color={C.greenDark}>
            Con la misma cuenta compras y vendes
          </T>
          <T size={13} lh={1.45} color={C.greenDark}>
            No necesitas otra cuenta ni otro correo. Tus favoritos como cliente se quedan como están, y desde tu perfil cambias entre cliente y comerciante cuando quieras.
          </T>
        </Card>

        <NegocioForm f={f} onCambio={() => setError('')} />

        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}

        <View style={{ flex: 1, minHeight: 8 }} />
        <Btn label={cargando ? 'Revisando…' : 'Abrir mi negocio'} onPress={cargando ? undefined : abrir} />
      </View>

      <ConfirmarReclamo
        visible={!!pendiente}
        nombre={f.negocioElegido?.nombre ?? 'este negocio'}
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => {
          const alta = pendiente;
          setPendiente(null);
          if (alta) void terminar(alta);
        }}
      />
    </Screen>
  );
}
