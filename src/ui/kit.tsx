import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { C, FONT, Tono, TONO } from './theme';
import { T } from './T';
import { Icon } from './Icon';

/* ───────── utilidades ───────── */

export function goBack(fallback: string = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/* ───────── pantalla base ───────── */

export function Screen({
  children,
  scroll = true,
  bg = C.bg,
  light = false,
  contentStyle,
  bottomInset = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bg?: string;
  light?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** añade el margen inferior del sistema (pantallas sin barra de pestañas) */
  bottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top, paddingBottom: bottomInset ? insets.bottom : 0 };
  const inner = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ flexGrow: 1 }, pad, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar style={light ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {inner}
      </KeyboardAvoidingView>
    </View>
  );
}

/* ───────── botones y chips ───────── */

type Variant = 'primary' | 'amber' | 'outline' | 'outlineWhite' | 'danger' | 'white';

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string; bw?: number }> = {
  primary: { bg: C.green, fg: C.white },
  amber: { bg: C.amber, fg: C.ink },
  outline: { bg: C.white, fg: C.ink, border: C.input },
  outlineWhite: { bg: 'transparent', fg: C.white, border: C.white, bw: 1.5 },
  danger: { bg: C.white, fg: C.red, border: C.redLine },
  white: { bg: C.white, fg: C.ink },
};

export function Btn({
  label,
  onPress,
  variant = 'primary',
  h = 54,
  r = 14,
  size = 16,
  weight = 700,
  flex,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  h?: number;
  r?: number;
  size?: number;
  weight?: 600 | 700;
  flex?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: h,
          borderRadius: r,
          backgroundColor: v.bg,
          borderWidth: v.border ? (v.bw ?? 1) : 0,
          borderColor: v.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          flex,
        },
        style,
      ]}
    >
      <T size={size} weight={weight} color={v.fg}>
        {label}
      </T>
    </Pressable>
  );
}

/**
 * Opción para elegir (filtros, entrega, pago…). Siempre responde al toque:
 *  · se hunde un poco al tocarla, para que se note que sí registró el toque;
 *  · `apagado` = la opción existe pero no está disponible ahora (se ve atenuada); el toque sigue llegando a `onPress`
 *    para que la pantalla explique POR QUÉ no se puede, en lugar de quedarse callada.
 */
export function Chip({
  label,
  active,
  onPress,
  h = 40,
  px = 16,
  size = 14,
  tone = 'ink',
  border = C.line,
  apagado = false,
  pista,
  marca = false,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  h?: number;
  px?: number;
  size?: number;
  tone?: 'ink' | 'green';
  border?: string;
  apagado?: boolean;
  /** Texto para lectores de pantalla (por ejemplo, por qué está apagada). */
  pista?: string;
  /** Muestra una palomita «✓» cuando está elegida (para opciones que se eligen una u otra). */
  marca?: boolean;
}) {
  const on = tone === 'green' ? C.green : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityHint={pista}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        height: h,
        paddingHorizontal: px,
        borderRadius: h / 2,
        backgroundColor: active && !apagado ? on : C.white,
        borderWidth: active && !apagado ? 0 : 1,
        borderStyle: apagado ? 'dashed' : 'solid',
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : apagado ? 0.6 : 1,
      })}
    >
      <T size={size} weight={600} color={active && !apagado ? C.white : apagado ? C.muted : C.ink}>
        {marca && active && !apagado ? `✓ ${label}` : label}
      </T>
    </Pressable>
  );
}

export function Badge({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: bg }}>
      <T size={12} weight={700} color={fg}>
        {children}
      </T>
    </View>
  );
}

export function Tag({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, backgroundColor: bg }}>
      <T size={12} weight={600} color={fg}>
        {children}
      </T>
    </View>
  );
}

export function Toggle({
  value,
  onChange,
  big = false,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  big?: boolean;
  label: string;
}) {
  const w = big ? 60 : 52;
  const h = big ? 34 : 30;
  const k = big ? 28 : 24;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        backgroundColor: value ? C.green : C.off,
        padding: 3,
        justifyContent: 'center',
        alignItems: value ? 'flex-end' : 'flex-start',
      }}
    >
      <View style={{ width: k, height: k, borderRadius: k / 2, backgroundColor: C.white }} />
    </Pressable>
  );
}

/* ───────── formularios ───────── */

export function Field({
  label,
  h = 52,
  gap = 8,
  multiline,
  ...rest
}: { label: string; h?: number; gap?: number } & TextInputProps) {
  return (
    <View style={{ gap, minWidth: 0 }}>
      <T size={14} weight={600}>
        {label}
      </T>
      <TextInput
        {...rest}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={C.placeholder}
        style={{
          height: multiline ? undefined : h,
          minHeight: multiline ? h : undefined,
          paddingHorizontal: 16,
          paddingVertical: multiline ? 14 : 0,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.input,
          backgroundColor: C.white,
          fontFamily: FONT[400],
          fontSize: 15,
          color: C.ink,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  h = 50,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  h?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6, minWidth: 0 }}>
      <T size={14} weight={600}>
        {label}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={() => setOpen(true)}
        style={{
          height: h,
          paddingHorizontal: 14,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: C.input,
          backgroundColor: C.white,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <T size={15} style={{ flexShrink: 1 }} numberOfLines={1}>
          {value}
        </T>
        <Icon name="down" size={18} color={C.muted} />
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(26,31,28,0.45)', justifyContent: 'center', padding: 28 }}
        >
          <View style={{ backgroundColor: C.white, borderRadius: 18, overflow: 'hidden', maxHeight: '70%' }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: C.line }}>
              <T size={16} weight={700}>
                {label}
              </T>
            </View>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o}
                  onPress={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  style={{
                    minHeight: 52,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: C.line,
                  }}
                >
                  <T size={15} weight={o === value ? 700 : 500}>
                    {o}
                  </T>
                  {o === value && <Icon name="check" size={20} color={C.green} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ───────── contenedores ───────── */

/** Lista con separadores entre filas, como los grupos del diseño. */
export function Group({
  children,
  r = 16,
  style,
}: {
  children: React.ReactNode;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View
      style={[
        { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: r, overflow: 'hidden' },
        style,
      ]}
    >
      {items.map((c, i) => (
        <View
          key={i}
          style={i < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: C.line } : undefined}
        >
          {c}
        </View>
      ))}
    </View>
  );
}

export function Card({
  children,
  r = 18,
  style,
}: {
  children: React.ReactNode;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: r }, style]}>
      {children}
    </View>
  );
}

export function BackBtn({ onPress, color = C.ink }: { onPress?: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Regresar"
      onPress={onPress ?? (() => goBack())}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="back" size={24} color={color} />
    </Pressable>
  );
}

export function OpenDot({ abierto, size = 12, abiertoLabel = 'Abierto' }: { abierto: boolean; size?: number; abiertoLabel?: string }) {
  const color = abierto ? C.green : C.muted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <T size={size} weight={700} color={color}>
        {abierto ? abiertoLabel : 'Cerrado'}
      </T>
    </View>
  );
}

/** Bloque de color con la palabra "Foto" (marcador de imagen). */
export function Foto({
  tono = 'verde',
  size = 72,
  r = 14,
  label = 'Foto',
  fontSize = 11,
}: {
  tono?: Tono;
  size?: number;
  r?: number;
  label?: string;
  fontSize?: number;
}) {
  const t = TONO[tono];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {label ? (
        <T size={fontSize} weight={600} color={t.fg}>
          {label}
        </T>
      ) : null}
    </View>
  );
}

export function Block({ size, r, bg }: { size: number; r: number; bg: string }) {
  return <View style={{ width: size, height: size, borderRadius: r, backgroundColor: bg, flexShrink: 0 }} />;
}

export function SectionTitle({
  title,
  link,
  onLink,
}: {
  title: string;
  link?: string;
  onLink?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <T size={17} weight={700}>
        {title}
      </T>
      {link ? (
        <Pressable accessibilityRole="link" onPress={onLink} hitSlop={10}>
          <T size={14} weight={600} color={C.green}>
            {link}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}
