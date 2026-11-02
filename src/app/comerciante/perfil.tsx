import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { SEMILLA_NEGOCIOS } from '../../data/semilla';
import { useStore } from '../../store';
import { Confirmar } from '../../ui/Dialogo';
import { Icon, IconName } from '../../ui/Icon';
import { Btn, Card, Group, Screen } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

function Fila({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
    >
      <T size={15} weight={600}>
        {texto}
      </T>
      <T size={18} color={C.muted}>
        ›
      </T>
    </Pressable>
  );
}

function Dato({ icono, texto, vacio }: { icono: IconName; texto?: string; vacio: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <View style={{ marginTop: 1 }}>
        <Icon name={icono} size={16} color={texto ? C.greyText : C.dash} />
      </View>
      <T size={14} lh={1.35} color={texto ? C.ink : C.muted} style={{ flex: 1 }}>
        {texto || vacio}
      </T>
    </View>
  );
}

export default function PerfilComerciante() {
  const { cuenta, negocio, salir, cambiarModo, soltarNegocio } = useStore();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  if (!cuenta || !negocio) return null;
  // Un negocio del directorio vuelve a la lista sin dueño; uno que la persona creó desaparece
  const delDirectorio = SEMILLA_NEGOCIOS.some((x) => x.id === negocio.id);

  return (
    <Screen contentStyle={{ gap: 20, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      <T size={24} weight={800} ls={-0.02}>
        Perfil
      </T>

      <Card style={{ gap: 14, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Logo uri={negocio.logoUri} nombre={negocio.nombre} size={64} r={18} />
          <View style={{ flex: 1, gap: 2 }}>
            <T size={18} weight={800}>
              {negocio.nombre}
            </T>
            <T size={13} color={C.muted}>
              {negocio.giro}
            </T>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Dato icono="pin" texto={negocio.direccion} vacio="Sin dirección. Agrégala para que te encuentren." />
          <Dato icono="clock" texto={negocio.horario} vacio="Sin horario" />
          <Dato icono="phone" texto={negocio.telefono} vacio="Sin teléfono" />
          <Dato icono="mail" texto={negocio.correo} vacio="Sin correo del negocio" />
          <Dato
            icono="navigation"
            texto={negocio.aDomicilio ? `A domicilio${negocio.zonaEntrega ? `: ${negocio.zonaEntrega}` : ''}` : undefined}
            vacio="Sin entrega a domicilio"
          />
        </View>
        <Btn label="Editar mi negocio" h={46} r={12} size={14} onPress={() => router.push('/editar-negocio')} />
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <Logo uri={cuenta.fotoUri} nombre={cuenta.nombre} size={48} redondo />
        <View style={{ flex: 1, gap: 2 }}>
          <T size={15} weight={700}>
            {cuenta.nombre}
          </T>
          <T size={13} color={C.muted} numberOfLines={1}>
            {cuenta.correo}
          </T>
        </View>
        <Pressable accessibilityRole="link" onPress={() => router.push('/editar-perfil')} hitSlop={10}>
          <T size={14} weight={700} color={C.green}>
            Editar
          </T>
        </Pressable>
      </Card>

      {/* la misma cuenta compra y vende */}
      <Card style={{ gap: 10, padding: 16 }}>
        <T size={15} weight={700}>
          Esta cuenta también puede comprar
        </T>
        <T size={13} lh={1.45} color={C.muted}>
          Mira la app como cliente: busca productos y negocios de la comunidad. Tu negocio sigue publicado y puedes volver a tu modo comerciante cuando quieras.
        </T>
        <Btn
          label="Ver la app como cliente"
          variant="outline"
          h={46}
          r={12}
          size={14}
          onPress={() => {
            const err = cambiarModo('cliente');
            if (err) return setError(err);
            router.replace('/cliente');
          }}
        />
        {error ? (
          <T size={13} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
      </Card>

      <Group r={18}>
        <Fila texto="Así ven mi negocio los clientes" onPress={() => router.push(`/negocio/${negocio.id}`)} />
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

      <Pressable accessibilityRole="button" onPress={() => setConfirmando(true)} style={{ alignSelf: 'center', paddingVertical: 8 }} hitSlop={8}>
        <T size={13} weight={600} color={C.muted} style={{ textDecorationLine: 'underline' }}>
          {delDirectorio ? 'Dejar de administrar este negocio' : 'Dejar de ser comerciante'}
        </T>
      </Pressable>

      <Confirmar
        visible={confirmando}
        titulo={delDirectorio ? `¿Dejar de administrar «${negocio.nombre}»?` : '¿Dejar de ser comerciante?'}
        texto={
          delDirectorio
            ? 'Tu cuenta sigue como cliente y el negocio vuelve a la lista de la comunidad sin dueño: se quitan sus productos. Si lo reclamaste por error, es lo correcto: su verdadero dueño lo reclama con su código. Si solo quieres comprar un rato, usa «Ver la app como cliente».'
            : 'Tu cuenta sigue como cliente. Se quitarán de Mercaboot tu negocio y sus productos. Si solo quieres comprar un rato, usa «Ver la app como cliente».'
        }
        confirmar={delDirectorio ? 'Sí, soltarlo' : 'Sí, dejar mi negocio'}
        peligro
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => {
          setConfirmando(false);
          const err = soltarNegocio();
          if (err) return setError(err);
          router.replace('/cliente');
        }}
      />
    </Screen>
  );
}
