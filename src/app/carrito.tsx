import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { EntregaPedido, PagoPedido } from '../data/tipos';
import { cantidadTexto, dinero, disponibleParaPedir, importeLinea, minutosEnPalabras, pasoCantidad, totales } from '../lib/pedidos';
import { useStore } from '../store';
import { textoPrecio } from '../ui/bits';
import { Confirmar } from '../ui/Dialogo';
import { Icon } from '../ui/Icon';
import { BackBtn, Btn, Card, Chip, Field, goBack, Group, OpenDot, Screen } from '../ui/kit';
import { Logo } from '../ui/Logo';
import { Stepper } from '../ui/pedidos';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/** El carrito del cliente: revisa lo que lleva, elige cómo recibir y pagar, y aparta el pedido. */
export default function Carrito() {
  const { s, cuenta, carrito, ponerCantidad, quitarDelCarrito, vaciarCarrito, crearPedido } = useStore();
  const [entregaElegida, setEntrega] = useState<EntregaPedido>('recoger');
  const [pagoElegido, setPago] = useState<PagoPedido>('en_persona');
  const [direccion, setDireccion] = useState('');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  // Explicaciones que salen justo debajo de las opciones cuando se toca una que este negocio no ofrece.
  const [notaEntrega, setNotaEntrega] = useState('');
  const [notaPago, setNotaPago] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);

  const negocio = carrito?.negocio;
  // Si el negocio cambió sus opciones mientras tanto, se regresa a algo que sí ofrece.
  const entrega: EntregaPedido = negocio?.aDomicilio ? entregaElegida : 'recoger';
  const pago: PagoPedido = negocio?.aceptaTransferencia ? pagoElegido : 'en_persona';

  if (!carrito || !negocio) {
    return (
      <Screen bottomInset contentStyle={{ gap: 14, paddingBottom: 24 }}>
        <View style={{ paddingTop: 4, paddingLeft: 8 }}>
          <BackBtn />
        </View>
        <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingTop: 40 }}>
          <Icon name="cart" size={40} color={C.dash} />
          <T size={18} weight={800}>
            Tu carrito está vacío
          </T>
          <T size={14} lh={1.45} color={C.muted} style={{ textAlign: 'center' }}>
            Abre un negocio y toca «Agregar» en lo que quieras apartar.
          </T>
          <Btn label="Buscar negocios" h={46} r={12} size={15} style={{ alignSelf: 'stretch', marginTop: 8 }} onPress={() => router.replace('/cliente/buscar')} />
        </View>
      </Screen>
    );
  }

  const miTrato = cuenta ? s.frecuentes.find((f) => f.negocioId === negocio.id && f.clienteId === cuenta.id) : undefined;
  const conPrecio = carrito.lineas.flatMap((l) => (l.producto.precio != null ? [{ precio: l.producto.precio, cantidad: l.cantidad }] : []));
  const tot = totales(conPrecio, miTrato?.descuentoPct ?? 0);

  // Lo que hay que arreglar antes de apartar.
  const problemas = carrito.lineas.flatMap(({ producto: p, cantidad }) => {
    if (p.precio == null) return [{ id: p.id, texto: 'No tiene precio. Pregúntalo por el chat o quítalo.', quitar: true }];
    const tope = disponibleParaPedir(p);
    if (tope <= 0) return [{ id: p.id, texto: 'Ya no está disponible. Quítalo para continuar.', quitar: true }];
    if (cantidad > tope) return [{ id: p.id, texto: `Solo quedan ${cantidadTexto(tope)} ${p.unidad}. Baja la cantidad.`, quitar: false }];
    return [];
  });
  const problemaDe = (id: string) => problemas.find((x) => x.id === id);
  const cerrado = !negocio.abierto;
  const sinPedidos = !negocio.aceptaPedidos;
  const bloqueado = cerrado || sinPedidos || problemas.length > 0;
  // El botón de apartar SIEMPRE responde: si no se puede, dice por qué (antes se quedaba mudo).
  const motivoBloqueo = cerrado
    ? `«${negocio.nombre}» está cerrado por ahora. Tu carrito se queda guardado: podrás apartarlo cuando abra.`
    : sinPedidos
      ? `«${negocio.nombre}» no está recibiendo pedidos por ahora. Escríbele por el chat para preguntar cuándo.`
      : problemas.length > 0
        ? 'Hay productos marcados en rojo: quítalos o baja la cantidad y vuelve a tocar «Apartar pedido».'
        : '';

  async function apartar() {
    if (!negocio || enviando) return;
    if (bloqueado) return setError(motivoBloqueo);
    if (entrega === 'domicilio' && !direccion.trim()) return setError('Escribe a dónde lo llevamos.');
    setError('');
    setEnviando(true);
    const r = await crearPedido({ entrega, direccion, pago, nota });
    setEnviando(false);
    if ('error' in r) return setError(r.error);
    router.replace(`/pedido/${r.pedido.id}`);
  }

  const tiempo = minutosEnPalabras(negocio.apartadoMin);

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 20 }}>
        <BackBtn />
        <T size={18} weight={700} style={{ flex: 1 }}>
          Mi carrito
        </T>
        <Pressable accessibilityRole="button" onPress={() => setConfirmarVaciar(true)} hitSlop={10}>
          <T size={14} weight={600} color={C.red}>
            Vaciar
          </T>
        </Pressable>
      </View>

      <View style={{ gap: 16, paddingHorizontal: 20, paddingTop: 8 }}>
        <Pressable accessibilityRole="button" onPress={() => router.push(`/negocio/${negocio.id}`)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
            <Logo uri={negocio.logoUri} nombre={negocio.nombre} size={48} r={14} />
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
              <T size={16} weight={700} numberOfLines={1}>
                {negocio.nombre}
              </T>
              <T size={12} color={C.muted}>
                Toca para seguir agregando productos
              </T>
            </View>
            <OpenDot abierto={negocio.abierto} />
          </Card>
        </Pressable>

        {cerrado || sinPedidos ? (
          <Card style={{ gap: 4, padding: 14, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={14} weight={700} color={C.amberDeep}>
              {cerrado ? 'El negocio está cerrado por ahora' : 'El negocio no está recibiendo pedidos por ahora'}
            </T>
            <T size={13} lh={1.4} color={C.amberDeep}>
              Tu carrito se queda guardado. Cuando vuelva a recibir pedidos podrás apartarlo, o escríbele por el chat.
            </T>
          </Card>
        ) : null}

        <Group>
          {carrito.lineas.map(({ producto: p, cantidad }) => {
            const prob = problemaDe(p.id);
            return (
              <View key={p.id} style={{ gap: 8, paddingVertical: 12, paddingHorizontal: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <T size={15} weight={600}>
                      {p.nombre}
                    </T>
                    <T size={13} color={C.muted}>
                      {textoPrecio(p.precio, p.unidad)}
                    </T>
                  </View>
                  <T size={15} weight={700}>
                    {p.precio != null ? dinero(importeLinea(p.precio, cantidad)) : '—'}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Stepper
                    cantidad={cantidad}
                    etiqueta={p.nombre}
                    masDeshabilitado={cantidad >= disponibleParaPedir(p)}
                    onMenos={() => {
                      const r = ponerCantidad(p.id, cantidad - pasoCantidad(p.unidad));
                      setAviso(r ?? '');
                    }}
                    onMas={() => {
                      const r = ponerCantidad(p.id, cantidad + pasoCantidad(p.unidad));
                      setAviso(r ?? '');
                    }}
                  />
                  <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${p.nombre}`} onPress={() => quitarDelCarrito(p.id)} hitSlop={8}>
                    <T size={13} weight={600} color={C.red}>
                      Quitar
                    </T>
                  </Pressable>
                </View>
                {prob ? (
                  <T size={12} weight={600} color={C.red}>
                    {prob.texto}
                  </T>
                ) : null}
              </View>
            );
          })}
        </Group>
        {aviso ? (
          <T size={13} weight={600} color={C.amberText} accessibilityRole="alert">
            {aviso}
          </T>
        ) : null}

        <Card style={{ gap: 12, padding: 16 }}>
          <T size={16} weight={700}>
            ¿Cómo lo quieres?
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip
              label="Paso a recogerlo"
              tone="green"
              marca
              h={44}
              active={entrega === 'recoger'}
              onPress={() => {
                setEntrega('recoger');
                setNotaEntrega('');
                setError('');
              }}
            />
            <Chip
              label="A domicilio"
              tone="green"
              marca
              h={44}
              active={entrega === 'domicilio'}
              apagado={!negocio.aDomicilio}
              pista={negocio.aDomicilio ? undefined : 'Este negocio no hace entregas a domicilio por ahora'}
              onPress={() => {
                if (!negocio.aDomicilio) {
                  setNotaEntrega(`«${negocio.nombre}» todavía no hace entregas a domicilio. Puedes pasar a recogerlo, o preguntarle por el chat si puede llevártelo.`);
                  return;
                }
                setEntrega('domicilio');
                setNotaEntrega('');
                setError('');
              }}
            />
          </View>
          {notaEntrega ? (
            <View style={{ gap: 6 }}>
              <T size={13} lh={1.4} weight={600} color={C.amberText} accessibilityRole="alert">
                {notaEntrega}
              </T>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/chat-negocio/${negocio.id}`)} hitSlop={8}>
                <T size={13} weight={700} color={C.greenDark}>
                  Preguntar por el chat
                </T>
              </Pressable>
            </View>
          ) : null}
          {entrega === 'domicilio' ? (
            <Field
              label="¿A dónde lo llevamos?"
              placeholder="Calle, número y una referencia"
              value={direccion}
              onChangeText={(t) => {
                setDireccion(t);
                setError('');
              }}
              multiline
              h={64}
              maxLength={300}
            />
          ) : null}
          {entrega === 'domicilio' && negocio.zonaEntrega ? (
            <T size={12} color={C.muted}>
              Entrega en: {negocio.zonaEntrega}
            </T>
          ) : null}
          {!negocio.aDomicilio && !notaEntrega ? (
            <T size={12} color={C.muted}>
              Este negocio no hace entregas a domicilio por ahora: pasas a recogerlo.
            </T>
          ) : null}
        </Card>

        <Card style={{ gap: 12, padding: 16 }}>
          <T size={16} weight={700}>
            ¿Cómo pagas?
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip
              label={entrega === 'domicilio' ? 'En persona, al recibir' : 'En persona, al recoger'}
              tone="green"
              marca
              h={44}
              active={pago === 'en_persona'}
              onPress={() => {
                setPago('en_persona');
                setNotaPago('');
              }}
            />
            <Chip
              label="Transferencia"
              tone="green"
              marca
              h={44}
              active={pago === 'transferencia'}
              apagado={!negocio.aceptaTransferencia}
              pista={negocio.aceptaTransferencia ? undefined : 'Este negocio no acepta transferencia por ahora'}
              onPress={() => {
                if (!negocio.aceptaTransferencia) {
                  setNotaPago(`«${negocio.nombre}» todavía no acepta pago por transferencia: puedes pagar en persona.`);
                  return;
                }
                setPago('transferencia');
                setNotaPago('');
              }}
            />
          </View>
          {notaPago ? (
            <T size={13} lh={1.4} weight={600} color={C.amberText} accessibilityRole="alert">
              {notaPago}
            </T>
          ) : null}
          <T size={12} lh={1.45} color={C.muted}>
            {pago === 'transferencia'
              ? 'Cuando el negocio acepte tu pedido te mostramos sus datos para transferir. Después tocas «Ya pagué» y el negocio lo confirma. Mientras tu pago no se confirme, el tiempo de apartado sigue corriendo.'
              : `Pagas ${entrega === 'domicilio' ? 'cuando te llega' : 'cuando pasas por él'}. No se cobra nada dentro de la app.`}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="lock" size={13} color={C.dash} />
            <T size={12} color={C.dash}>
              Pago con tarjeta en línea: próximamente.
            </T>
          </View>
        </Card>

        <Field
          label="Nota para el negocio (opcional)"
          placeholder="Ej. Sin hueso, por favor"
          value={nota}
          onChangeText={setNota}
          multiline
          h={56}
          maxLength={500}
        />

        <Card style={{ gap: 8, padding: 16 }}>
          <Fila texto="Subtotal" valor={dinero(tot.subtotal)} />
          {miTrato && miTrato.descuentoPct > 0 ? <Fila texto={`⭐ Cliente frecuente (${miTrato.descuentoPct}%)`} valor={`-${dinero(tot.descuento)}`} color={C.greenDark} /> : null}
          <View style={{ height: 1, backgroundColor: C.line }} />
          <Fila texto="Total" valor={dinero(tot.total)} fuerte />
          {miTrato?.beneficio ? (
            <T size={13} lh={1.4} color={C.amberText}>
              🎁 Tu beneficio: {miTrato.beneficio}
            </T>
          ) : null}
        </Card>

        <Card style={{ gap: 6, padding: 14, backgroundColor: C.greenTint, borderColor: C.green }}>
          <T size={13} weight={700} color={C.greenDark}>
            Cómo funciona el apartado
          </T>
          <T size={12} lh={1.45} color={C.greenDark}>
            {`Apartamos tus productos por ${tiempo}: nadie más puede pedir esas existencias mientras tanto. El negocio tiene que aceptar tu pedido; si no responde o no lo recoges a tiempo, se libera solo para que otra persona lo compre. Si dejas pedidos sin recoger, el negocio puede pedirte pagar por adelantado.`}
          </T>
        </Card>

        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
        <Btn
          label={enviando ? 'Apartando…' : problemas.length > 0 ? 'Revisa los productos marcados' : `Apartar pedido · ${dinero(tot.total)}`}
          variant={bloqueado ? 'outline' : 'primary'}
          onPress={enviando ? undefined : apartar}
        />
      </View>

      <Confirmar
        visible={confirmarVaciar}
        titulo="¿Vaciar el carrito?"
        texto="Se quitan todos los productos. No se pierde nada del negocio."
        confirmar="Vaciar"
        peligro
        onCancelar={() => setConfirmarVaciar(false)}
        onConfirmar={() => {
          setConfirmarVaciar(false);
          vaciarCarrito();
          goBack('/cliente');
        }}
      />
    </Screen>
  );
}

function Fila({ texto, valor, fuerte = false, color = C.ink }: { texto: string; valor: string; fuerte?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <T size={fuerte ? 17 : 14} weight={fuerte ? 800 : 500} color={color} style={{ flex: 1 }}>
        {texto}
      </T>
      <T size={fuerte ? 19 : 14} weight={fuerte ? 800 : 600} color={color}>
        {valor}
      </T>
    </View>
  );
}
