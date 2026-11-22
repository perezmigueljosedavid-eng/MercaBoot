import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { montoParaCopiar, numerosParaCopiar, proveedorDeLink, sitioDeLink, TEXTO_SOLO_TARJETA } from '../lib/pagos';
import { dinero } from '../lib/pedidos';
import { Icon } from './Icon';
import { Btn, Card } from './kit';
import { T } from './T';
import { C } from './theme';

/**
 * Cómo pagar un pedido «por adelantado», dentro del pedido del cliente: los datos de la transferencia (con botones para copiar la
 * CLABE o el monto) y, si el negocio tiene su link de pago, el botón «Pagar con tarjeta». Mercaboot no cobra ni guarda tarjetas:
 * el pago pasa directo en la página del negocio (Mercado Pago, Clip, PayPal…). Después el cliente vuelve y toca «Ya pagué».
 * Autor: José David Pérez Miguel
 */

/** Copia un texto y, por un momento, deja marcado cuál se copió (para que el botón diga «Copiado»). */
export function useCopiado() {
  const [copiado, setCopiado] = useState<string | null>(null);
  useEffect(() => {
    if (copiado === null) return;
    const t = setTimeout(() => setCopiado(null), 1800);
    return () => clearTimeout(t);
  }, [copiado]);
  const copiar = useCallback(async (clave: string, texto: string) => {
    try {
      await Clipboard.setStringAsync(texto);
    } catch {
      return; // sin portapapeles no pasa nada: el texto sigue a la vista para copiarlo con el dedo
    }
    setCopiado(clave);
  }, []);
  return { copiado, copiar };
}

export function BotonCopiar({ etiqueta, copiado, onPress }: { etiqueta: string; copiado: boolean; onPress: () => void }) {
  const color = copiado ? C.greenDark : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copiado ? `${etiqueta}: copiado` : etiqueta}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: copiado ? C.green : C.input,
        backgroundColor: copiado ? C.greenTint : C.white,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name={copiado ? 'check' : 'copy'} size={15} color={color} />
      <T size={13} weight={700} color={color}>
        {copiado ? 'Copiado' : etiqueta}
      </T>
    </Pressable>
  );
}

/** Los datos para transferir. `datos`: `undefined` = cargando, `null` = no se pudieron leer. */
function Transferencia({ datos, total, avisado }: { datos: string | null | undefined; total: number; avisado: boolean }) {
  const { copiado, copiar } = useCopiado();
  const numeros = datos ? numerosParaCopiar(datos) : [];
  const claveMala = numeros.some((n) => n.tipo === 'clabe' && !n.bueno);
  return (
    <Card style={{ gap: 8, padding: 16 }}>
      <T size={14} weight={700}>
        Datos para tu transferencia
      </T>
      {datos === undefined ? (
        <T size={14} color={C.muted}>
          Cargando…
        </T>
      ) : datos ? (
        <T size={15} lh={1.5} selectable>
          {datos}
        </T>
      ) : (
        <T size={13} lh={1.45} color={C.muted}>
          No pudimos cargar los datos. Pídeselos al negocio por el chat.
        </T>
      )}
      {datos ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {numeros.map((n) => (
            <BotonCopiar key={n.valor} etiqueta={n.tipo === 'clabe' ? 'Copiar CLABE' : 'Copiar tarjeta'} copiado={copiado === n.valor} onPress={() => void copiar(n.valor, n.valor)} />
          ))}
          <BotonCopiar etiqueta="Copiar monto" copiado={copiado === 'monto'} onPress={() => void copiar('monto', montoParaCopiar(total))} />
        </View>
      ) : null}
      {claveMala ? (
        <T size={12.5} lh={1.4} weight={600} color={C.amberText}>
          Ojo: esa CLABE no pasó la revisión automática (puede tener un número mal escrito). Confírmala con el negocio por el chat antes de transferir.
        </T>
      ) : null}
      <T size={12} lh={1.4} color={C.muted}>
        {avisado ? 'Ya avisaste tu pago. Si todavía no has transferido, hazlo y escríbele al negocio por el chat.' : `Transfiere ${dinero(total)} y después toca «Ya pagué».`}
      </T>
    </Card>
  );
}

/** El botón que abre el link de pago del negocio. */
function Tarjeta({ url, total, soloTarjeta, avisado, alAbrir }: { url: string; total: number; soloTarjeta: boolean; avisado: boolean; alAbrir: () => void }) {
  const { copiado, copiar } = useCopiado();
  const [error, setError] = useState('');
  const sitio = sitioDeLink(url);
  const proveedor = proveedorDeLink(url);

  async function abrir() {
    setError('');
    try {
      await Linking.openURL(url);
      alAbrir();
    } catch {
      setError('No pudimos abrir el link. Cópialo y ábrelo en tu navegador.');
    }
  }

  return (
    <Card style={{ gap: 10, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="card" size={18} color={C.greenDark} />
        <T size={14} weight={700}>
          {soloTarjeta ? 'Pagar con tarjeta' : 'O paga con tarjeta'}
        </T>
      </View>
      <T size={13.5} lh={1.45}>
        Se abre la página de pago del negocio ({proveedor ? `${proveedor} · ` : ''}
        {sitio}) en tu navegador. Ahí escribes los datos de tu tarjeta: Mercaboot nunca los ve ni los guarda.
      </T>
      <Btn label={`Pagar ${dinero(total)} con tarjeta`} h={48} onPress={() => void abrir()} />
      {error ? (
        <T size={13} weight={600} color={C.red} accessibilityRole="alert">
          {error}
        </T>
      ) : null}
      <T size={12.5} lh={1.4} color={C.muted}>
        Revisa que en esa página el monto sea de {montoParaCopiar(total)} pesos. Si te pide escribirlo, usa ese.
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <BotonCopiar etiqueta="Copiar monto" copiado={copiado === 'monto'} onPress={() => void copiar('monto', montoParaCopiar(total))} />
        <BotonCopiar etiqueta="Copiar link" copiado={copiado === 'link'} onPress={() => void copiar('link', url)} />
      </View>
      {!proveedor ? (
        <T size={12.5} lh={1.4} weight={600} color={C.amberText}>
          Ojo: {sitio} no es un proveedor de pagos que conozcamos. Antes de pagar revisa que el nombre del negocio y el monto sean correctos; si algo te parece raro, no pagues y pregúntale al negocio por el chat.
        </T>
      ) : null}
      <T size={12} lh={1.4} color={C.muted}>
        {avisado ? 'Ya avisaste tu pago. Si todavía no has pagado, hazlo y escríbele al negocio por el chat.' : 'Al terminar, regresa a Mercaboot y toca «Ya pagué».'}
      </T>
    </Card>
  );
}

/**
 * Todo lo que ve el cliente para pagar un pedido por adelantado ya aceptado.
 *  · `datos`: lo que escribió el negocio para transferir (`undefined` = cargando, `null` = no se pudo leer).
 *  · `link`: su link de pago con tarjeta (`undefined` = cargando, `null` = no tiene).
 *  · `avisado`: el cliente ya tocó «Ya pagué» (el negocio todavía no confirma).
 *  · `alAbrirLink`: el cliente tocó «Pagar con tarjeta» (así la pantalla sabe con qué medio dirá que pagó).
 */
export function PagoDelPedido({
  datos,
  link,
  total,
  avisado,
  alAbrirLink,
}: {
  datos: string | null | undefined;
  link: string | null | undefined;
  total: number;
  avisado: boolean;
  alAbrirLink: () => void;
}) {
  const soloTarjeta = datos === TEXTO_SOLO_TARJETA;
  return (
    <>
      {soloTarjeta ? null : <Transferencia datos={datos} total={total} avisado={avisado} />}
      {link ? <Tarjeta url={link} total={total} soloTarjeta={soloTarjeta} avisado={avisado} alAbrir={alAbrirLink} /> : null}
      {soloTarjeta && !link ? (
        <Card style={{ gap: 6, padding: 16 }}>
          <T size={14} weight={700}>
            Pagar con tarjeta
          </T>
          <T size={13} lh={1.45} color={C.muted}>
            {link === undefined ? 'Cargando…' : 'No pudimos cargar el link de pago. Pídeselo al negocio por el chat.'}
          </T>
        </Card>
      ) : null}
    </>
  );
}
