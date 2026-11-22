import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { nombreCategoria, textoEtiquetas } from '../../data/contenido';
import type { CategoriaProducto } from '../../data/tipos';
import { perfilDeProducto } from '../../ia/ingredientes';
import { DESDE_CUANTOS, filtrarProductos, POR_PAGINA } from '../../lib/listaProductos';
import { cantidadTexto } from '../../lib/pedidos';
import { useStore } from '../../store';
import { haceCuanto, textoPrecio } from '../../ui/bits';
import { BuscadorProductos, VerMas } from '../../ui/BuscadorProductos';
import { FotoProducto } from '../../ui/FotoProducto';
import { Icon, IconName } from '../../ui/Icon';
import { Card, Chip, Group, Screen } from '../../ui/kit';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

type Filtro = 'todos' | 'hay' | 'agotado';

/** Un atajo a una herramienta para tiendas con muchos productos. */
function Herramienta({ icono, titulo, texto, ruta }: { icono: IconName; titulo: string; texto: string; ruta: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${texto}`}
      onPress={() => router.push(ruta as never)}
      style={({ pressed }) => ({ flexBasis: '48%', flexGrow: 1, opacity: pressed ? 0.75 : 1 })}
    >
      <Card r={16} style={{ gap: 6, padding: 14 }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icono} size={19} color={C.green} />
        </View>
        <T size={14} weight={700}>
          {titulo}
        </T>
        <T size={12} lh={1.35} color={C.muted}>
          {texto}
        </T>
      </Card>
    </Pressable>
  );
}

export default function MisProductos() {
  const { s, negocio, setDisponible } = useStore();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [limite, setLimite] = useState(POR_PAGINA);

  const propios = useMemo(() => s.productos.filter((p) => negocio && p.negocioId === negocio.id), [s.productos, negocio]);
  const lista = useMemo(
    () => filtrarProductos(propios, q, categoria).filter((p) => (filtro === 'todos' ? true : filtro === 'hay' ? p.disponible : !p.disponible)),
    [propios, q, categoria, filtro],
  );
  if (!negocio) return null;

  const hay = propios.filter((p) => p.disponible).length;
  const agotados = propios.length - hay;
  const visibles = lista.slice(0, limite);
  const restantes = lista.length - visibles.length;
  const cambiarFiltro = (f: Filtro) => {
    setFiltro(f);
    setLimite(POR_PAGINA);
  };

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={24} weight={800} ls={-0.02}>
            Mis productos
          </T>
          <T size={13} color={C.muted}>
            {propios.length
              ? `${hay} ${hay === 1 ? 'disponible' : 'disponibles'} · ${agotados} ${agotados === 1 ? 'agotado' : 'agotados'}`
              : 'Escribe tú mismo lo que vendes'}
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/producto-form')}
          style={{ height: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Icon name="plus" size={18} color={C.white} />
          <T size={14} weight={700} color={C.white}>
            Agregar
          </T>
        </Pressable>
      </View>

      {/* Para tiendas con muchos productos: nada se hace uno por uno */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {propios.length > 0 ? <Herramienta icono="tag" titulo="Precios de hoy" texto="Cambia muchos precios o marca lo que se acabó, todo en una pantalla." ruta="/precios-de-hoy" /> : null}
        <Herramienta icono="box" titulo="Catálogo Mercaboot" texto="Elige de una lista lo que vendes y se agrega de golpe, sin escribir uno por uno." ruta="/catalogo" />
        <Herramienta icono="upload" titulo="Importar de Excel" texto="Sube tu lista de Excel o Google Sheets, o baja la tuya para cambiar precios." ruta="/importar-productos" />
        <Herramienta icono="scan" titulo="Escanear código" texto="Apunta la cámara al código de barras de un producto y se escribe el nombre solo." ruta="/escanear" />
        <Herramienta icono="clock" titulo="Horario" texto="Pon tus horas una vez y la app abre y cierra tu negocio sola." ruta="/horario" />
      </View>

      {propios.length > DESDE_CUANTOS ? (
        <BuscadorProductos
          productos={propios}
          busqueda={q}
          onBusqueda={(t) => {
            setQ(t);
            setLimite(POR_PAGINA);
          }}
          categoria={categoria}
          onCategoria={(c) => {
            setCategoria(c);
            setLimite(POR_PAGINA);
          }}
          placeholder="Buscar en mis productos"
        />
      ) : null}

      {propios.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Todos" h={38} px={14} size={13} active={filtro === 'todos'} onPress={() => cambiarFiltro('todos')} />
          <Chip label="Disponibles" h={38} px={14} size={13} active={filtro === 'hay'} onPress={() => cambiarFiltro('hay')} />
          <Chip label="Agotados" h={38} px={14} size={13} active={filtro === 'agotado'} onPress={() => cambiarFiltro('agotado')} />
        </View>
      ) : null}

      {propios.length === 0 ? (
        <Card style={{ gap: 8, padding: 20 }}>
          <T size={16} weight={700}>
            Aún no has publicado productos
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            Puedes escribir cada cosa que vendes (por ejemplo «Quesillo», «Fresas con crema» o «Comida corrida»), usar el «Catálogo Mercaboot» de arriba para agregar de golpe lo más común de tu tipo de negocio, o «Importar de Excel» si ya tienes tu lista en una hoja de cálculo. Después solo ajustas los precios y marcas si hay o ya se acabó. Los clientes y el asistente lo verán al momento.
          </T>
        </Card>
      ) : lista.length === 0 ? (
        <T size={14} color={C.muted}>
          No hay productos con ese filtro.
        </T>
      ) : (
        <Group>
          {visibles.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingLeft: 14, paddingRight: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${p.nombre}`}
                onPress={() => router.push({ pathname: '/producto-form', params: { id: p.id } })}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 }}
              >
                <FotoProducto producto={p} size={44} r={11} />
                <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <T size={15} weight={600} color={p.disponible ? C.ink : C.muted}>
                    {p.nombre}
                  </T>
                  <T size={13} color={C.muted}>
                    {textoPrecio(p.precio, p.unidad)}
                    {p.porEncargo ? ' · por encargo' : ''}
                  </T>
                  {p.cantidad != null ? (
                    <T size={12} weight={600} color={p.cantidad <= 0 ? C.red : p.apartado > 0 ? C.amberText : C.greyText}>
                      Existencias: {cantidadTexto(p.cantidad)}
                      {p.apartado > 0 ? ` · ${cantidadTexto(p.apartado)} apartado${p.apartado === 1 ? '' : 's'}` : ''}
                    </T>
                  ) : null}
                  <T size={12} color={C.muted} numberOfLines={1}>
                    {[nombreCategoria(p.categoria), textoEtiquetas(perfilDeProducto(p, negocio.giro).etiquetas, 3)].filter(Boolean).join(' · ')} · {haceCuanto(p.actualizado)}
                  </T>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.nombre}: ${p.disponible ? 'Disponible' : 'Agotado'}. Tocar para cambiar`}
                onPress={() => (p.cantidad != null && p.cantidad <= 0 && !p.disponible ? router.push({ pathname: '/producto-form', params: { id: p.id } }) : setDisponible(p.id, !p.disponible))}
                style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: p.disponible ? C.greenTint : C.redTint, alignItems: 'center', justifyContent: 'center' }}
              >
                <T size={12} weight={700} color={p.disponible ? C.greenDark : C.red}>
                  {p.disponible ? (p.porEncargo ? 'Acepto pedidos' : 'Disponible') : p.porEncargo ? 'Sin pedidos' : 'Agotado'}
                </T>
              </Pressable>
            </View>
          ))}
        </Group>
      )}
      {restantes > 0 ? <VerMas restantes={restantes} onPress={() => setLimite((l) => l + POR_PAGINA)} /> : null}
    </Screen>
  );
}
