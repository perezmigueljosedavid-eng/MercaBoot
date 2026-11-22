import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  CATEGORIAS_PRODUCTO,
  categoriaInicial,
  GRUPOS_ETIQUETAS,
  nombreCategoria,
  textoEtiquetas,
  UNIDAD_OTRA,
  unidadesPara,
  unidadInicial,
} from '../data/contenido';
import type { CategoriaProducto, Etiqueta, TipoProducto } from '../data/tipos';
import { clasificar, nombreIngrediente, perfilDeProducto } from '../ia/ingredientes';
import { useBoti } from '../lib/boti';
import { codigoParaBuscar } from '../lib/codigoBarras';
import { recordarCodigo } from '../lib/catalogoDeCodigos';
import { useFotoProducto } from '../lib/fotos';
import { useStore } from '../store';
import { textoPrecio } from '../ui/bits';
import { Confirmar } from '../ui/Dialogo';
import { FotoCampo } from '../ui/FotoCampo';
import { Icon } from '../ui/Icon';
import { BackBtn, Btn, Card, Chip, Field, goBack, Screen, SelectField, Toggle } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

const NOMBRES_CATEGORIA = CATEGORIAS_PRODUCTO.map((c) => c.nombre);
const idDeCategoria = (nombre: string): CategoriaProducto => CATEGORIAS_PRODUCTO.find((c) => c.nombre === nombre)?.id ?? 'otro';

/** Dos opciones grandes para elegir una. */
function Opcion({ titulo, texto, activa, onPress }: { titulo: string; texto: string; activa: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      accessibilityLabel={titulo}
      onPress={onPress}
      style={{
        flex: 1,
        minWidth: 0,
        gap: 4,
        padding: 14,
        borderRadius: 14,
        borderWidth: activa ? 2 : 1,
        borderColor: activa ? C.green : C.input,
        backgroundColor: activa ? C.greenTint : C.white,
      }}
    >
      <T size={14} weight={700} color={activa ? C.greenDark : C.ink}>
        {titulo}
      </T>
      <T size={12} lh={1.35} color={C.muted}>
        {texto}
      </T>
    </Pressable>
  );
}

/**
 * Agregar o editar un producto. Sirve igual para una carnicería (kilos), una fonda (porciones),
 * una pastelería (rebanadas, pasteles) o un puesto de fresas con crema (vasos).
 * El comerciante escribe lo que quiere; la app deduce el tipo, la categoría y las características, y él puede corregirlas.
 */
export default function ProductoForm() {
  const { id, nombre: nombreSugerido, codigo: codigoDeBarras, unidad: unidadDeLaApp } = useLocalSearchParams<{ id?: string; nombre?: string; codigo?: string; unidad?: string }>();
  const { s, negocio, agregarProducto, editarProducto, eliminarProducto } = useStore();
  const { decir } = useBoti();
  const giro = negocio?.giro;
  const previo = id ? s.productos.find((p) => p.id === id && p.negocioId === negocio?.id) : undefined;
  const perfilPrevio = useMemo(() => (previo ? perfilDeProducto(previo, giro) : null), [previo, giro]);

  // Al venir de «lo que buscan y nadie tiene» el nombre ya viene escrito (con la primera letra en mayúscula) y lo demás se deduce de él
  const sugerido = !id && typeof nombreSugerido === 'string' ? nombreSugerido.slice(0, 120).replace(/^./, (c) => c.toUpperCase()) : '';
  // Al venir del escáner trae el código de barras (se recuerda con el nombre que quede) y la unidad con que se vende lo empaquetado
  const unidadSugerida = !id && typeof unidadDeLaApp === 'string' ? unidadDeLaApp : '';
  const [codigoPendiente, setCodigoPendiente] = useState<string | null>(() => (!id && typeof codigoDeBarras === 'string' ? codigoParaBuscar(codigoDeBarras) : null));
  const clasSugerida = useMemo(() => (sugerido ? clasificar(sugerido, giro) : null), [sugerido, giro]);
  const [nombre, setNombre] = useState(previo?.nombre ?? sugerido);
  const [precio, setPrecio] = useState(previo?.precio != null ? String(previo.precio) : '');
  const [tipo, setTipo] = useState<TipoProducto>(perfilPrevio?.tipo ?? clasSugerida?.tipo ?? clasificar('', giro).tipo);
  const [tipoTocado, setTipoTocado] = useState(!!previo?.tipo);
  const [unidad, setUnidad] = useState(() => {
    if (!previo) {
      const t = clasSugerida?.tipo ?? clasificar('', giro).tipo;
      return unidadSugerida && unidadesPara(giro, t).includes(unidadSugerida) ? unidadSugerida : unidadInicial(giro, t);
    }
    return unidadesPara(giro, perfilPrevio?.tipo).includes(previo.unidad) ? previo.unidad : UNIDAD_OTRA;
  });
  const [unidadOtra, setUnidadOtra] = useState(previo && !unidadesPara(giro, perfilPrevio?.tipo).includes(previo.unidad) ? previo.unidad : '');
  const [unidadTocada, setUnidadTocada] = useState(!!previo || !!unidadSugerida);
  const [disponible, setDisponible] = useState(previo?.disponible ?? true);
  const [porEncargo, setPorEncargo] = useState(previo?.porEncargo ?? false);
  const [existencias, setExistencias] = useState(previo?.cantidad != null ? String(previo.cantidad) : '');
  const [categoria, setCategoria] = useState<CategoriaProducto>(previo?.categoria ?? (clasSugerida && clasSugerida.categoria !== 'otro' ? clasSugerida.categoria : categoriaInicial(giro)));
  const [descripcion, setDescripcion] = useState(previo?.descripcion ?? '');
  const [caracteristicas, setCaracteristicas] = useState<string[]>(previo?.caracteristicas ?? []);
  const [caracteristica, setCaracteristica] = useState('');
  // La foto que ya tenía se baja aparte; `fotoNueva` guarda lo que la persona cambió (null = no la tocó, undefined = la quitó)
  const fotoActual = useFotoProducto(previo);
  const [fotoNueva, setFotoNueva] = useState<string | undefined | null>(null);
  const fotoUri = fotoNueva === null ? fotoActual : fotoNueva;
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>(perfilPrevio?.etiquetas ?? clasSugerida?.etiquetas ?? []);
  const [tocado, setTocado] = useState(!!previo?.etiquetas);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const entendido = useMemo(() => (nombre.trim().length >= 2 ? clasificar(nombre, giro, tipo) : null), [nombre, giro, tipo]);

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

  const opcionesUnidad = unidadesPara(giro, tipo);

  /** Vuelve a deducir lo que el comerciante no ha corregido a mano. */
  function releer(texto: string, tipoNuevo: TipoProducto) {
    const c = clasificar(texto, giro, tipoNuevo);
    if (!tocado) {
      // Si no reconoce el nombre, se queda la categoría que corresponde al giro del negocio.
      setCategoria(c.categoria === 'otro' && tipoNuevo === 'ingrediente' ? categoriaInicial(giro) : c.categoria);
      setEtiquetas(c.etiquetas);
    }
    if (!unidadTocada) setUnidad(unidadInicial(giro, tipoNuevo));
  }

  function cambiarNombre(t: string) {
    setNombre(t);
    setError('');
    setAviso('');
    const tipoNuevo = tipoTocado ? tipo : clasificar(t, giro).tipo;
    if (!tipoTocado) setTipo(tipoNuevo);
    releer(t, tipoNuevo);
  }

  function elegirTipo(t: TipoProducto) {
    setTipoTocado(true);
    setTipo(t);
    setError('');
    releer(nombre, t);
  }

  const alternar = (e: Etiqueta) => {
    setTocado(true);
    setEtiquetas((p) => {
      if (p.includes(e)) return p.filter((x) => x !== e);
      let sig = [...p, e];
      // "Con carne" y "Sin carne" no pueden ir juntas; la carne siempre es proteína.
      if (e === 'carne') sig = [...sig.filter((x) => x !== 'sinCarne'), ...(sig.includes('proteina') ? [] : ['proteina' as Etiqueta])];
      if (e === 'sinCarne') sig = sig.filter((x) => x !== 'carne');
      return sig;
    });
  };

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
    const c = clasificar(nombre, giro, tipo);
    // Si dejó una característica escrita sin tocar «Agregar», también se guarda.
    const listaCar = [...caracteristicas, caracteristica.trim()].map((x) => x.trim()).filter(Boolean).slice(0, 6);
    const datos = {
      nombre,
      precio: monto,
      unidad: unidadFinal,
      disponible,
      porEncargo,
      cantidad,
      tipo,
      categoria,
      etiquetas,
      // Un platillo ya hecho no cuenta como ingrediente de las recetas (un pollo rostizado no es "pollo" para cocinar).
      ingrediente: tipo === 'ingrediente' ? c.ingrediente : undefined,
      descripcion: descripcion.trim() || undefined,
      caracteristicas: listaCar.length > 0 ? listaCar : undefined,
      // Solo se manda la foto si la persona la cambió: así no se vuelve a subir (ni se pierde) una foto que no tocó
      ...(fotoNueva !== null ? { fotoUri: fotoNueva } : {}),
    };
    setGuardando(true);
    const err = previo ? await editarProducto(previo.id, datos) : await agregarProducto(datos);
    setGuardando(false);
    if (err) return setError(err);
    // Si venía de escanear un código, se recuerda con el nombre que quedó (no cambia lo que ya se sabía de ese código)
    if (!previo && codigoPendiente) {
      void recordarCodigo(codigoPendiente, { nombre: nombre.trim() });
      setCodigoPendiente(null);
    }
    if (otro && !previo) {
      setAviso(`Guardamos «${nombre.trim()}». Escribe el siguiente producto.`);
      setNombre('');
      setPrecio('');
      setExistencias('');
      setCategoria(categoriaInicial(giro));
      setEtiquetas([]);
      setTocado(false);
      setTipoTocado(false);
      setDisponible(true);
      setPorEncargo(false);
      setDescripcion('');
      setCaracteristicas([]);
      setCaracteristica('');
      setFotoNueva(null);
      decir('¡Producto publicado! Tus clientes ya lo ven.', { pose: 'palma', emocion: 'celebra', ms: 4000 });
      return;
    }
    decir(previo ? '¡Cambios guardados!' : '¡Producto publicado! Tus clientes ya lo ven.', { pose: 'palma', emocion: previo ? 'alegre' : 'celebra', ms: 4000 });
    goBack('/comerciante/productos');
  }

  const preparado = tipo === 'preparado';
  const resumen = textoEtiquetas(etiquetas, 6);

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
          onChangeText={cambiarNombre}
          autoCapitalize="sentences"
        />

        <View style={{ gap: 8 }}>
          <T size={14} weight={600}>
            ¿Qué tipo de producto es?
          </T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Opcion titulo="Para cocinar" texto="Lo lleva el cliente a su casa: carne, tortillas, verduras, abarrotes…" activa={!preparado} onPress={() => elegirTipo('ingrediente')} />
            <Opcion titulo="Ya preparado" texto="Se come o se bebe tal cual: platillos, postres, antojitos, bebidas." activa={preparado} onPress={() => elegirTipo('preparado')} />
          </View>
        </View>

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
                setUnidadTocada(true);
                setUnidad(u);
                setError('');
              }}
            />
          </View>
        </View>

        {unidad === UNIDAD_OTRA ? (
          <Field label="¿Cómo se vende?" placeholder="Ej. 1/2 litro, bolsa de 1/2 kg, charola, docena" value={unidadOtra} onChangeText={(t) => { setUnidadOtra(t); setError(''); }} />
        ) : null}

        <View style={{ gap: 4, padding: 12, borderRadius: 12, backgroundColor: C.greenTint }}>
          <T size={13} weight={700} color={C.greenDark}>
            {(() => {
              const u = (unidad === UNIDAD_OTRA ? unidadOtra.trim() : unidad) || 'unidad';
              const monto = leerPrecio();
              return monto != null && monto !== null ? `Tus clientes lo verán así: ${textoPrecio(monto, u)}` : `El precio que pongas es por cada «${u}».`;
            })()}
          </T>
          <T size={12} lh={1.4} color={C.greenDark}>
            Tú decides la cantidad que cobras: si vendes por medio litro, elige «{UNIDAD_OTRA}» y escribe «1/2 litro»; el precio será el de esa cantidad.
          </T>
        </View>

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

        <Card style={{ gap: 14, padding: 16 }}>
          <View style={{ gap: 3 }}>
            <T size={15} weight={700}>
              Detalles para tus clientes (opcional)
            </T>
            <T size={12} lh={1.4} color={C.muted}>
              Una foto, una descripción y sus características. El cliente las ve al tocar el producto, como en las tiendas en línea. Si no quieres, puedes dejarlo vacío.
            </T>
          </View>
          <FotoCampo uri={fotoUri} nombre={nombre || 'P'} titulo="Foto del producto" onChange={setFotoNueva} />
          <Field
            label="Descripción"
            placeholder="Ej. Pierna y muslo de pollo fresco, ideal para caldos y guisados."
            value={descripcion}
            onChangeText={(t) => { setDescripcion(t); setError(''); }}
            multiline
            h={92}
            maxLength={500}
            autoCapitalize="sentences"
          />
          <View style={{ gap: 8 }}>
            <T size={14} weight={600}>
              Características importantes (hasta 6)
            </T>
            {caracteristicas.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {caracteristicas.map((c, i) => (
                  <Pressable
                    key={`${c}-${i}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar «${c}»`}
                    onPress={() => setCaracteristicas((p) => p.filter((_, j) => j !== i))}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: C.greenTint }}
                  >
                    <T size={13} weight={600} color={C.greenDark}>
                      {c}
                    </T>
                    <Icon name="close" size={13} color={C.greenDark} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            {caracteristicas.length < 6 ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Field label="" gap={0} placeholder="Ej. Ideal para caldos" value={caracteristica} onChangeText={setCaracteristica} maxLength={60} autoCapitalize="sentences" />
                </View>
                <Btn
                  label="Agregar"
                  variant="outline"
                  h={52}
                  size={14}
                  onPress={() => {
                    const t = caracteristica.trim();
                    if (!t) return;
                    setCaracteristicas((p) => (p.length >= 6 || p.some((x) => x.toLowerCase() === t.toLowerCase()) ? p : [...p, t]));
                    setCaracteristica('');
                  }}
                />
              </View>
            ) : null}
          </View>
        </Card>

        <Card style={{ gap: 12, padding: 16 }}>
          <View style={{ gap: 3 }}>
            <T size={15} weight={700}>
              Así lo entiende el asistente
            </T>
            <T size={12} lh={1.4} color={entendido ? C.greenDark : C.muted}>
              {!entendido
                ? 'Escribe el nombre y la app detecta de qué se trata.'
                : preparado
                  ? `Lo ofrece cuando alguien busca algo ya hecho${resumen ? ` (${resumen})` : ''}. Si no es así, corrígelo abajo.`
                  : entendido.ingrediente
                    ? `Lo reconoce como «${nombreIngrediente(entendido.ingrediente)}». Así puede sugerirlo en recetas.`
                    : 'No lo reconoce como ingrediente de recetas, pero los clientes lo encontrarán por su nombre.'}
            </T>
          </View>
          <SelectField
            label="Categoría"
            value={nombreCategoria(categoria)}
            options={NOMBRES_CATEGORIA}
            onChange={(n) => {
              setTocado(true);
              setCategoria(idDeCategoria(n));
            }}
          />
          {GRUPOS_ETIQUETAS.filter((g) => preparado || !g.soloPreparado).map((g) => (
            <View key={g.titulo} style={{ gap: 8 }}>
              <T size={14} weight={600}>
                {g.titulo}
              </T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {g.items.map((it) => (
                  <Chip key={it.id} label={it.nombre} h={38} px={14} size={13} tone="green" border={C.input} active={etiquetas.includes(it.id)} onPress={() => alternar(it.id)} />
                ))}
              </View>
            </View>
          ))}
          <T size={12} lh={1.4} color={C.muted}>
            El asistente usa esto cuando un cliente pide algo dulce, un desayuno, un plato fuerte, algo con carne o con proteína.
          </T>
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
