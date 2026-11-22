import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, View } from 'react-native';
import { alertasEnMemoria, cargarAlertas, quitarAlerta, suscribirAlertas } from '../lib/alertas';
import { activarAvisos, avisosDisponibles, desactivarAvisos, leerLocal, permisoConcedido } from '../lib/avisosTelefono';
import { textoError } from '../lib/nube';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { BackBtn, Btn, Card, Group, Screen, Toggle } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/**
 * Avisos al teléfono: se prenden o apagan en este teléfono y se elige qué avisos llegan.
 * Autor: José David Pérez Miguel
 */

interface Prefs {
  mensajes: boolean;
  pedidos: boolean;
  avisos: boolean;
  silencio: boolean;
}

const PREFS_INICIALES: Prefs = { mensajes: true, pedidos: true, avisos: true, silencio: true };

function Opcion({ titulo, detalle, valor, onCambiar, apagado = false }: { titulo: string; detalle: string; valor: boolean; onCambiar: (v: boolean) => void; apagado?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, opacity: apagado ? 0.5 : 1 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={15} weight={600}>
          {titulo}
        </T>
        <T size={12.5} lh={1.4} color={C.muted}>
          {detalle}
        </T>
      </View>
      <Toggle value={valor} onChange={apagado ? () => {} : onCambiar} label={titulo} />
    </View>
  );
}

export default function AvisosTelefono() {
  const { avisar, cuenta } = useStore();
  const disponible = avisosDisponibles();
  const [activo, setActivo] = useState(false);
  const [permiso, setPermiso] = useState<boolean | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(PREFS_INICIALES);
  const [ocupado, setOcupado] = useState(false);
  const [leido, setLeido] = useState(false);
  const cargado = leido || !disponible || !cuenta;
  const vivo = useRef(true);
  // Lo que la persona le pidió a Boti que le avise («avísame cuando haya aguacate»)
  const [esperadas, setEsperadas] = useState<string[]>(alertasEnMemoria);
  const esCliente = cuenta?.rol === 'cliente';

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  useEffect(() => {
    if (!esCliente) return;
    const dejar = suscribirAlertas(() => setEsperadas(alertasEnMemoria()));
    void cargarAlertas(true);
    return dejar;
  }, [esCliente]);

  /** Lee qué hay ahora: si Android dio el permiso, si la persona los prendió y qué avisos eligió. */
  const leer = useCallback(() => {
    if (!disponible || !cuenta) return;
    Promise.all([
      leerLocal(),
      permisoConcedido(),
      supabase.from('preferencias_notificacion').select('mensajes,pedidos,avisos,silencio').eq('usuario_id', cuenta.id).maybeSingle(),
    ])
      .then(([local, p, fila]) => {
        if (!vivo.current) return;
        setPermiso(p);
        setActivo(local.activo && p === true);
        if (!fila.error && fila.data) setPrefs({ ...PREFS_INICIALES, ...(fila.data as Partial<Prefs>) });
        setLeido(true);
      })
      .catch(() => {
        if (vivo.current) setLeido(true);
      });
  }, [disponible, cuenta]);

  useEffect(() => {
    leer();
    // Al volver de los ajustes del teléfono (donde pudo dar el permiso) se revisa otra vez
    const sub = AppState.addEventListener('change', (e) => {
      if (e === 'active') leer();
    });
    return () => sub.remove();
  }, [leer]);

  const cambiarActivo = async (quiere: boolean) => {
    if (ocupado) return;
    setOcupado(true);
    try {
      if (!quiere) {
        await desactivarAvisos();
        setActivo(false);
        return;
      }
      const r = await activarAvisos();
      if (r === 'ok') {
        setActivo(true);
        setPermiso(true);
        avisar('Listo: este teléfono recibirá tus avisos.');
      } else if (r === 'sin-permiso') {
        setPermiso(false);
        avisar('Android no dejó mostrar avisos. Actívalos en los ajustes del teléfono.');
      } else if (r === 'no-disponible') {
        avisar('Esta versión de la app todavía no trae los avisos al teléfono.');
      } else {
        avisar('No pudimos activar los avisos ahora. Revisa tu internet e inténtalo otra vez.');
      }
    } finally {
      if (vivo.current) setOcupado(false);
    }
  };

  const cambiarPref = async (clave: keyof Prefs, valor: boolean) => {
    const antes = prefs;
    const nuevas = { ...prefs, [clave]: valor };
    setPrefs(nuevas);
    const { error } = await supabase.rpc('guardar_preferencias_notificacion', {
      p_mensajes: nuevas.mensajes,
      p_pedidos: nuevas.pedidos,
      p_avisos: nuevas.avisos,
      p_silencio: nuevas.silencio,
    });
    if (error && vivo.current) {
      setPrefs(antes);
      avisar(textoError(error));
    }
  };

  return (
    <Screen bottomInset contentStyle={{ gap: 14, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 16 }}>
        <BackBtn />
        <T size={18} weight={700}>
          Avisos al teléfono
        </T>
      </View>

      <View style={{ gap: 14, paddingHorizontal: 20 }}>
        {!disponible ? (
          <Card style={{ padding: 18, gap: 8, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={15} weight={700} color={C.amberDeep}>
              Todavía no están activados en esta versión
            </T>
            <T size={13.5} lh={1.5} color={C.amberDeep}>
              Cuando se activen, tu teléfono te avisará aunque tengas la app cerrada: cuando te contesten un mensaje, cuando llegue o cambie un pedido y cuando una tienda que sigues publique algo. Aquí podrás elegir cuáles quieres.
            </T>
          </Card>
        ) : (
          <>
            <Card style={{ padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T size={16} weight={700}>
                    Recibir avisos en este teléfono
                  </T>
                  <T size={13} lh={1.45} color={C.muted}>
                    {activo ? 'Prendidos: te avisamos aunque la app esté cerrada.' : 'Apagados: solo verás lo nuevo cuando abras la app.'}
                  </T>
                </View>
                <Toggle value={activo} onChange={cambiarActivo} label="Recibir avisos en este teléfono" big />
              </View>
              {cargado && permiso === false ? (
                <View style={{ gap: 8, paddingTop: 4 }}>
                  <T size={13} lh={1.45} color={C.amberDeep}>
                    Android tiene bloqueados los avisos de Mercaboot. Para recibirlos, permítelos en los ajustes del teléfono y regresa aquí.
                  </T>
                  <Btn label="Abrir los ajustes del teléfono" variant="outline" h={44} r={12} size={14} onPress={() => void Linking.openSettings()} />
                </View>
              ) : null}
            </Card>

            <T size={13} weight={700} color={C.muted} style={{ paddingTop: 6, paddingLeft: 4 }}>
              ¿DE QUÉ QUIERES QUE TE AVISEMOS?
            </T>
            <Group r={18}>
              <Opcion titulo="Mensajes" detalle="Cuando una tienda o un cliente te escribe en el chat." valor={prefs.mensajes} onCambiar={(v) => void cambiarPref('mensajes', v)} />
              <Opcion titulo="Pedidos" detalle="Pedido nuevo, aceptado, listo para recoger, pago reportado o cancelado." valor={prefs.pedidos} onCambiar={(v) => void cambiarPref('pedidos', v)} />
              <Opcion titulo="Avisos de tus tiendas favoritas" detalle="Promociones, regalos y «ya hay» de las tiendas que sigues, y lo que le pediste a Boti que te avise." valor={prefs.avisos} onCambiar={(v) => void cambiarPref('avisos', v)} />
              <Opcion titulo="No molestar de noche" detalle="Sin avisos de mensajes ni de tiendas de 10 de la noche a 7 de la mañana. Los pedidos sí te llegan." valor={prefs.silencio} onCambiar={(v) => void cambiarPref('silencio', v)} />
            </Group>
            <T size={12.5} lh={1.45} color={C.muted} style={{ paddingHorizontal: 4 }}>
              Estas opciones valen para tu cuenta en todos tus teléfonos. Para apagar los avisos solo en este teléfono, usa el interruptor de arriba.
            </T>
          </>
        )}

        {esCliente && esperadas.length > 0 ? (
          <>
            <T size={13} weight={700} color={C.muted} style={{ paddingTop: 6, paddingLeft: 4 }}>
              PRODUCTOS QUE ESPERAS
            </T>
            <Group r={18}>
              {esperadas.map((t) => (
                <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
                  <T size={15} weight={600} style={{ flex: 1 }}>
                    {t}
                  </T>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Dejar de esperar ${t}`} hitSlop={10} onPress={() => void quitarAlerta(t)}>
                    <T size={13} weight={700} color={C.red}>
                      Quitar
                    </T>
                  </Pressable>
                </View>
              ))}
            </Group>
            <T size={12.5} lh={1.45} color={C.muted} style={{ paddingHorizontal: 4 }}>
              Boti te avisa en cuanto una tienda los tenga y luego los quita de esta lista. Para agregar uno, escríbele a Boti «avísame cuando haya…».
            </T>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
