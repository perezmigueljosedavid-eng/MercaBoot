import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { idDeNegocioEnTexto } from '../lib/enlaces';
import { BackBtn, Btn, Card, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/**
 * Escanear el QR de un negocio (el del cartel de su escaparate o el que te mandó por WhatsApp) y abrir su página.
 * Solo entiende códigos de Mercaboot; cualquier otro QR se ignora con un aviso. La cámara solo se usa aquí y no se guarda nada.
 * Autor: José David Pérez Miguel
 */
export default function EscanearQR() {
  const insets = useSafeAreaInsets();
  const enfoque = useIsFocused();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [aviso, setAviso] = useState('');
  /** Mientras se abre un negocio o se muestra un aviso no se lee otro código (la cámara lee varias veces por segundo). */
  const ocupado = useRef(false);

  // El aviso se quita solo y la cámara vuelve a leer
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => {
      setAviso('');
      ocupado.current = false;
    }, 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  // Al salir de esta pantalla (por ejemplo, a ver el negocio) se deja todo listo para escanear otro
  useFocusEffect(
    useCallback(
      () => () => {
        ocupado.current = false;
        setAviso('');
      },
      [],
    ),
  );

  function alEscanear(l: BarcodeScanningResult) {
    if (ocupado.current) return;
    ocupado.current = true;
    const id = idDeNegocioEnTexto(l.data);
    if (!id) {
      setAviso('Ese código no es de un negocio de Mercaboot.');
      return;
    }
    router.push(`/negocio/${id}`);
  }

  if (!permiso) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  if (!permiso.granted) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 16 }}>
        <BackBtn />
        <T size={22} weight={800} ls={-0.02}>
          Escanear QR de un negocio
        </T>
        <Card style={{ gap: 12, padding: 18 }}>
          <T size={15} lh={1.5}>
            Apuntas la cámara al código QR que está pegado en el escaparate de un negocio (o que te mandaron) y Mercaboot abre su página: lo que hay hoy, los precios y cómo llegar.
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

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {enfoque ? (
        <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={alEscanear} />
      ) : null}

      {/* Marco para apuntar */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 250, height: 250, borderRadius: 22, borderWidth: 3, borderColor: aviso ? C.amber : C.white, opacity: 0.9 }} />
        <T size={14} weight={600} color={C.white} style={{ marginTop: 14, textAlign: 'center', paddingHorizontal: 30 }}>
          Apunta al código QR del negocio
        </T>
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, paddingTop: insets.top + 8, paddingHorizontal: 12, flexDirection: 'row' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
          <BackBtn color={C.white} />
        </View>
      </View>

      {aviso ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 28 + insets.bottom, alignItems: 'center' }}>
          <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: C.white }}>
            <T size={14} weight={700} lh={1.4} color={C.ink}>
              {aviso}
            </T>
          </View>
        </View>
      ) : null}
    </View>
  );
}
