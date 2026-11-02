import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { GIROS } from '../data/contenido';
import { DONDE_PEDIR_CODIGO } from '../data/reclamo';
import type { AltaNegocio } from '../store';
import { useStore } from '../store';
import { Confirmar } from './Dialogo';
import { GiroCampo } from './GiroCampo';
import { Icon } from './Icon';
import { Card, Field } from './kit';
import { Logo } from './Logo';
import { T } from './T';
import { C } from './theme';

type ModoNegocio = 'directorio' | 'nuevo';

/**
 * Datos del negocio de una persona: reclamar uno que ya aparece en la lista de la comunidad o crear uno nuevo.
 * Lo usan el registro (comerciante nuevo) y «Abrir mi negocio» (cliente que también quiere vender).
 */
export function useNegocioForm(reclamarId?: string) {
  const { s } = useStore();
  const libres = useMemo(() => s.negocios.filter((n) => !n.duenoId), [s.negocios]);
  const [modo, setModo] = useState<ModoNegocio>(libres.length ? 'directorio' : 'nuevo');
  const [elegido, setElegido] = useState<string | null>(libres.some((n) => n.id === reclamarId) ? (reclamarId as string) : null);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [giro, setGiro] = useState(GIROS[0].nombre);
  const [direccion, setDireccion] = useState('');

  /** Elige un negocio de la lista (o ninguno). Cambiar de negocio borra el código escrito para el anterior. */
  function elegir(id: string | null) {
    setElegido(id);
    setCodigo('');
  }

  const negocioElegido = libres.find((n) => n.id === elegido) ?? null;

  /** El negocio listo para guardar, o el mensaje de lo que falta. */
  function validar(): { alta: AltaNegocio } | { error: string } {
    if (modo === 'directorio' && libres.length) {
      if (!negocioElegido) return { error: 'Toca el negocio que es tuyo, o elige «Mi negocio es nuevo».' };
      if (!codigo.trim()) return { error: `Escribe el código de reclamo de «${negocioElegido.nombre}». Si eres su dueño, pídelo ${DONDE_PEDIR_CODIGO}.` };
      return { alta: { reclamarId: negocioElegido.id, codigo } };
    }
    if (!nombre.trim()) return { error: 'Escribe el nombre de tu negocio.' };
    if (!giro.trim()) return { error: 'Escribe qué tipo de negocio es.' };
    return {
      alta: {
        nuevo: {
          nombre: nombre.trim(),
          giro: giro.trim(),
          direccion: direccion.trim() || undefined,
        },
      },
    };
  }

  return { libres, modo, setModo, elegido, negocioElegido, elegir, codigo, setCodigo, nombre, setNombre, giro, setGiro, direccion, setDireccion, validar };
}

export type NegocioFormEstado = ReturnType<typeof useNegocioForm>;

export function NegocioForm({ f, onCambio }: { f: NegocioFormEstado; onCambio: () => void }) {
  const { libres, modo } = f;
  return (
    <View style={{ gap: 16 }}>
      {libres.length ? (
        <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: C.seg }}>
          {(
            [
              ['directorio', 'Ya aparece en la lista'],
              ['nuevo', 'Mi negocio es nuevo'],
            ] as [ModoNegocio, string][]
          ).map(([m, label]) => {
            const on = modo === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  f.setModo(m);
                  onCambio();
                }}
                style={{ flex: 1, minHeight: 42, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.white : 'transparent' }}
              >
                <T size={13} weight={on ? 700 : 600} color={on ? C.ink : C.greyText} style={{ textAlign: 'center' }}>
                  {label}
                </T>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {modo === 'directorio' && libres.length ? (
        <View style={{ gap: 10 }}>
          <T size={14} lh={1.45} color={C.muted}>
            Estos negocios de la comunidad ya están en Mercaboot. Si el tuyo es uno de ellos, tócalo y escribe el código de reclamo que te dio el equipo de Mercaboot. Si lo tocaste por error, vuelve a tocarlo para quitarlo.
          </T>
          {libres.map((n) => {
            const on = f.elegido === n.id;
            return (
              <View key={n.id} style={{ gap: 8 }}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityHint={on ? 'Toca otra vez para quitar la selección' : undefined}
                  onPress={() => {
                    f.elegir(on ? null : n.id);
                    onCambio();
                  }}
                >
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 2, borderColor: on ? C.green : C.line }}>
                    <Logo nombre={n.nombre} uri={n.logoUri} size={48} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <T size={15} weight={700}>
                        {n.nombre}
                      </T>
                      <T size={13} color={C.muted}>
                        {n.giro}
                        {n.direccion ? ` · ${n.direccion}` : ''}
                      </T>
                    </View>
                    {on ? <Icon name="check" size={22} color={C.green} /> : null}
                  </Card>
                </Pressable>

                {on ? (
                  <Card style={{ gap: 10, padding: 14, backgroundColor: C.amberTint, borderColor: C.amber }}>
                    <T size={14} weight={700} color={C.amberDeep}>
                      Solo el dueño puede administrar este negocio
                    </T>
                    <T size={13} lh={1.45} color={C.amberDeep}>
                      Para proteger a cada negocio, su dueño recibe un código de reclamo. Escríbelo para continuar. Si no lo tienes, pídelo {DONDE_PEDIR_CODIGO}; mientras tanto puedes usar Mercaboot como cliente.
                    </T>
                    <Field
                      label="Código de reclamo"
                      h={50}
                      gap={6}
                      placeholder="Ej. K7M2-9QXP-4HWD"
                      value={f.codigo}
                      onChangeText={(t) => {
                        f.setCodigo(t);
                        onCambio();
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      spellCheck={false}
                    />
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        f.elegir(null);
                        onCambio();
                      }}
                      style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
                    >
                      <T size={13} weight={700} color={C.amberDeep} style={{ textDecorationLine: 'underline' }}>
                        No es mi negocio, quitar selección
                      </T>
                    </Pressable>
                  </Card>
                ) : null}
              </View>
            );
          })}
          <T size={12} lh={1.4} color={C.muted}>
            Después podrás completar su logo, dirección, horario y todo lo demás en «Mi negocio».
          </T>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Field
            label="Nombre del negocio"
            h={50}
            gap={6}
            placeholder="Ej. Abarrotes Doña Lupe"
            value={f.nombre}
            onChangeText={(t) => {
              f.setNombre(t);
              onCambio();
            }}
            autoCapitalize="words"
          />
          <GiroCampo
            value={f.giro}
            onChange={(g) => {
              f.setGiro(g);
              onCambio();
            }}
          />
          <Field
            label="Dirección o referencia (opcional)"
            h={50}
            gap={6}
            placeholder="Ej. Calle Hidalgo 12, frente a la iglesia"
            value={f.direccion}
            onChangeText={(t) => {
              f.setDireccion(t);
              onCambio();
            }}
            autoCapitalize="sentences"
          />
        </View>
      )}
    </View>
  );
}

/**
 * Ventana «¿Es tu negocio?»: la última oportunidad de echarse para atrás antes de quedarse con un negocio del directorio.
 */
export function ConfirmarReclamo({
  nombre,
  visible,
  onConfirmar,
  onCancelar,
}: {
  nombre: string;
  visible: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <Confirmar
      visible={visible}
      titulo="¿Es tu negocio?"
      texto={`Vas a quedar como la persona que administra «${nombre}». Solo su dueño debe hacerlo. Si lo tocaste por error, elige «No, volver». Más adelante también puedes soltarlo desde tu perfil.`}
      confirmar="Sí, es mío"
      cancelar="No, volver"
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
    />
  );
}
