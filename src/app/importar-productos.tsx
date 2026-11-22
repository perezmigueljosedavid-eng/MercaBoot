import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nombreCategoria } from '../data/contenido';
import { useBoti } from '../lib/boti';
import {
  BOM,
  MAX_BYTES,
  MAX_FILAS,
  comoCambios,
  decodificarArchivo,
  leerCsv,
  plantillaCsv,
  productosACsv,
  repartirFilas,
  type LecturaCsv,
} from '../lib/csvProductos';
import { porNombre } from '../lib/listaProductos';
import { useStore, type ProductoDeLote } from '../store';
import { textoPrecio } from '../ui/bits';
import { Confirmar } from '../ui/Dialogo';
import { Icon, type IconName } from '../ui/Icon';
import { BackBtn, Btn, Card, goBack, Screen, Toggle } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

const MAX_PRODUCTOS = 1500;

/** Un dato del resumen, con su iconito. */
function Dato({ icono, color = C.muted, texto }: { icono: IconName; color?: string; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 2 }}>
        <Icon name={icono} size={16} color={color} />
      </View>
      <T size={13.5} lh={1.4} style={{ flex: 1 }}>
        {texto}
      </T>
    </View>
  );
}

function Paso({ n, texto }: { n: number; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'center' }}>
        <T size={13} weight={800} color={C.greenDark}>
          {n}
        </T>
      </View>
      <T size={14} lh={1.45} style={{ flex: 1 }}>
        {texto}
      </T>
    </View>
  );
}

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-MX')} ${n === 1 ? uno : varios}`;

/**
 * Importar productos desde Excel o Google Sheets (archivo CSV o filas copiadas) y sacar la lista propia en el mismo formato.
 * Antes de agregar nada se muestra un resumen: cuántos son nuevos, cuáles ya los tiene, qué filas no sirven y qué precios cambian.
 * Autor: José David Pérez Miguel
 */
export default function ImportarProductos() {
  const { s, negocio, agregarProductosLote, actualizarProductosLote } = useStore();
  const insets = useSafeAreaInsets();
  const { decir } = useBoti();
  const [lectura, setLectura] = useState<LecturaCsv | null>(null);
  const [origen, setOrigen] = useState('');
  const [actualizar, setActualizar] = useState(true);
  const [verProblemas, setVerProblemas] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [listo, setListo] = useState<{ agregados: number; repetidos: number; cambiados: number; sinPrecio: number } | null>(null);

  const propios = useMemo(() => s.productos.filter((p) => negocio && p.negocioId === negocio.id), [s.productos, negocio]);
  const reparto = useMemo(
    () =>
      lectura && !lectura.error
        ? repartirFilas(
            lectura.filas,
            propios.map((p) => ({ id: p.id, nombre: p.nombre, precio: p.precio, disponible: p.disponible })),
          )
        : null,
    [lectura, propios],
  );

  if (!negocio) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 12 }}>
        <BackBtn />
        <T size={16} weight={700}>
          Esta pantalla es para cuentas con negocio.
        </T>
      </Screen>
    );
  }

  const empezar = (texto: string, de: string) => {
    setError('');
    setAviso('');
    setVerProblemas(false);
    const l = leerCsv(texto);
    setOrigen(de);
    setLectura(l);
    setActualizar(true);
  };

  const revisarBytes = (bytes: Uint8Array, nombre: string) => {
    const d = decodificarArchivo(bytes);
    if (!d.ok) {
      setLectura(null);
      setError(
        d.motivo === 'excel'
          ? 'Ese archivo es un libro de Excel (.xlsx) y todavía no lo leo directo. Ábrelo en Excel y usa «Guardar como» → «CSV». En Google Sheets: Archivo → Descargar → «Valores separados por comas (.csv)». También puedes seleccionar las celdas, copiarlas y tocar «Pegar lo que copié».'
          : d.motivo === 'vacio'
            ? 'Ese archivo está vacío.'
            : 'Ese archivo no es una lista de texto. Usa un archivo CSV (guárdalo así desde Excel o Google Sheets).',
      );
      return;
    }
    empezar(d.texto, nombre);
  };

  async function elegirArchivo() {
    if (trabajando) return;
    setError('');
    setAviso('');
    setTrabajando(true);
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      if (a.size != null && a.size > MAX_BYTES) {
        setLectura(null);
        setError('Ese archivo es muy grande para una lista de productos. Si tiene fotos o varias hojas, guarda solo la hoja de productos como CSV.');
        return;
      }
      const bytes = await new File(a.uri).bytes();
      if (bytes.length > MAX_BYTES) {
        setLectura(null);
        setError('Ese archivo es muy grande para una lista de productos. Si tiene fotos o varias hojas, guarda solo la hoja de productos como CSV.');
        return;
      }
      revisarBytes(bytes, a.name || 'tu archivo');
    } catch {
      setError('No pude abrir ese archivo. Prueba con otro, o copia las filas en Excel y toca «Pegar lo que copié».');
    } finally {
      setTrabajando(false);
    }
  }

  async function pegar() {
    if (trabajando) return;
    setError('');
    setAviso('');
    try {
      const t = await Clipboard.getStringAsync();
      if (!t.trim()) {
        setError('No hay nada copiado todavía. En Excel o Google Sheets selecciona las celdas (con los títulos arriba), cópialas y vuelve a tocar este botón.');
        return;
      }
      if (t.length > MAX_BYTES) {
        setError('Lo copiado es demasiado grande. Pega la lista por partes (o guarda un CSV).');
        return;
      }
      empezar(t, 'lo que copiaste');
    } catch {
      setError('No pude leer lo que copiaste. Prueba con «Elegir archivo».');
    }
  }

  /** Guarda el archivo en la memoria temporal y abre «compartir» (WhatsApp, Drive, correo…). Si no se puede, copia el texto. */
  async function entregar(csv: string, nombreArchivo: string, titulo: string) {
    setError('');
    setAviso('');
    try {
      const f = new File(Paths.cache, nombreArchivo);
      f.create({ overwrite: true });
      f.write(BOM + csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(f.uri, { mimeType: 'text/csv', dialogTitle: titulo, UTI: 'public.comma-separated-values-text' });
        return;
      }
    } catch {
      // Se intenta con el portapapeles
    }
    try {
      await Clipboard.setStringAsync(csv);
      setAviso('No pude abrir «compartir», así que copié la lista. Pégala en Excel o Google Sheets.');
    } catch {
      setError('No pude guardar el archivo. Intenta de nuevo.');
    }
  }

  const exportar = () => {
    const lista = [...propios].sort(porNombre);
    void entregar(
      productosACsv(lista.map((p) => ({ nombre: p.nombre, precio: p.precio, unidad: p.unidad, categoria: nombreCategoria(p.categoria), disponible: p.disponible }))),
      'mis-productos-mercaboot.csv',
      'Mis productos de Mercaboot',
    );
  };

  const nuevas = reparto?.nuevas ?? [];
  const cambios = reparto?.cambios ?? [];
  const cambiosDePrecio = cambios.filter((c) => c.precioDespues !== undefined).length;
  const cambiosDeExistencia = cambios.filter((c) => c.disponibleDespues !== undefined).length;
  const tendra = propios.length + nuevas.length;
  const pasaDelTope = tendra > MAX_PRODUCTOS;
  const haceAlgo = nuevas.length > 0 || (actualizar && cambios.length > 0);
  const sinPrecioNuevas = nuevas.filter((f) => f.precio === undefined).length;

  async function aplicar() {
    if (!reparto || guardando || !haceAlgo || pasaDelTope) return;
    setGuardando(true);
    setError('');
    let agregados = 0;
    let repetidos = 0;
    let cambiados = 0;
    if (nuevas.length > 0) {
      const lote: ProductoDeLote[] = nuevas.map((f) => ({
        nombre: f.nombre,
        ...(f.precio !== undefined ? { precio: f.precio } : {}),
        ...(f.unidad ? { unidad: f.unidad } : {}),
        ...(f.categoria ? { categoria: f.categoria } : {}),
        ...(f.disponible !== undefined ? { disponible: f.disponible } : {}),
      }));
      const r = await agregarProductosLote(lote);
      if ('error' in r) {
        setGuardando(false);
        setError(r.error);
        return;
      }
      agregados = r.agregados;
      repetidos = r.repetidos;
    }
    if (actualizar && cambios.length > 0) {
      const r = await actualizarProductosLote(comoCambios(cambios));
      if ('error' in r) {
        setGuardando(false);
        setError(agregados > 0 ? `Se agregaron ${agregados} productos, pero no se pudieron actualizar los precios: ${r.error}` : r.error);
        return;
      }
      cambiados = r.cambiados;
    }
    setGuardando(false);
    decir(agregados + cambiados > 0 ? '¡Listo! Tu lista ya está en Mercaboot.' : 'No hubo nada nuevo que agregar.', { pose: 'palma', emocion: agregados + cambiados > 0 ? 'celebra' : 'alegre', ms: 4000 });
    setLectura(null);
    setListo({ agregados, repetidos, cambiados, sinPrecio: sinPrecioNuevas });
  }

  const etiquetaBoton = guardando
    ? 'Guardando…'
    : nuevas.length > 0 && actualizar && cambios.length > 0
      ? `Agregar ${nuevas.length.toLocaleString('es-MX')} y actualizar ${cambios.length.toLocaleString('es-MX')}`
      : nuevas.length > 0
        ? `Agregar ${plural(nuevas.length, 'producto', 'productos')}`
        : actualizar && cambios.length > 0
          ? `Actualizar ${plural(cambios.length, 'producto', 'productos')}`
          : 'No hay nada que agregar';

  return (
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ paddingBottom: (reparto ? 170 : 40) + insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 16 }}>
          <BackBtn />
          <T size={18} weight={700}>
            Importar desde Excel
          </T>
        </View>

        <View style={{ gap: 14, paddingTop: 4, paddingHorizontal: 20 }}>
          <T size={14} lh={1.5} color={C.greyText}>
            Si ya tienes tus productos en Excel o Google Sheets, súbelos de golpe: sin escribirlos uno por uno y sin fotos. También sirve para cambiar muchos precios a la vez.
          </T>

          <Card style={{ gap: 12, padding: 16 }}>
            <Paso n={1} texto="Baja la plantilla y ábrela en Excel o Google Sheets (o usa tu propio archivo)." />
            <Paso n={2} texto="Una fila por producto: nombre, precio, unidad, categoría y si hay. Solo el nombre es obligatorio. Borra los ejemplos y guarda como CSV." />
            <Paso n={3} texto="Elige el archivo aquí (o copia las filas y toca «Pegar»). Antes de agregar nada te muestro un resumen." />
            <Btn label="Bajar la plantilla" variant="outline" h={46} r={12} size={15} onPress={() => void entregar(plantillaCsv(), 'plantilla-mercaboot.csv', 'Plantilla de productos')} />
          </Card>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn label={trabajando ? 'Abriendo…' : 'Elegir archivo'} h={50} r={14} size={15} flex={1} disabled={trabajando} onPress={() => void elegirArchivo()} />
            <Btn label="Pegar lo que copié" variant="outline" h={50} r={14} size={15} flex={1} onPress={() => void pegar()} />
          </View>

          {error ? (
            <T size={13.5} weight={600} lh={1.45} color={C.red} accessibilityRole="alert">
              {error}
            </T>
          ) : null}
          {aviso ? (
            <T size={13.5} weight={600} lh={1.45} color={C.greenDark} accessibilityRole="alert">
              {aviso}
            </T>
          ) : null}

          {lectura?.error ? (
            <Card style={{ gap: 6, padding: 16, backgroundColor: C.redTint, borderColor: C.redLine }}>
              <T size={14} weight={700} color={C.redDeep}>
                No pude leer «{origen}»
              </T>
              <T size={13.5} lh={1.45} color={C.redDeep}>
                {lectura.error}
              </T>
            </Card>
          ) : null}

          {lectura && !lectura.error && reparto ? (
            <Card style={{ gap: 12, padding: 16 }}>
              <T size={13} color={C.muted}>
                Esto encontré en «{origen}»
              </T>
              <T size={20} weight={800} ls={-0.02} color={nuevas.length > 0 ? C.greenDark : C.ink}>
                {nuevas.length > 0 ? `${plural(nuevas.length, 'producto nuevo', 'productos nuevos')}` : 'Ningún producto nuevo'}
              </T>

              {nuevas.length > 0 ? (
                <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
                  {nuevas.slice(0, 6).map((f) => (
                    <View key={f.linea} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
                      <T size={14} weight={600} style={{ flex: 1 }} numberOfLines={1}>
                        {f.nombre}
                      </T>
                      <T size={12.5} color={C.muted}>
                        {f.precio !== undefined ? textoPrecio(f.precio, f.unidad) : f.unidad ? `${f.unidad} · sin precio` : 'sin precio'}
                      </T>
                    </View>
                  ))}
                  {nuevas.length > 6 ? (
                    <T size={12.5} color={C.muted} style={{ paddingTop: 8 }}>
                      y {(nuevas.length - 6).toLocaleString('es-MX')} más
                    </T>
                  ) : null}
                </View>
              ) : null}

              <View style={{ gap: 8 }}>
                {reparto.iguales + cambios.length > 0 ? (
                  <Dato icono="check" color={C.green} texto={`${plural(reparto.iguales + cambios.length, 'ya lo tenías', 'ya los tenías')}: no se repiten.`} />
                ) : null}
                {sinPrecioNuevas > 0 ? (
                  <Dato icono="tag" texto={`${plural(sinPrecioNuevas, 'producto nuevo no trae', 'productos nuevos no traen')} precio: lo pones después en «Precios de hoy».`} />
                ) : null}
                {lectura.repetidasEnArchivo > 0 ? (
                  <Dato icono="info" texto={`${plural(lectura.repetidasEnArchivo, 'fila repetida', 'filas repetidas')} en el archivo (se toma la primera).`} />
                ) : null}
                {lectura.avisos.length > 0 ? (
                  <Dato icono="info" color={C.amberText} texto={`${plural(lectura.avisos.length, 'dato no se entendió', 'datos no se entendieron')}; esos productos se agregan igual sin ese dato.`} />
                ) : null}
                {lectura.cortado ? <Dato icono="info" color={C.amberText} texto={`Solo leí las primeras ${MAX_FILAS.toLocaleString('es-MX')} filas del archivo.`} /> : null}
                {lectura.problemas.length > 0 ? (
                  <Dato icono="close" color={C.red} texto={`${plural(lectura.problemas.length, 'fila no se puede usar', 'filas no se pueden usar')} y se dejan fuera.`} />
                ) : null}
              </View>

              {lectura.problemas.length + lectura.avisos.length > 0 ? (
                <View style={{ gap: 6 }}>
                  <Pressable accessibilityRole="button" onPress={() => setVerProblemas((v) => !v)}>
                    <T size={13} weight={700} color={C.green}>
                      {verProblemas ? 'Ocultar detalles' : 'Ver cuáles'}
                    </T>
                  </Pressable>
                  {verProblemas ? (
                    <View style={{ gap: 6 }}>
                      {[...lectura.problemas, ...lectura.avisos]
                        .sort((a, b) => a.linea - b.linea)
                        .slice(0, 12)
                        .map((p, i) => (
                          <T key={`${p.linea}-${i}`} size={12.5} lh={1.4} color={C.greyText}>
                            Línea {p.linea}
                            {p.nombre ? ` («${p.nombre.slice(0, 30)}»)` : ''}: {p.motivo}
                          </T>
                        ))}
                      {lectura.problemas.length + lectura.avisos.length > 12 ? (
                        <T size={12.5} color={C.muted}>
                          y {(lectura.problemas.length + lectura.avisos.length - 12).toLocaleString('es-MX')} más
                        </T>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {cambios.length > 0 ? (
                <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T size={14} weight={700}>
                        Actualizar lo que ya tienes
                      </T>
                      <T size={12.5} lh={1.35} color={C.muted}>
                        {cambiosDePrecio > 0 ? `${plural(cambiosDePrecio, 'precio cambia', 'precios cambian')}` : ''}
                        {cambiosDePrecio > 0 && cambiosDeExistencia > 0 ? ' y ' : ''}
                        {cambiosDeExistencia > 0 ? `${plural(cambiosDeExistencia, 'producto cambia', 'productos cambian')} de «hay / agotado»` : ''}
                      </T>
                    </View>
                    <Toggle value={actualizar} onChange={setActualizar} label="Actualizar lo que ya tengo" />
                  </View>
                  {actualizar
                    ? cambios.slice(0, 4).map((c) => (
                        <T key={c.id} size={12.5} lh={1.4} color={C.greyText}>
                          {c.nombre}
                          {c.precioDespues !== undefined ? `: ${c.precioAntes !== undefined ? textoPrecio(c.precioAntes) : 'sin precio'} → ${textoPrecio(c.precioDespues)}` : ''}
                          {c.disponibleDespues !== undefined ? `${c.precioDespues !== undefined ? ' · ' : ': '}${c.disponibleDespues ? 'ya hay' : 'agotado'}` : ''}
                        </T>
                      ))
                    : null}
                  {actualizar && cambios.length > 4 ? (
                    <T size={12.5} color={C.muted}>
                      y {(cambios.length - 4).toLocaleString('es-MX')} más
                    </T>
                  ) : null}
                </View>
              ) : null}

              {pasaDelTope ? (
                <T size={13.5} weight={600} lh={1.45} color={C.red} accessibilityRole="alert">
                  Un negocio puede tener hasta {MAX_PRODUCTOS.toLocaleString('es-MX')} productos. Ya tienes {propios.length.toLocaleString('es-MX')} y el archivo trae {nuevas.length.toLocaleString('es-MX')} nuevos. Quita algunas filas del archivo (o productos que ya no vendes) y vuelve a elegirlo.
                </T>
              ) : null}
            </Card>
          ) : null}

          <Card style={{ gap: 10, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="share" size={18} color={C.green} />
              <T size={15} weight={700}>
                Tu lista en Excel
              </T>
            </View>
            <T size={13.5} lh={1.45} color={C.muted}>
              {propios.length > 0
                ? `Baja tus ${propios.length.toLocaleString('es-MX')} productos en un archivo. Cambia los precios en Excel o Google Sheets y vuelve a subirlo aquí: se actualizan solos.`
                : 'Cuando tengas productos podrás bajarlos en un archivo, cambiar los precios en Excel y volver a subirlo.'}
            </T>
            {propios.length > 0 ? <Btn label="Bajar mis productos" variant="outline" h={46} r={12} size={15} onPress={exportar} /> : null}
          </Card>

          <T size={12} lh={1.4} color={C.muted}>
            Tus archivos no se suben a ningún lado: se leen en tu teléfono y solo se guardan los productos que confirmes.
          </T>
        </View>
      </Screen>

      {reparto ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 + insets.bottom, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }}>
          <Btn label={etiquetaBoton} h={52} disabled={!haceAlgo || pasaDelTope || guardando} onPress={() => void aplicar()} />
        </View>
      ) : null}

      <Confirmar
        visible={listo != null}
        titulo={
          listo && listo.agregados > 0
            ? `¡Listo! Agregamos ${plural(listo.agregados, 'producto', 'productos')}`
            : listo && listo.cambiados > 0
              ? `¡Listo! Actualizamos ${plural(listo.cambiados, 'producto', 'productos')}`
              : 'No hubo cambios'
        }
        texto={
          listo
            ? [
                listo.agregados > 0 && listo.cambiados > 0 ? `También actualizamos ${plural(listo.cambiados, 'producto', 'productos')} que ya tenías.` : '',
                listo.agregados > 0 && listo.sinPrecio > 0 ? `${plural(listo.sinPrecio, 'no tiene precio todavía', 'no tienen precio todavía')}: ponlos en «Precios de hoy», es rápido.` : '',
                listo.repetidos > 0 ? `${plural(listo.repetidos, 'ya lo tenías', 'ya los tenías')} y no se repitió.` : '',
                listo.agregados === 0 && listo.cambiados === 0 ? 'Todo lo del archivo ya estaba en tu lista.' : '',
              ]
                .filter(Boolean)
                .join(' ')
            : undefined
        }
        confirmar={listo && listo.agregados > 0 && listo.sinPrecio > 0 ? 'Poner precios' : 'Ver mis productos'}
        cancelar="Importar otro"
        onCancelar={() => setListo(null)}
        onConfirmar={() => {
          const ponerPrecios = !!listo && listo.agregados > 0 && listo.sinPrecio > 0;
          setListo(null);
          if (ponerPrecios) router.replace({ pathname: '/precios-de-hoy', params: { sinPrecio: '1' } });
          else goBack('/comerciante/productos');
        }}
      />
    </View>
  );
}
