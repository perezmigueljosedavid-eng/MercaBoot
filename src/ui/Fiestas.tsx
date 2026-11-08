import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  enTemporada,
  FESTIVIDADES,
  Festividad,
  IdeaFiesta,
  ideasPara,
  Ocurrencia,
  proximas,
  textoFaltan,
  textoFecha,
} from '../data/festividades';
import { TIPOS_AVISO } from '../data/contenido';
import { Icon } from './Icon';
import { Btn, Tag } from './kit';
import { T } from './T';
import { C } from './theme';

/** Las fiestas del año con su fecha, de la más próxima a la más lejana; al final las que cada negocio fecha a su gusto. */
export function fiestasDelAno(ahora: Date): { f: Festividad; o: Ocurrencia | null }[] {
  const conFecha = proximas(ahora).map((o) => ({ f: o.f, o }));
  const sinFecha = FESTIVIDADES.filter((f) => !f.fecha).map((f) => ({ f, o: null }));
  return [...conFecha, ...sinFecha];
}

const VISIBLES = 6;

/**
 * Para el comerciante: las fiestas del año con ideas creativas y mensajes listos para atraer clientes y
 * hacerlos sentir queridos. Al elegir una idea, el mensaje se llena solo y se puede cambiar antes de publicar.
 */
export function SelectorFiestas({
  giro,
  ahora,
  elegida,
  onElegir,
  onIdea,
}: {
  giro: string;
  ahora: Date;
  elegida: string | null;
  onElegir: (id: string | null) => void;
  onIdea: (idea: IdeaFiesta, f: Festividad, o: Ocurrencia | null) => void;
}) {
  const lista = useMemo(() => fiestasDelAno(ahora), [ahora]);
  const [todas, setTodas] = useState(false);
  const sel = elegida ? lista.find((x) => x.f.id === elegida) : undefined;
  // Si la fiesta elegida queda fuera de las primeras, se muestra igual
  const visibles = todas ? lista : lista.filter((x, i) => i < VISIBLES || x.f.id === elegida);
  const ideas = sel ? ideasPara(sel.f, giro) : [];

  return (
    <View style={{ gap: 12, padding: 14, borderRadius: 16, backgroundColor: C.amberTint, borderWidth: 1, borderColor: '#F0D5A8' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="gift" size={20} color={C.amberText} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <T size={16} weight={800} color={C.amberDeep}>
            Fiestas y temporadas
          </T>
          <T size={12} lh={1.35} color={C.amberText}>
            Cada fiesta es una razón para que tus clientes se sientan queridos. Elige una y te damos ideas para tu negocio.
          </T>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {visibles.map(({ f, o }) => {
          const on = elegida === f.id;
          const pronto = !!o && (o.enCurso || o.faltan <= f.antes);
          return (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onElegir(on ? null : f.id)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
                gap: 1,
                backgroundColor: on ? C.amberDeep : C.white,
                borderWidth: 1,
                borderColor: on ? C.amberDeep : pronto ? C.amber : '#EBDDC2',
              }}
            >
              <T size={13} weight={700} color={on ? C.white : C.ink}>
                {f.corto}
              </T>
              <T size={11} weight={pronto ? 700 : 500} color={on ? '#F6E3C0' : pronto ? C.amberText : C.muted}>
                {o ? textoFaltan(o) : 'tú eliges la fecha'}
              </T>
            </Pressable>
          );
        })}
        {lista.length > VISIBLES ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setTodas((v) => !v)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, justifyContent: 'center' }}
          >
            <T size={13} weight={700} color={C.amberDeep}>
              {todas ? 'Ver menos' : `Ver las ${lista.length} fiestas`}
            </T>
          </Pressable>
        ) : null}
      </View>

      {sel ? (
        <View style={{ gap: 12, padding: 14, borderRadius: 14, backgroundColor: C.white }}>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <T size={16} weight={800} style={{ flex: 1 }}>
                {sel.f.nombre}
              </T>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar ideas" hitSlop={10} onPress={() => onElegir(null)}>
                <Icon name="close" size={18} color={C.muted} />
              </Pressable>
            </View>
            <T size={12} weight={700} color={C.amberText}>
              {sel.o ? `${textoFecha(sel.o)} · ${textoFaltan(sel.o)}` : sel.f.cuando}
            </T>
            <T size={13} lh={1.4} color={C.muted}>
              {sel.f.motivo}
            </T>
          </View>

          <View style={{ gap: 10 }}>
            <T size={13} weight={700} color={C.muted}>
              Ideas para tu negocio
            </T>
            {ideas.map((idea) => {
              const t = TIPOS_AVISO[idea.tipo];
              return (
                <View key={idea.titulo} style={{ gap: 6, padding: 12, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <T size={14} weight={700}>
                      {idea.titulo}
                    </T>
                    <Tag bg={t.bg} fg={t.fg}>
                      {t.badge}
                    </Tag>
                  </View>
                  <T size={13} lh={1.4} color={C.muted}>
                    {idea.mensaje}
                  </T>
                  <Btn label="Usar esta idea" variant="outline" h={40} r={10} size={13} weight={700} onPress={() => onIdea(idea, sel.f, sel.o)} />
                </View>
              );
            })}
          </View>

          {sel.f.regalos.length ? (
            <View style={{ gap: 8 }}>
              <T size={13} weight={700} color={C.muted}>
                Detalles que puedes regalar
              </T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {sel.f.regalos.map((r) => (
                  <Pressable
                    key={r}
                    accessibilityRole="button"
                    onPress={() =>
                      onIdea(
                        {
                          para: [],
                          titulo: `Regalo: ${r}`,
                          tipo: 'regalo',
                          mensaje: `${sel.f.nombre}: regalamos ${r.charAt(0).toLowerCase()}${r.slice(1)} a quienes nos visiten${sel.o ? ` el ${textoFecha(sel.o)}` : ''}. ¡Gracias por ser parte de nuestro negocio!`,
                        },
                        sel.f,
                        sel.o,
                      )
                    }
                    style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: C.input, backgroundColor: C.white, justifyContent: 'center' }}
                  >
                    <T size={13} weight={600} color={C.green}>
                      {r}
                    </T>
                  </Pressable>
                ))}
              </View>
              <T size={12} color={C.muted}>
                Toca uno para llenar el mensaje; lo puedes cambiar abajo antes de publicar.
              </T>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** En el inicio del comerciante: la fiesta que ya conviene anunciar (o la que sigue), con una idea para su negocio. */
export function FiestaProxima({ giro }: { giro: string }) {
  const [ahora] = useState(() => new Date());
  const sel = useMemo(() => enTemporada(ahora)[0] ?? proximas(ahora)[0], [ahora]);
  if (!sel) return null;
  const idea = ideasPara(sel.f, giro)[0];
  const ya = sel.enCurso || sel.faltan <= sel.f.antes;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate({ pathname: '/comerciante/avisos', params: { fiesta: sel.f.id, t: String(Date.now()) } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: C.amberTint, borderWidth: 1, borderColor: ya ? C.amber : '#F0D5A8' }}
    >
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="gift" size={22} color={C.amberText} />
      </View>
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <T size={15} weight={700} color={C.amberDeep}>
          {ya ? `Ya puedes avisar: ${sel.f.nombre}` : `Próxima fiesta: ${sel.f.nombre}`}
        </T>
        <T size={12} weight={700} color={C.amberText}>
          {textoFecha(sel)} · {textoFaltan(sel)}
        </T>
        <T size={12} lh={1.4} color={C.amberDeep}>
          {idea ? `Idea para tu negocio: ${idea.titulo}. Toca para ver más.` : 'Toca para ver ideas.'}
        </T>
      </View>
      <Icon name="next" size={18} color={C.amberText} />
    </Pressable>
  );
}
