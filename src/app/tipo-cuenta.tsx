import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BackBtn, Btn, Screen } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { T } from '../ui/T';
import { C } from '../ui/theme';
import type { Rol } from '../data/tipos';

function Opcion({
  activo,
  onPress,
  icono,
  tinte,
  fg,
  titulo,
  texto,
}: {
  activo: boolean;
  onPress: () => void;
  icono: 'bag' | 'store';
  tinte: string;
  fg: string;
  titulo: string;
  texto: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 16,
        alignItems: 'flex-start',
        padding: 20,
        borderRadius: 20,
        backgroundColor: C.white,
        borderWidth: 2,
        borderColor: activo ? C.green : C.line,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          backgroundColor: tinte,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icono} size={26} color={fg} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <T size={18} weight={700}>
          {titulo}
        </T>
        <T size={14} lh={1.45} color={C.muted}>
          {texto}
        </T>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: activo ? 6 : 2,
          borderColor: activo ? C.green : C.dash,
        }}
      />
    </Pressable>
  );
}

export default function TipoCuenta() {
  const [rol, setRol] = useState<Rol>('cliente');

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
        <BackBtn />
      </View>
      <View style={{ flex: 1, gap: 24, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ gap: 8 }}>
          <T size={28} weight={800} ls={-0.02}>
            ¿Cómo vas a usar Mercaboot?
          </T>
          <T size={15} lh={1.45} color={C.muted}>
            Elige por dónde empezar. Con la misma cuenta puedes comprar y vender: si hoy eres cliente y mañana abres tu negocio (o al revés), no necesitas otra cuenta.
          </T>
        </View>
        <Opcion
          activo={rol === 'cliente'}
          onPress={() => setRol('cliente')}
          icono="bag"
          tinte={C.greenTint}
          fg={C.green}
          titulo="Soy cliente"
          texto="Mira los negocios de tu comunidad, busca lo que necesitas y guarda tus negocios de siempre."
        />
        <Opcion
          activo={rol === 'comerciante'}
          onPress={() => setRol('comerciante')}
          icono="store"
          tinte={C.amberTint}
          fg={C.amberText}
          titulo="Soy comerciante"
          texto="Registra tu negocio, publica lo que vendes y marca si hay o ya se acabó."
        />
        <View style={{ flex: 1 }} />
        <Btn label="Continuar" onPress={() => router.push({ pathname: '/registro', params: { rol } })} />
      </View>
    </Screen>
  );
}
