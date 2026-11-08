import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ORDEN_AVISOS, REGALOS_SUGERIDOS, TIPOS_AVISO } from '../../data/contenido';
import type { Festividad, IdeaFiesta, Ocurrencia } from '../../data/festividades';
import { festividad as buscarFiesta, proxima as proximaFiesta } from '../../data/festividades';
import type { TipoAviso } from '../../data/tipos';
import { avisosVigentes, finDelDia, useStore } from '../../store';
import { AvisoFila, fechaCorta } from '../../ui/bits';
import { SelectorFiestas } from '../../ui/Fiestas';
import { Btn, Chip, Field, Group, Screen, SelectField } from '../../ui/kit';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

const DIA = 24 * 3600 * 1000;

/** Próxima vez que llega esa fecha (hoy mismo cuenta), al final del día. */
function proxima(mes: number, dia: number, ahora = new Date()) {
  const f = new Date(ahora.getFullYear(), mes, dia, 23, 59, 59, 999);
  if (f.getTime() < ahora.getTime()) f.setFullYear(f.getFullYear() + 1);
  return f.getTime();
}

type Vigencia = { id: string; label: string; hasta?: number };

function vigencias(ahora = Date.now(), fiesta?: Ocurrencia | null): Vigencia[] {
  const lista: Vigencia[] = [
    { id: 'hoy', label: 'Solo hoy', hasta: finDelDia(ahora) },
    { id: 'semana', label: '1 semana', hasta: finDelDia(ahora + 6 * DIA) },
  ];
  // Si el aviso es de una fiesta, lo natural es que dure hasta que la fiesta termine
  if (fiesta) lista.unshift({ id: 'fiesta', label: `Hasta que termine ${fiesta.f.corto} (${fechaCorta(fiesta.fin.getTime())})`, hasta: fiesta.fin.getTime() });
  const navidad = proxima(11, 24, new Date(ahora));
  const fin = proxima(11, 31, new Date(ahora));
  if (navidad - ahora <= 150 * DIA) lista.push({ id: 'dic24', label: 'Hasta el 24 de dic', hasta: navidad });
  if (fin - ahora <= 150 * DIA) lista.push({ id: 'dic31', label: 'Hasta el 31 de dic', hasta: fin });
  lista.push({ id: 'sin', label: 'Sin fecha límite' });
  return lista;
}

function plantilla(tipo: TipoAviso, producto: string) {
  const p = producto.toLowerCase();
  if (tipo === 'agotado') return p ? `Ya no hay ${p} por hoy.` : '';
  if (tipo === 'hay') return p ? `Ya hay ${p}.` : '';
  if (tipo === 'cerrado') return 'Cerrado por hoy.';
  return '';
}

const PLACEHOLDER: Partial<Record<TipoAviso, string>> = {
  promo: 'Ej. 2 kilos de pollo por $150 este fin de semana',
  regalo: 'Ej. Regalamos una cubeta en compras de $300 el 24 de diciembre',
  general: 'Ej. Mañana abrimos más tarde',
};

export default function PublicarAviso() {
  const params = useLocalSearchParams<{ tipo?: string; t?: string; fiesta?: string }>();
  const { s, negocio, publicarAviso, quitarAviso } = useStore();
  const propios = useMemo(() => s.productos.filter((p) => p.negocioId === negocio?.id), [s.productos, negocio?.id]);
  const nombres = propios.map((p) => p.nombre);

  const tipoLlegada = ORDEN_AVISOS.find((t) => t === params.tipo);
  const [tipo, setTipo] = useState<TipoAviso>(tipoLlegada ?? 'agotado');
  const [producto, setProducto] = useState(nombres[0] ?? '');
  const [mensaje, setMensaje] = useState(() => plantilla(tipoLlegada ?? 'agotado', nombres[0] ?? ''));
  const [ahora] = useState(() => new Date());
  const [fiestaId, setFiestaId] = useState<string | null>(() => (buscarFiesta(params.fiesta) ? (params.fiesta as string) : null));
  // La fecha de la fiesta elegida (null si la fiesta no tiene fecha fija)
  const ocurrencia = useMemo(() => {
    const f = buscarFiesta(fiestaId ?? undefined);
    return f ? proximaFiesta(f, ahora) : null;
  }, [fiestaId, ahora]);
  const opciones = vigencias(ahora.getTime(), ocurrencia);
  const [vig, setVig] = useState(() => (tipoLlegada === 'regalo' && vigencias().some((o) => o.id === 'dic24') ? 'dic24' : 'semana'));
  const [hecho, setHecho] = useState('');
  const [error, setError] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [quitando, setQuitando] = useState<string | null>(null);

  const elegirTipo = (t: TipoAviso) => {
    setTipo(t);
    setHecho('');
    setError('');
    setMensaje(plantilla(t, producto || nombres[0] || ''));
    if (ocurrencia && (t === 'promo' || t === 'regalo' || t === 'general')) setVig('fiesta');
    else if (t === 'regalo') setVig(opciones.some((o) => o.id === 'dic24') ? 'dic24' : 'semana');
    else setVig('semana');
  };

  /** Elegir una fiesta (o quitarla). */
  const elegirFiesta = (id: string | null) => {
    setFiestaId(id);
    setHecho('');
  };

  /** Una idea de fiesta llena el tipo, el mensaje y la vigencia; el comerciante puede cambiarlos. */
  const usarIdea = (idea: IdeaFiesta, f: Festividad, o: Ocurrencia | null) => {
    setFiestaId(f.id);
    setTipo(idea.tipo);
    setMensaje(idea.mensaje);
    setVig(o ? 'fiesta' : 'semana');
    setHecho('');
  };

  // Si ya estás en esta pantalla y tocas otro botón rápido del inicio, se cambia el tipo.
  const llegada = `${params.tipo ?? ''}|${params.t ?? ''}|${params.fiesta ?? ''}`;
  const [llegadaAtendida, setLlegadaAtendida] = useState(llegada);
  if (llegada !== llegadaAtendida) {
    setLlegadaAtendida(llegada);
    if (tipoLlegada) elegirTipo(tipoLlegada);
    if (buscarFiesta(params.fiesta)) setFiestaId(params.fiesta as string);
  }

  if (!negocio) return null;

  const usaProducto = (tipo === 'agotado' || tipo === 'hay') && propios.length > 0;
  const duracionLibre = tipo === 'promo' || tipo === 'regalo' || tipo === 'general';
  const hasta = duracionLibre ? opciones.find((o) => o.id === vig)?.hasta : undefined;
  // Solo los avisos de promoción, regalo u otro se marcan con la fiesta; "ya no hay" y "cerrado hoy" no
  const fiestaAviso = duracionLibre && fiestaId ? fiestaId : undefined;
  const activos = avisosVigentes(s.avisos.filter((a) => a.negocioId === negocio.id));

  async function publicar() {
    const texto = mensaje.trim();
    setHecho('');
    if (!texto) return setError('Escribe el mensaje del aviso.');
    const prod = propios.find((p) => p.nombre === (producto || nombres[0]));
    setError('');
    setPublicando(true);
    const err = await publicarAviso({ tipo, texto, productoId: usaProducto ? prod?.id : undefined, hasta, festividad: fiestaAviso });
    setPublicando(false);
    if (err) return setError(err);
    setHecho('Listo, tu aviso ya lo ven tus clientes.');
    setMensaje(plantilla(tipo, producto || nombres[0] || ''));
  }

  async function quitar(id: string) {
    setError('');
    setHecho('');
    setQuitando(id);
    const err = await quitarAviso(id);
    setQuitando(null);
    if (err) setError(err);
  }

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      <T size={24} weight={800} ls={-0.02}>
        Avisos
      </T>

      <SelectorFiestas giro={negocio.giro} ahora={ahora} elegida={fiestaId} onElegir={elegirFiesta} onIdea={usarIdea} />

      <View style={{ gap: 8 }}>
        <T size={14} weight={600}>
          {fiestaId ? 'Tu aviso' : 'O escribe un aviso'}
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ORDEN_AVISOS.map((t) => {
            const on = tipo === t;
            const i = TIPOS_AVISO[t];
            return (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => elegirTipo(t)}
                style={{
                  flexBasis: '48%',
                  flexGrow: 1,
                  height: 44,
                  borderRadius: 12,
                  borderWidth: on ? 2 : 1,
                  borderColor: on ? i.line : C.input,
                  backgroundColor: on ? i.tint : C.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T size={14} weight={on ? 700 : 600} color={on ? i.deep : C.ink}>
                  {i.boton}
                </T>
              </Pressable>
            );
          })}
        </View>
      </View>

      {usaProducto ? (
        <SelectField
          label="Producto"
          value={producto || nombres[0]}
          options={nombres}
          onChange={(p) => {
            setProducto(p);
            setError('');
            setMensaje(plantilla(tipo, p));
          }}
          h={48}
        />
      ) : null}
      {(tipo === 'agotado' || tipo === 'hay') && propios.length === 0 ? (
        <T size={13} lh={1.4} color={C.muted}>
          Aún no tienes productos publicados. Puedes escribir el aviso igual; para que cambie solo el «hay / agotado», agrega primero tus productos.
        </T>
      ) : null}

      {tipo === 'regalo' && !fiestaId ? (
        <View style={{ gap: 8 }}>
          <T size={14} weight={600}>
            Detalles que se acostumbran regalar
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REGALOS_SUGERIDOS.map((r) => (
              <Chip
                key={r}
                label={r}
                h={36}
                px={12}
                size={13}
                tone="green"
                border={C.input}
                onPress={() => setMensaje(`Regalamos ${r.toLowerCase()} a quienes compren en estas fechas.`)}
              />
            ))}
          </View>
          <T size={12} lh={1.4} color={C.muted}>
            Toca uno para llenar el mensaje y cámbialo como quieras (monto mínimo, fecha, etc.). Para regalos de una fiesta, como el Día de las Madres o Día de Muertos, elige la fiesta arriba y verás ideas para tu tipo de negocio.
          </T>
        </View>
      ) : null}

      <Field label="Mensaje" h={72} gap={6} multiline value={mensaje} onChangeText={(t) => { setMensaje(t); setHecho(''); setError(''); }} placeholder={PLACEHOLDER[tipo]} />

      {duracionLibre ? (
        <View style={{ gap: 8 }}>
          <T size={14} weight={600}>
            ¿Hasta cuándo vale?
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {opciones.map((o) => (
              <Chip key={o.id} label={o.label} h={38} px={14} size={13} tone="green" border={C.input} active={vig === o.id} onPress={() => setVig(o.id)} />
            ))}
          </View>
        </View>
      ) : (
        <T size={12} color={C.muted}>
          Este aviso se quita solo al terminar el día.
        </T>
      )}

      <View style={{ gap: 8 }}>
        <T size={13} weight={600} color={C.muted}>
          Así lo verán tus clientes
        </T>
        <View style={{ borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
          <AvisoFila a={{ tipo, texto: mensaje.trim() || 'Escribe tu mensaje…', negocio: negocio.nombre, hasta, festividad: fiestaAviso }} />
        </View>
      </View>

      <Btn label={publicando ? 'Publicando…' : 'Publicar aviso'} h={52} onPress={publicando ? undefined : publicar} />
      {error ? (
        <T size={14} weight={600} color={C.red} accessibilityRole="alert" style={{ textAlign: 'center' }}>
          {error}
        </T>
      ) : null}
      {hecho ? (
        <T size={14} weight={600} color={C.greenDark} style={{ textAlign: 'center' }}>
          {hecho}
        </T>
      ) : null}
      {usaProducto ? (
        <T size={13} color={C.muted} style={{ textAlign: 'center' }}>
          También marcará “{producto || nombres[0]}” como {tipo === 'agotado' ? 'agotado' : 'disponible'} en tus productos.
        </T>
      ) : null}

      <View style={{ gap: 10, marginTop: 8 }}>
        <T size={17} weight={700}>
          Avisos activos
        </T>
        {activos.length ? (
          <Group>
            {activos.map((a) => (
              <View key={a.id}>
                <AvisoFila a={{ ...a, negocio: negocio.nombre }} mostrarNegocio={false} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, marginTop: -4 }}>
                  <T size={12} color={C.muted}>
                    {a.hasta ? `Se quita el ${fechaCorta(a.hasta)}` : 'Sin fecha límite'}
                  </T>
                  <Pressable accessibilityRole="button" accessibilityLabel="Quitar este aviso" hitSlop={8} onPress={quitando === a.id ? undefined : () => quitar(a.id)}>
                    <T size={13} weight={700} color={C.red}>
                      {quitando === a.id ? 'Quitando…' : 'Quitar'}
                    </T>
                  </Pressable>
                </View>
              </View>
            ))}
          </Group>
        ) : (
          <T size={14} color={C.muted}>
            No tienes avisos activos.
          </T>
        )}
      </View>
    </Screen>
  );
}
