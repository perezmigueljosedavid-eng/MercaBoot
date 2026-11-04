import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CATEGORIAS_PRODUCTO, categoriaInicial, nombreCategoria, UNIDAD_OTRA, unidadesPara, unidadInicial } from '../data/contenido';
import type { CategoriaProducto } from '../data/tipos';
import { useStore } from '../store';
import { Confirmar } from '../ui/Dialogo';
import { BackBtn, Btn, Card, Field, goBack, Screen, SelectField, Toggle } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

const NOMBRES_CATEGORIA = CATEGORIAS_PRODUCTO.map((c) => c.nombre);
const idDeCategoria = (nombre: string): CategoriaProducto => CATEGORIAS_PRODUCTO.find((c) => c.nombre === nombre)?.id ?? 'otro';

/**
 * Agregar o editar un producto. Sirve igual para una carnicería (kilos), una fonda (porciones),
 * una pastelería (rebanadas, pasteles) o un puesto de fresas con crema (vasos).
 * El comerciante escribe el nombre que quiera, el precio y cómo se vende.
 */
export default function ProductoForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { s, negocio, agregarProducto, editarProducto, eliminarProducto } = useStore();
  const giro = negocio?.giro;
  const previo = id ? s.productos.find((p) => p.id === id && p.negocioId === negocio?.id) : undefined;
  const opcionesUnidad = unidadesPara(giro);

  const [nombre, setNombre] = useState(previo?.nombre ?? '');
  const [precio, setPrecio] = useState(previo?.precio != null ? String(previo.precio) : '');
  const [unidad, setUnidad] = useState(() => {
    if (!previo) return unidadInicial(giro);
    return opcionesUnidad.includes(previo.unidad) ? previo.unidad : UNIDAD_OTRA;
  });
  const [unidadOtra, setUnidadOtra] = useState(previo && !opcionesUnidad.includes(previo.unidad) ? previo.unidad : '');
  const [disponible, setDisponible] = useState(previo?.disponible ?? true);
  const [porEncargo, setPorEncargo] = useState(previo?.porEncargo ?? false);
  const [existencias, setExistencias] = useState(previo?.cantidad != null ? String(previo.cantidad) : '');
  const [categoria, setCategoria] = useState<CategoriaProducto>(previo?.categoria ?? categoriaInicial(giro));
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (id && !previo) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 12 }}>
        <BackBtn />
        <T size={16} weight={700}>
          No encontramos este producto.
        </T>
      </Screen>
    );
  }

  function leerPrecio(): number | undefined | null {
    const t = precio.trim().replace(',', '.').replace(/^\$/, '');
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  /** Existencias: vacío = no se lleva la cuenta; si no es un número válido, `null`. */
  function leerExistencias(): number | undefined | null {
    const t = existencias.trim().replace(',', '.');
    if (!t) return undefined;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 && n <= 99999 ? Math.round(n * 100) / 100 : null;
  }

  async function guardar(otro: boolean) {
    const monto = leerPrecio();
    const cantidad = leerExistencias();
    if (!nombre.trim()) return setError('Escribe el nombre del producto.');
    if (monto === null) return setError('El precio debe ser un número, por ejemplo 45 o 12.50.');
    if (cantidad === null) return setError('Las existencias deben ser un número de 0 en adelante, por ejemplo 12 o 3.5. Déjalo vacío si no llevas la cuenta.');
    const unidadFinal = unidad === UNIDAD_OTRA ? unidadOtra.trim() : unidad;
    if (!unidadFinal) return setError('Escribe cómo se vende, por ejemplo «charola» o «vaso de 1 litro».');
    const datos = { nombre, precio: monto, unidad: unidadFinal, disponible, porEncargo, categoria, cantidad };
    setGuardando(true);
    const err = previo ? await editarProducto(previo.id, datos) : await agregarProducto(datos);
    setGuardando(false);
    if (err) return setError(err);
    if (otro && !previo) {
      setAviso(`Guardamos «${nombre.trim()}». Escribe el siguiente producto.`);
      setNombre('');
      setPrecio('');
      setExistencias('');
      setCategoria(categoriaInicial(giro));
      setDisponible(true);
      setPorEncargo(false);
      return;
    }
    goBack('/comerciante/productos');
  }

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 16 }}>
        <BackBtn />
        <T size={18} weight={700}>
          {previo ? 'Editar producto' : 'Agregar producto'}
        </T>
      </View>

      <View style={{ gap: 16, paddingTop: 8, paddingHorizontal: 24 }}>
        {aviso ? (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: C.greenTint }}>
            <T size={13} weight={600} color={C.greenDark}>
              {aviso}
            </T>
          </View>
        ) : null}

        <Field
          label="¿Qué vendes?"
          placeholder="Ej. Pollo entero, Fresas con crema, Pastel de tres leches"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            setError('');
            setAviso('');
          }}
          autoCapitalize="sentences"
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Field label="Precio (opcional)" placeholder="Ej. 45" keyboardType="decimal-pad" value={precio} onChangeText={(t) => { setPrecio(t); setError(''); }} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <SelectField
              label="Se vende por"
              value={unidad}
              options={opcionesUnidad}
              onChange={(u) => {
                setUnidad(u);
                setError('');
              }}
            />
          </View>
        </View>

        {unidad === UNIDAD_OTRA ? (
          <Field label="¿Cómo se vende?" placeholder="Ej. charola, cazuela, vaso de 1 litro" value={unidadOtra} onChangeText={(t) => { setUnidadOtra(t); setError(''); }} />
        ) : null}

        <View style={{ gap: 6 }}>
          <Field
            label="Existencias (opcional)"
            placeholder="Ej. 12"
            keyboardType="decimal-pad"
            value={existencias}
            onChangeText={(t) => {
              setExistencias(t);
              setError('');
            }}
          />
          <T size={12} lh={1.4} color={C.muted}>
            Si pones cuántos tienes, Mercaboot lleva la cuenta: baja sola cuando entregas un pedido y, al llegar a 0, el producto se marca agotado. Así nadie aparta lo que ya no hay. Déjalo vacío si no cuentas tus piezas.
          </T>
          {previo && previo.apartado > 0 ? (
            <T size={12} weight={600} color={C.amberText}>
              Ahora hay {previo.apartado} {previo.unidad} apartado en pedidos activos.
            </T>
          ) : null}
        </View>

        <SelectField label="Categoría" value={nombreCategoria(categoria)} options={NOMBRES_CATEGORIA} onChange={(n) => setCategoria(idDeCategoria(n))} />

        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={15} weight={700}>
              {porEncargo ? 'Solo por encargo' : 'Lo tengo listo'}
            </T>
            <T size={12} lh={1.4} color={C.muted}>
              {porEncargo ? 'Los clientes ven que se prepara cuando lo piden.' : 'Actívalo si lo preparas cuando alguien lo pide (pasteles, platillos grandes…).'}
            </T>
          </View>
          <Toggle value={porEncargo} onChange={setPorEncargo} label="Solo por encargo" />
        </Card>

        <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={15} weight={700}>
              {disponible ? (porEncargo ? 'Acepto pedidos' : 'Hay ahora') : porEncargo ? 'No acepto pedidos por ahora' : 'Agotado'}
            </T>
            <T size={12} color={C.muted}>
              Puedes cambiarlo cuando quieras desde «Productos».
            </T>
          </View>
          <Toggle value={disponible} onChange={setDisponible} label="Producto disponible" />
        </Card>

        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}

        <View style={{ gap: 10 }}>
          <Btn label={guardando ? 'Guardando…' : previo ? 'Guardar cambios' : 'Guardar'} onPress={guardando ? undefined : () => guardar(false)} />
          {!previo ? <Btn label="Guardar y agregar otro" variant="outline" onPress={guardando ? undefined : () => guardar(true)} /> : null}
          {previo ? <Btn label="Eliminar producto" variant="danger" onPress={() => setConfirmar(true)} /> : null}
        </View>
      </View>

      <Confirmar
        visible={confirmar}
        titulo={`¿Eliminar «${previo?.nombre ?? ''}»?`}
        texto="Dejará de verse para tus clientes. Si solo se acabó por hoy, mejor márcalo como agotado."
        confirmar="Eliminar"
        peligro
        onCancelar={() => setConfirmar(false)}
        onConfirmar={async () => {
          setConfirmar(false);
          if (previo) {
            const err = await eliminarProducto(previo.id);
            if (err) return setError(err);
          }
          goBack('/comerciante/productos');
        }}
      />
    </Screen>
  );
}
