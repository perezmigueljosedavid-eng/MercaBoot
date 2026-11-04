import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { ClienteFrecuente } from '../data/tipos';
import { dinero } from '../lib/pedidos';
import { useStore } from '../store';
import { haceCuanto } from '../ui/bits';
import { Confirmar } from '../ui/Dialogo';
import { BackBtn, Btn, Card, Chip, Field, Screen, Tag } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

interface Cliente {
  id: string;
  nombre: string;
  entregados: number;
  gastado: number;
  sinRecoger: number;
  ultimo: number;
  conversacion?: string;
}

const DESCUENTOS = [0, 5, 10, 15, 20, 25, 30, 40, 50];
const IDEAS = ['Un regalo en tu próxima compra', 'Cupón de $20 para tu siguiente pedido', 'Producto de cortesía', 'Entrega a domicilio gratis'];

/** Los clientes del negocio. El comerciante decide quién es «cliente frecuente» y qué beneficio recibe (descuento, regalo, cupón…). */
export default function Clientes() {
  const { cliente: abrirParam } = useLocalSearchParams<{ cliente?: string }>();
  const { s, negocio } = useStore();
  const [vista, setVista] = useState<'frecuentes' | 'todos' | null>(null);
  // Si se llegó desde un pedido o un chat, la ventana de esa persona se abre sola.
  const [editandoId, setEditandoId] = useState<string | null>(typeof abrirParam === 'string' ? abrirParam : null);

  const frecuentes = useMemo(() => s.frecuentes.filter((f) => f.negocioId === negocio?.id), [s.frecuentes, negocio]);

  // Todas las personas que han tenido trato con el negocio (por chat o por pedido).
  const clientes = useMemo(() => {
    const mapa = new Map<string, Cliente>();
    const de = (id: string, nombre: string): Cliente => {
      let c = mapa.get(id);
      if (!c) {
        c = { id, nombre, entregados: 0, gastado: 0, sinRecoger: 0, ultimo: 0 };
        mapa.set(id, c);
      }
      return c;
    };
    if (!negocio) return [];
    for (const v of s.conversaciones) {
      if (v.negocioId !== negocio.id) continue;
      const c = de(v.clienteId, v.clienteNombre);
      c.conversacion = v.id;
      c.ultimo = Math.max(c.ultimo, v.ultimoEn ?? v.creado);
    }
    for (const p of s.pedidos) {
      if (p.negocioId !== negocio.id) continue;
      const c = de(p.clienteId, p.clienteNombre);
      c.nombre = p.clienteNombre;
      c.ultimo = Math.max(c.ultimo, p.actualizado);
      if (p.estado === 'completado') {
        c.entregados += 1;
        c.gastado += p.total;
      }
      if (p.estado === 'no_se_presento') c.sinRecoger += 1;
    }
    for (const f of frecuentes) de(f.clienteId, f.clienteNombre);
    return [...mapa.values()];
  }, [s.conversaciones, s.pedidos, frecuentes, negocio]);

  const esFrecuente = (id: string) => frecuentes.find((f) => f.clienteId === id);
  const mostrar: 'frecuentes' | 'todos' = vista ?? (frecuentes.length > 0 ? 'frecuentes' : 'todos');
  const lista = clientes
    .filter((c) => (mostrar === 'frecuentes' ? !!esFrecuente(c.id) : true))
    .sort((a, b) => Number(!!esFrecuente(b.id)) - Number(!!esFrecuente(a.id)) || b.entregados - a.entregados || b.ultimo - a.ultimo);
  const editando = editandoId ? clientes.find((c) => c.id === editandoId) : undefined;

  if (!negocio) return null;

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 20 }}>
        <BackBtn />
        <T size={18} weight={700}>
          Clientes frecuentes
        </T>
      </View>

      <View style={{ gap: 14, paddingHorizontal: 20, paddingTop: 8 }}>
        <Card style={{ gap: 6, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
          <T size={14} weight={700} color={C.amberDeep}>
            Tú decides quién es cliente frecuente
          </T>
          <T size={13} lh={1.45} color={C.amberDeep}>
            Premia a quienes te compran seguido: un descuento que se aplica solo en sus pedidos, y/o un beneficio (un regalo, un cupón…). Al nombrarlo le llega un aviso por el chat.
          </T>
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label={`Frecuentes (${frecuentes.length})`} h={38} px={14} size={13} tone="green" active={mostrar === 'frecuentes'} onPress={() => setVista('frecuentes')} />
          <Chip label={`Todos mis clientes (${clientes.length})`} h={38} px={14} size={13} tone="green" active={mostrar === 'todos'} onPress={() => setVista('todos')} />
        </View>

        {lista.length === 0 ? (
          <Card style={{ padding: 20, gap: 6 }}>
            <T size={16} weight={700}>
              {mostrar === 'frecuentes' ? 'Aún no tienes clientes frecuentes' : 'Todavía no tienes clientes'}
            </T>
            <T size={14} lh={1.45} color={C.muted}>
              {mostrar === 'frecuentes'
                ? 'Entra a «Todos mis clientes» y toca «Nombrar frecuente» en quien te compre seguido.'
                : 'Aquí aparecen las personas que te escriben por el chat o te hacen un pedido.'}
            </T>
          </Card>
        ) : (
          lista.map((c) => {
            const f = esFrecuente(c.id);
            return (
              <Card key={c.id} style={{ gap: 10, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <T size={16} weight={700} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {c.nombre}
                  </T>
                  {f ? (
                    <Tag bg={C.amberTint} fg={C.amberText}>
                      ⭐ {f.descuentoPct > 0 ? `${f.descuentoPct}%` : 'Frecuente'}
                    </Tag>
                  ) : null}
                </View>
                {f?.beneficio ? (
                  <T size={13} color={C.amberText}>
                    🎁 {f.beneficio}
                  </T>
                ) : null}
                <T size={12} color={C.muted}>
                  {c.entregados} {c.entregados === 1 ? 'pedido entregado' : 'pedidos entregados'}
                  {c.gastado > 0 ? ` · ${dinero(c.gastado)}` : ''}
                  {c.ultimo ? ` · ${haceCuanto(c.ultimo)}` : ''}
                </T>
                {c.sinRecoger > 0 ? (
                  <T size={12} weight={600} color={C.red}>
                    ⚠ {c.sinRecoger} {c.sinRecoger === 1 ? 'pedido sin recoger' : 'pedidos sin recoger'}
                  </T>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Btn label={f ? 'Cambiar' : 'Nombrar frecuente'} variant={f ? 'outline' : 'primary'} h={42} r={12} size={14} flex={1} onPress={() => setEditandoId(c.id)} />
                  {c.conversacion ? (
                    <Btn label="Chatear" variant="outline" h={42} r={12} size={14} flex={1} onPress={() => router.push(`/chat-cliente/${c.conversacion}`)} />
                  ) : null}
                </View>
              </Card>
            );
          })
        )}
      </View>

      {editando ? <Editor key={editando.id} c={editando} f={esFrecuente(editando.id)} onCerrar={() => setEditandoId(null)} /> : null}
    </Screen>
  );
}

/** Ventana para nombrar (o cambiar el trato de) un cliente frecuente. Nace con los datos de esa persona, así que no necesita efectos. */
function Editor({ c, f, onCerrar }: { c: Cliente; f?: ClienteFrecuente; onCerrar: () => void }) {
  const { marcarFrecuente, quitarFrecuente } = useStore();
  const [pct, setPct] = useState(f ? f.descuentoPct : 10);
  const [beneficio, setBeneficio] = useState(f?.beneficio ?? '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [quitar, setQuitar] = useState(false);

  async function guardar() {
    if (pct === 0 && !beneficio.trim()) return setError('Ponle un descuento o escribe el beneficio que le das (por ejemplo, un regalo o un cupón).');
    setGuardando(true);
    const err = await marcarFrecuente(c.id, pct, beneficio);
    setGuardando(false);
    if (err) return setError(err);
    onCerrar();
  }

  return (
    <>
      <Modal transparent animationType="fade" visible={!quitar} onRequestClose={onCerrar}>
        <Pressable onPress={onCerrar} style={{ flex: 1, backgroundColor: 'rgba(26,31,28,0.45)', justifyContent: 'center', padding: 20 }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: C.white, borderRadius: 20, maxHeight: '92%' }}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
              <T size={18} weight={800} lh={1.3}>
                {f ? 'Cambiar el trato de' : 'Nombrar cliente frecuente a'} {c.nombre}
              </T>
              <View style={{ gap: 8 }}>
                <T size={14} weight={600}>
                  Descuento en sus pedidos
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {DESCUENTOS.map((d) => (
                    <Chip
                      key={d}
                      label={d === 0 ? 'Sin descuento' : `${d}%`}
                      h={36}
                      px={12}
                      size={13}
                      tone="green"
                      active={pct === d}
                      onPress={() => {
                        setPct(d);
                        setError('');
                      }}
                    />
                  ))}
                </View>
              </View>
              <Field
                label="Beneficio (opcional)"
                placeholder="Ej. Una tortilla extra de regalo"
                value={beneficio}
                onChangeText={(t) => {
                  setBeneficio(t);
                  setError('');
                }}
                multiline
                h={56}
                maxLength={200}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {IDEAS.map((i) => (
                  <Chip
                    key={i}
                    label={i}
                    h={32}
                    px={10}
                    size={12}
                    border={C.input}
                    onPress={() => {
                      setBeneficio(i);
                      setError('');
                    }}
                  />
                ))}
              </View>
              <T size={12} lh={1.4} color={C.muted}>
                El descuento se aplica solo en sus pedidos de la app. El beneficio aparece en su pedido para que se lo des al entregarlo.
              </T>
              {error ? (
                <T size={13} weight={600} color={C.red} accessibilityRole="alert">
                  {error}
                </T>
              ) : null}
              <View style={{ gap: 8 }}>
                <Btn label={guardando ? 'Guardando…' : 'Guardar'} h={48} onPress={guardando ? undefined : guardar} />
                {f ? <Btn label="Quitar trato de frecuente" variant="danger" h={46} onPress={() => setQuitar(true)} /> : null}
                <Btn label="Cerrar" variant="outline" h={46} onPress={onCerrar} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Confirmar
        visible={quitar}
        titulo="¿Quitar el trato de frecuente?"
        texto={`${c.nombre} dejará de tener su descuento y su beneficio. No se le avisa.`}
        confirmar="Quitar"
        peligro
        onCancelar={() => setQuitar(false)}
        onConfirmar={async () => {
          setQuitar(false);
          const err = await quitarFrecuente(c.id);
          if (err) return setError(err);
          onCerrar();
        }}
      />
    </>
  );
}
