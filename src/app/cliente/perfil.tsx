import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useUbicacion } from '../../lib/ubicacion';
import { useStore } from '../../store';
import { Btn, Card, Group, Screen } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

function Fila({ texto, detalle, onPress }: { texto: string; detalle?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
    >
      <T size={15} weight={600}>
        {texto}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        {detalle ? (
          <T size={13} color={C.muted} numberOfLines={1}>
            {detalle}
          </T>
        ) : null}
        <T size={18} color={C.muted}>
          ›
        </T>
      </View>
    </Pressable>
  );
}

export default function PerfilCliente() {
  const { cuenta, favoritos, s, salir, negocio, cambiarModo, avisar } = useStore();
  const { estado, pedir } = useUbicacion();
  const [error, setError] = useState('');
  const resenas = s.resenas.filter((r) => r.autorId === cuenta?.id).length;
  // Siempre responde: dice si se pudo actualizar la ubicación o qué hacer si no.
  const actualizarUbicacion = async () => {
    const ok = await pedir();
    avisar(ok ? 'Listo: tu ubicación está actualizada.' : 'No pudimos encontrar tu ubicación. Revisa que el permiso de ubicación esté activado.');
  };
  const textoUbicacion =
    estado === 'lista' ? 'Activada' : estado === 'buscando' ? 'Buscando…' : estado === 'denegada' ? 'Sin permiso' : 'Activar';

  return (
    <Screen contentStyle={{ gap: 20, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 }}>
      <T size={24} weight={800} ls={-0.02}>
        Perfil
      </T>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <Logo uri={cuenta?.fotoUri} nombre={cuenta?.nombre ?? '?'} size={60} redondo />
        <View style={{ flex: 1, gap: 2 }}>
          <T size={17} weight={700}>
            {cuenta?.nombre}
          </T>
          <T size={13} color={C.muted} numberOfLines={1}>
            {cuenta?.correo}
          </T>
        </View>
        <Pressable accessibilityRole="link" onPress={() => router.push('/editar-perfil')} hitSlop={10}>
          <T size={14} weight={700} color={C.green}>
            Editar
          </T>
        </Pressable>
      </Card>
      {/* la misma cuenta compra y vende */}
      {negocio ? (
        <Card style={{ gap: 10, padding: 16 }}>
          <T size={15} weight={700}>
            Tu negocio: {negocio.nombre}
          </T>
          <T size={13} lh={1.45} color={C.muted}>
            Con esta misma cuenta también atiendes tu negocio. Ahora la estás usando como cliente.
          </T>
          <Btn
            label="Cambiar a modo comerciante"
            h={46}
            r={12}
            size={14}
            onPress={() => {
              const err = cambiarModo('comerciante');
              if (err) return setError(err);
              router.replace('/comerciante');
            }}
          />
          {error ? (
            <T size={13} weight={600} color={C.red} accessibilityRole="alert">
              {error}
            </T>
          ) : null}
        </Card>
      ) : (
        <Card style={{ gap: 10, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
          <T size={15} weight={700} color={C.amberDeep}>
            ¿También vendes algo?
          </T>
          <T size={13} lh={1.45} color={C.amberDeep}>
            Abre tu negocio con esta misma cuenta: sigues comprando como cliente y, además, publicas tus productos y avisos. No necesitas otra cuenta.
          </T>
          <Btn label="Abrir mi negocio" variant="amber" h={46} r={12} size={14} onPress={() => router.push('/abrir-negocio')} />
        </Card>
      )}

      <Group r={18}>
        <Fila texto="Mis favoritos" detalle={String(favoritos.length)} onPress={() => router.navigate('/cliente/favoritos')} />
        <Fila texto="Mis reseñas" detalle={String(resenas)} onPress={() => router.push('/mis-resenas')} />
        <Fila texto="Mi ubicación" detalle={textoUbicacion} onPress={actualizarUbicacion} />
        <Fila texto="Ayuda" onPress={() => router.push('/ayuda')} />
      </Group>
      <Btn
        label="Cerrar sesión"
        variant="danger"
        h={52}
        size={15}
        onPress={() => {
          salir();
          router.replace('/');
        }}
      />
    </Screen>
  );
}
