import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Redirect } from 'expo-router';
import { compartirCartelPdf, compartirNegocio, compartirPorWhatsApp, copiarEnlace, imprimirCartel } from '../lib/compartir';
import { enlaceDeNegocio } from '../lib/enlaces';
import { useStore } from '../store';
import { CodigoQR } from '../ui/CodigoQR';
import { BackBtn, Btn, Card, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/**
 * «Comparte tu negocio»: el enlace y el QR de tu negocio para mandarlos por WhatsApp o enseñarlos en el mostrador, y un cartel
 * (hoja carta) para imprimir y pegar en el escaparate. Quien toca el enlace o lee el QR ve tu negocio al instante.
 * Autor: José David Pérez Miguel
 */
export default function CompartirNegocio() {
  const { negocio, cuenta, avisar } = useStore();
  const { width } = useWindowDimensions();
  const [ocupado, setOcupado] = useState<string | null>(null);

  if (!cuenta) return <Redirect href="/" />;
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

  const enlace = enlaceDeNegocio(negocio.id);
  const lado = Math.max(180, Math.min(280, width - 40 - 40));
  const datos = { id: negocio.id, nombre: negocio.nombre, giro: negocio.giro };

  /** Una sola acción a la vez; si algo falla se avisa con un texto sencillo. */
  async function hacer(clave: string, accion: () => Promise<string | null>) {
    if (ocupado) return;
    setOcupado(clave);
    const r = await accion();
    setOcupado(null);
    if (r) avisar(r);
  }

  return (
    <Screen bottomInset contentStyle={{ gap: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ paddingTop: 8, marginLeft: -8 }}>
        <BackBtn />
      </View>
      <T size={26} weight={800} ls={-0.02}>
        Comparte tu negocio
      </T>
      <T size={14} lh={1.5} color={C.muted}>
        Tus clientes ven lo que hay hoy en tu negocio con solo tocar tu enlace o leer tu código QR. No tienen que buscarte.
      </T>

      <Card style={{ alignItems: 'center', gap: 10, padding: 20 }}>
        <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden' }}>
          <CodigoQR texto={enlace} size={lado} etiqueta={`Código QR de ${negocio.nombre}`} />
        </View>
        <T size={17} weight={800} style={{ textAlign: 'center' }}>
          {negocio.nombre}
        </T>
        <T size={12} lh={1.4} color={C.muted} selectable style={{ textAlign: 'center' }}>
          {enlace}
        </T>
        <T size={12.5} lh={1.4} color={C.greenDark} style={{ textAlign: 'center' }}>
          Enséñalo en el mostrador: tus clientes lo leen con la cámara de su celular.
        </T>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn label={ocupado === 'compartir' ? 'Abriendo…' : 'Compartir'} h={50} r={14} size={15} flex={1} onPress={() => void hacer('compartir', () => compartirNegocio(datos))} />
        <Btn label="WhatsApp" variant="outline" h={50} r={14} size={15} flex={1} onPress={() => void hacer('whatsapp', () => compartirPorWhatsApp(datos))} />
      </View>
      <Btn label="Copiar enlace" variant="outline" h={50} r={14} size={15} onPress={() => void hacer('copiar', () => copiarEnlace(negocio.id))} />

      <Card style={{ gap: 10, padding: 16 }}>
        <T size={15} weight={700}>
          Cartel para tu escaparate
        </T>
        <T size={13} lh={1.45} color={C.muted}>
          Una hoja tamaño carta con el nombre de tu negocio y el código QR grande. Imprímela y pégala en la puerta o en el mostrador, o mándala en PDF a una imprenta.
        </T>
        <Btn label={ocupado === 'imprimir' ? 'Abriendo…' : 'Imprimir cartel'} h={48} r={12} size={15} onPress={() => void hacer('imprimir', () => imprimirCartel(datos))} />
        <Btn label={ocupado === 'pdf' ? 'Armando el PDF…' : 'Compartir cartel en PDF'} variant="outline" h={48} r={12} size={15} onPress={() => void hacer('pdf', () => compartirCartelPdf(datos))} />
      </Card>

      <Card style={{ gap: 6, padding: 16, backgroundColor: C.greenTint, borderColor: C.greenTint }}>
        <T size={14} weight={700} color={C.greenDark}>
          ¿Cómo lo ven tus clientes?
        </T>
        <T size={13} lh={1.5} color={C.greenDark}>
          · Con la cámara del celular: se abre Mercaboot en el navegador, sin instalar nada.{'\n'}· Con la app: en su perfil tocan «Escanear QR de un negocio» y apuntan al código.
        </T>
      </Card>
    </Screen>
  );
}
