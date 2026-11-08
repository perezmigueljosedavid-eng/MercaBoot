import React, { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import type { Pedido } from '../data/tipos';
import { cantidadTexto, dinero, esActivo, etiquetaEstado, textoPago, tiempoRestante } from '../lib/pedidos';
import { useAhora } from '../lib/usarAhora';
import { haceCuanto } from './bits';
import { Icon } from './Icon';
import { Btn, Card, Tag } from './kit';
import { T } from './T';
import { C, FONT, TONO } from './theme';

/** Piezas que se usan en el carrito, en los pedidos y en el chat. */

/** Etiqueta con el estado del pedido («Esperando respuesta», «Listo para recoger»…). */
export function EstadoTag({ p }: { p: Pick<Pedido, 'estado' | 'entrega'> }) {
  const e = etiquetaEstado(p);
  const t = TONO[e.tono];
  return (
    <Tag bg={t.bg} fg={t.fg}>
      {e.label}
    </Tag>
  );
}

/** «Quedan 24 min»: cuenta regresiva hasta que se libera el pedido (solo mientras sigue activo y con tiempo). */
export function Contador({ p, compacto = false }: { p: Pedido; compacto?: boolean }) {
  const corre = !!p.venceEn && esActivo(p);
  const ahora = useAhora(15, corre);
  if (!p.venceEn || !corre) return null;
  const falta = p.venceEn - ahora;
  const urgente = falta < 10 * 60000;
  const color = urgente ? C.red : C.amberText;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Icon name="clock" size={compacto ? 13 : 15} color={color} />
      <T size={compacto ? 12 : 13} weight={700} color={color}>
        {falta <= 0 ? 'Venciendo…' : `Quedan ${tiempoRestante(p.venceEn, ahora)}`}
      </T>
    </View>
  );
}

/** Botones − y + con la cantidad en medio. */
export function Stepper({
  cantidad,
  etiqueta,
  onMenos,
  onMas,
  masDeshabilitado = false,
  chico = false,
}: {
  cantidad: number;
  etiqueta: string;
  onMenos: () => void;
  onMas: () => void;
  masDeshabilitado?: boolean;
  chico?: boolean;
}) {
  const lado = chico ? 34 : 40;
  const boton = (icono: 'minus' | 'plus', accion: () => void, texto: string, apagado = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityHint={apagado ? 'Ya no hay más disponibles; al tocarlo te explica cuántos quedan' : undefined}
      // «Apagado» solo cambia el color: al tocarlo el botón responde y explica por qué no sube (nunca queda mudo).
      onPress={accion}
      style={{
        width: lado,
        height: lado,
        borderRadius: lado / 2,
        backgroundColor: apagado ? C.grey : C.greenTint,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icono} size={chico ? 16 : 18} color={apagado ? C.off : C.green} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {boton('minus', onMenos, `Quitar uno de ${etiqueta}`)}
      <T size={15} weight={700} style={{ minWidth: 30, textAlign: 'center' }}>
        {cantidadTexto(cantidad)}
      </T>
      {boton('plus', onMas, `Agregar uno de ${etiqueta}`, masDeshabilitado)}
    </View>
  );
}

/**
 * Resumen de un pedido para las listas. `quien` es quien mira: el cliente ve el nombre del negocio;
 * el comerciante, el del cliente. Lo que se ponga dentro (`children`) va abajo, por ejemplo los botones.
 */
export function PedidoCard({
  p,
  quien,
  nombre,
  onPress,
  children,
}: {
  p: Pedido;
  quien: 'cliente' | 'comerciante';
  nombre: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const activo = esActivo(p);
  return (
    <Card style={{ gap: 10, padding: 14 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Pedido ${p.codigo} de ${nombre}`}
        onPress={onPress}
        style={{ gap: 8 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <T size={13} weight={800} color={C.muted} ls={0.02}>
            {p.codigo}
          </T>
          <EstadoTag p={p} />
        </View>
        <T size={16} weight={700} numberOfLines={1}>
          {nombre}
        </T>
        <T size={13} color={C.greyText}>
          {p.items} {p.items === 1 ? 'producto' : 'productos'} · {dinero(p.total)}
          {p.descuentoPct > 0 ? ` (${p.descuentoPct}% de descuento)` : ''} · {p.entrega === 'domicilio' ? 'A domicilio' : 'Para recoger'}
        </T>
        {activo ? (
          <>
            <T size={12} color={C.muted}>
              {textoPago(p, quien)}
            </T>
            <Contador p={p} compacto />
          </>
        ) : (
          <T size={12} color={C.muted}>
            {p.motivo ? `${p.motivo} · ` : ''}
            {haceCuanto(p.actualizado)}
          </T>
        )}
      </Pressable>
      {children}
    </Card>
  );
}

/** Ventana que pide un texto (el motivo de una cancelación, la referencia de un pago…). */
export function PedirTexto({
  visible,
  titulo,
  texto,
  etiqueta,
  placeholder,
  obligatorio = false,
  confirmar = 'Enviar',
  peligro = false,
  onConfirmar,
  onCancelar,
}: {
  visible: boolean;
  titulo: string;
  texto?: string;
  etiqueta: string;
  placeholder?: string;
  obligatorio?: boolean;
  confirmar?: string;
  peligro?: boolean;
  onConfirmar: (valor: string) => void;
  onCancelar: () => void;
}) {
  // El contenido está en otro componente: la ventana lo monta al abrirse, así el texto empieza vacío cada vez.
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancelar}>
      <Pressable onPress={onCancelar} style={{ flex: 1, backgroundColor: 'rgba(26,31,28,0.45)', justifyContent: 'center', padding: 28 }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: C.white, borderRadius: 20, padding: 20, gap: 12 }}>
          <CuerpoPedirTexto
            titulo={titulo}
            texto={texto}
            etiqueta={etiqueta}
            placeholder={placeholder}
            obligatorio={obligatorio}
            confirmar={confirmar}
            peligro={peligro}
            onConfirmar={onConfirmar}
            onCancelar={onCancelar}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CuerpoPedirTexto({
  titulo,
  texto,
  etiqueta,
  placeholder,
  obligatorio,
  confirmar,
  peligro,
  onConfirmar,
  onCancelar,
}: Omit<React.ComponentProps<typeof PedirTexto>, 'visible'>) {
  const [valor, setValor] = useState('');
  const [aviso, setAviso] = useState('');
  return (
    <>
      <T size={18} weight={800} lh={1.3}>
        {titulo}
      </T>
      {texto ? (
        <T size={14} color={C.muted} lh={1.45}>
          {texto}
        </T>
      ) : null}
      <TextInput
        value={valor}
        onChangeText={(t) => {
          setValor(t);
          setAviso('');
        }}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        accessibilityLabel={etiqueta}
        multiline
        maxLength={300}
        style={{
          minHeight: 74,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.input,
          backgroundColor: C.white,
          fontFamily: FONT[400],
          fontSize: 15,
          color: C.ink,
          textAlignVertical: 'top',
        }}
      />
      {aviso ? (
        <T size={13} weight={600} color={C.red}>
          {aviso}
        </T>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
        <Btn label="Cerrar" variant="outline" h={46} r={12} size={15} flex={1} onPress={onCancelar} />
        <Btn
          label={confirmar ?? 'Enviar'}
          variant={peligro ? 'danger' : 'primary'}
          h={46}
          r={12}
          size={15}
          flex={1}
          onPress={() => {
            if (obligatorio && !valor.trim()) return setAviso('Escribe una respuesta.');
            onConfirmar(valor.trim());
          }}
        />
      </View>
    </>
  );
}
