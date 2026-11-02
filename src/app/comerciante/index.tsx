import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../store';
import { haceCuanto, textoPrecio } from '../../ui/bits';
import { Card, Group, Screen, SectionTitle, Toggle } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

function Cifra({ valor, etiqueta, color = C.ink }: { valor: string; etiqueta: string; color?: string }) {
  return (
    <Card r={16} style={{ flexBasis: '48%', flexGrow: 1, gap: 4, padding: 16 }}>
      <T size={26} weight={800} color={color}>
        {valor}
      </T>
      <T size={13} color={C.muted}>
        {etiqueta}
      </T>
    </Card>
  );
}

export default function HomeComerciante() {
  const { s, negocio, actualizarNegocio, setDisponible, cuenta } = useStore();
  if (!negocio || !cuenta) return null;

  const propios = s.productos.filter((p) => p.negocioId === negocio.id);
  const disponibles = propios.filter((p) => p.disponible).length;
  const agotados = propios.length - disponibles;
  const vacio = propios.length === 0;
  const faltaPerfil = !negocio.direccion;

  return (
    <Screen contentStyle={{ gap: 22, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      {/* cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Logo uri={negocio.logoUri} nombre={negocio.nombre} size={52} r={16} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <T size={14} color={C.muted}>
            Tu negocio
          </T>
          <T size={22} weight={800} ls={-0.02} numberOfLines={1}>
            {negocio.nombre}
          </T>
        </View>
      </View>

      {/* estado */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16, paddingHorizontal: 18 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={16} weight={700}>
            Estado del negocio
          </T>
          <T size={13} color={C.muted}>
            {negocio.abierto ? 'Tus clientes ven que estás abierto' : 'Tus clientes ven que estás cerrado'}
          </T>
        </View>
        <Toggle big value={negocio.abierto} onChange={(v) => actualizarNegocio({ abierto: v })} label="Negocio abierto" />
      </Card>

      {faltaPerfil ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/editar-negocio')}>
          <Card style={{ gap: 4, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={15} weight={700} color={C.amberDeep}>
              Completa dónde está tu negocio
            </T>
            <T size={13} lh={1.4} color={C.amberDeep}>
              Agrega tu dirección o una referencia para que los clientes te encuentren. Toca aquí.
            </T>
          </Card>
        </Pressable>
      ) : null}

      {/* cifras */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Cifra valor={String(disponibles)} etiqueta="Productos disponibles" />
        <Cifra valor={String(agotados)} etiqueta="Agotados" color={agotados ? C.red : C.ink} />
      </View>

      {/* productos */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Mis productos" link={propios.length ? 'Ver todos' : undefined} onLink={() => router.navigate('/comerciante/productos')} />
        {vacio ? (
          <T size={14} lh={1.45} color={C.muted}>
            Todavía no has publicado nada. Agrega lo que vendes, con el nombre que tú quieras, y marca si hay o ya se acabó.
          </T>
        ) : (
          <Group>
            {[...propios]
              .sort((a, b) => b.actualizado - a.actualizado)
              .slice(0, 4)
              .map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T size={15} weight={600}>
                      {p.nombre}
                    </T>
                    <T size={13} color={C.muted}>
                      {textoPrecio(p.precio, p.unidad)} · {haceCuanto(p.actualizado)}
                    </T>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${p.nombre}: ${p.disponible ? 'Disponible' : 'Agotado'}. Tocar para cambiar`}
                    onPress={() => setDisponible(p.id, !p.disponible)}
                    style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: p.disponible ? C.greenTint : C.redTint, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <T size={12} weight={700} color={p.disponible ? C.greenDark : C.red}>
                      {p.disponible ? 'Disponible' : 'Agotado'}
                    </T>
                  </Pressable>
                </View>
              ))}
          </Group>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/producto-form')}
          style={{ height: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.dash, alignItems: 'center', justifyContent: 'center' }}
        >
          <T size={15} weight={600}>
            + Agregar producto
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}
