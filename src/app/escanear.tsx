import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, TextInput, View } from 'react-native';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { codigoParaBuscar, nombreCompleto } from '../lib/codigoBarras';
import { buscarPorCodigo, type ResultadoDeCodigo } from '../lib/catalogoDeCodigos';
import { claveDeNombre } from '../lib/csvProductos';
import { useStore } from '../store';
import { Icon } from '../ui/Icon';
import { BackBtn, Btn, Card, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C, FONT } from '../ui/theme';

/**
 * Escanear el código de barras de un producto empaquetado (refrescos, galletas, leche, abarrotes…) para que Mercaboot
 * escriba el nombre por ti. Tú solo revisas el nombre y pones el precio. Frutas, verduras y carnes sueltas no traen
 * código: esas se agregan con «Agregar». La cámara solo se usa aquí y no se guarda ninguna foto.
 * Autor: José David Pérez Miguel
 */
export default function Escanear() {
  const { s, negocio } = useStore();
  const insets = useSafeAreaInsets();
  const enfoque = useIsFocused();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [linterna, setLinterna] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDeCodigo | null>(null);
  const [aMano, setAMano] = useState(false);
  const [escrito, setEscrito] = useState('');
  const [errorManual, setErrorManual] = useState('');
  /** Mientras se busca o se muestra un resultado no se lee otro código (la cámara lee varias veces por segundo). */
  const ocupado = useRef(false);

  const propios = useMemo(() => s.productos.filter((p) => negocio && p.negocioId === negocio.id), [s.productos, negocio]);

  // Al salir de esta pantalla (por ejemplo a guardar el producto) se deja todo listo para escanear el siguiente
  useFocusEffect(
    useCallback(
      () => () => {
        ocupado.current = false;
        setResultado(null);
        setBuscando(false);
        setAMano(false);
        setEscrito('');
        setErrorManual('');
      },
      [],
    ),
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

  async function buscar(codigo: string) {
    ocupado.current = true;
    setResultado(null);
    setBuscando(true);
    const r = await buscarPorCodigo(codigo);
    setBuscando(false);
    setResultado(r);
  }

  function alEscanear(l: BarcodeScanningResult) {
    if (ocupado.current) return;
    const c = codigoParaBuscar(l.data);
    // Una lectura mal hecha (el dígito final no cuadra) se ignora y la cámara sigue intentando
    if (!c) return;
    void buscar(c);
  }

  function buscarEscrito() {
    const c = codigoParaBuscar(escrito);
    if (!c) {
      setErrorManual('Ese código no parece correcto. Revisa los números: son 8, 12 o 13 dígitos.');
      return;
    }
    setErrorManual('');
    setAMano(false);
    void buscar(c);
  }

  function otro() {
    ocupado.current = false;
    setResultado(null);
    setErrorManual('');
  }

  function agregar(codigo: string, nombre?: string) {
    // `unidad: pieza`: lo empaquetado se vende por pieza; el comerciante puede cambiarlo
    router.push({ pathname: '/producto-form', params: { codigo, unidad: 'pieza', ...(nombre ? { nombre } : {}) } });
  }

  if (!permiso) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  if (!permiso.granted) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 16 }}>
        <BackBtn />
        <T size={22} weight={800} ls={-0.02}>
          Escanear productos
        </T>
        <Card style={{ gap: 12, padding: 18 }}>
          <T size={15} lh={1.5}>
            Apuntas la cámara al código de barras de un producto (un refresco, unas galletas, una leche…) y Mercaboot escribe el nombre por ti. Tú solo revisas y pones el precio.
          </T>
          <T size={13} lh={1.45} color={C.muted}>
            La cámara solo se usa en esta pantalla. No se guardan fotos ni video.
          </T>
          {permiso.canAskAgain ? (
            <Btn label="Permitir la cámara" h={50} onPress={() => void pedirPermiso()} />
          ) : (
            <>
              <T size={13.5} weight={600} lh={1.45} color={C.red}>
                La cámara está bloqueada para Mercaboot. Ábrela en los ajustes de tu teléfono: Aplicaciones → Mercaboot → Permisos → Cámara.
              </T>
              <Btn label="Abrir los ajustes" h={50} onPress={() => void Linking.openSettings()} />
            </>
          )}
        </Card>
      </Screen>
    );
  }

  const yaLoTiene =
    resultado?.tipo === 'encontrado' ? propios.find((p) => claveDeNombre(p.nombre) === claveDeNombre(nombreCompleto(resultado.producto))) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {enfoque ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={linterna}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
          onBarcodeScanned={resultado || buscando ? undefined : alEscanear}
        />
      ) : null}

      {/* Marco para apuntar */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '78%', height: 150, borderRadius: 18, borderWidth: 3, borderColor: buscando ? C.amber : C.white, opacity: 0.9 }} />
        <T size={14} weight={600} color={C.white} style={{ marginTop: 14, textAlign: 'center', paddingHorizontal: 30 }}>
          {buscando ? 'Buscando el producto…' : 'Apunta al código de barras del producto'}
        </T>
      </View>

      {/* Barra de arriba */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <BackBtn color={C.white} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={linterna ? 'Apagar la linterna' : 'Prender la linterna'}
          onPress={() => setLinterna((v) => !v)}
          style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: linterna ? C.amber : 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
        >
          <T size={14} weight={700} color={linterna ? C.ink : C.white}>
            {linterna ? 'Linterna prendida' : 'Linterna'}
          </T>
        </Pressable>
      </View>

      {/* Abajo: escribir el código a mano, o el resultado */}
      {resultado ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, gap: 12, padding: 18, paddingBottom: 18 + insets.bottom, backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
          {resultado.tipo === 'encontrado' ? (
            <>
              <T size={12.5} color={C.muted}>
                {yaLoTiene ? 'Ya lo tienes en tu lista' : 'Encontré este producto'}
              </T>
              <T size={19} weight={800} lh={1.25}>
                {nombreCompleto(resultado.producto)}
              </T>
              <T size={12} lh={1.4} color={C.muted}>
                Código {resultado.codigo}
                {resultado.producto.fuente === 'off' ? ' · Datos de Open Food Facts: revisa el nombre antes de guardar.' : ' · Lo registró otro comerciante: revisa el nombre antes de guardar.'}
              </T>
              {yaLoTiene ? (
                <Btn label="Editar el que ya tengo" h={50} onPress={() => router.push({ pathname: '/producto-form', params: { id: yaLoTiene.id } })} />
              ) : (
                <Btn label="Agregar a mis productos" h={50} onPress={() => agregar(resultado.codigo, nombreCompleto(resultado.producto))} />
              )}
              <Btn label="Escanear otro" variant="outline" h={46} onPress={otro} />
            </>
          ) : resultado.tipo === 'desconocido' ? (
            <>
              <T size={17} weight={800} lh={1.3}>
                Este código todavía no lo conozco
              </T>
              <T size={13.5} lh={1.45} color={C.muted}>
                Escribe el nombre una sola vez: Mercaboot lo recordará para ti y para otros comerciantes. Las frutas y verduras sueltas no traen código: agrégalas con «Agregar».
              </T>
              <Btn label="Escribir el nombre" h={50} onPress={() => agregar(resultado.codigo)} />
              <Btn label="Escanear otro" variant="outline" h={46} onPress={otro} />
            </>
          ) : (
            <>
              <T size={17} weight={800} lh={1.3}>
                No pude buscarlo
              </T>
              <T size={13.5} lh={1.45} color={C.muted}>
                {resultado.texto}
              </T>
              <Btn label="Intentar de nuevo" h={50} onPress={() => void buscar(resultado.codigo)} />
              <Btn label="Escribir el nombre" variant="outline" h={46} onPress={() => agregar(resultado.codigo)} />
              <Btn label="Escanear otro" variant="outline" h={46} onPress={otro} />
            </>
          )}
        </View>
      ) : (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 + insets.bottom, backgroundColor: 'rgba(0,0,0,0.55)' }}>
          {aMano ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  value={escrito}
                  onChangeText={(t) => {
                    setEscrito(t.replace(/\D+/g, '').slice(0, 14));
                    setErrorManual('');
                  }}
                  placeholder="Los números del código"
                  placeholderTextColor={C.placeholder}
                  accessibilityLabel="Código de barras"
                  keyboardType="number-pad"
                  maxLength={14}
                  style={{ flex: 1, height: 48, borderRadius: 14, backgroundColor: C.white, paddingHorizontal: 14, fontFamily: FONT[600], fontSize: 16, color: C.ink }}
                />
                <Btn label="Buscar" h={48} r={14} size={15} onPress={buscarEscrito} />
              </View>
              {errorManual ? (
                <T size={13} weight={600} lh={1.4} color="#FFD2CE" accessibilityRole="alert">
                  {errorManual}
                </T>
              ) : null}
            </>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setAMano(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44 }}>
              <Icon name="edit" size={16} color={C.white} />
              <T size={14} weight={700} color={C.white}>
                ¿No lo lee? Escribe los números del código
              </T>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
