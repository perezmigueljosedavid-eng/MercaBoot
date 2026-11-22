import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { MAX_DETALLE, MOTIVOS, reportar, type MotivoDeReporte, type TipoDeReporte } from '../lib/seguridad';
import { Hoja } from './Hoja';
import { Icon } from './Icon';
import { Btn, Field } from './kit';
import { T } from './T';
import { C } from './theme';

/** Lo que se va a reportar. */
export interface ObjetoReportado {
  tipo: TipoDeReporte;
  id: string;
  /** Con palabras de la gente: «este mensaje», «esta reseña», «a Lupita»… */
  queSe: string;
}

/**
 * Hoja para reportar algo: se elige el motivo, se puede contar qué pasó y se manda. Quien administra Mercaboot lo revisa.
 * `objeto = null` la mantiene cerrada. Al cerrarse, todo se limpia (el formulario se vuelve a crear cada vez).
 * Autor: José David Pérez Miguel
 */
export function ReportarHoja({ objeto, onCerrar }: { objeto: ObjetoReportado | null; onCerrar: () => void }) {
  return (
    <Hoja visible={objeto !== null} titulo="Reportar" onCerrar={onCerrar} alto="90%">
      {objeto ? <Formulario key={`${objeto.tipo}:${objeto.id}`} objeto={objeto} onCerrar={onCerrar} /> : null}
    </Hoja>
  );
}

function Formulario({ objeto, onCerrar }: { objeto: ObjetoReportado; onCerrar: () => void }) {
  const [motivo, setMotivo] = useState<MotivoDeReporte | null>(null);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  async function enviar() {
    if (!motivo || enviando) return;
    setEnviando(true);
    setError('');
    const err = await reportar(objeto.tipo, objeto.id, motivo, detalle);
    setEnviando(false);
    if (err) setError(err);
    else setListo(true);
  }

  if (listo) {
    return (
      <View style={{ gap: 14, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={28} color={C.greenDark} />
        </View>
        <T size={18} weight={800} style={{ textAlign: 'center' }}>
          Gracias por avisarnos
        </T>
        <T size={14} lh={1.5} color={C.muted} style={{ textAlign: 'center' }}>
          Recibimos tu reporte y lo vamos a revisar. Si no quieres seguir recibiendo mensajes de esa persona, también puedes bloquearla desde el chat.
        </T>
        <Btn label="Listo" h={50} onPress={onCerrar} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 8 }}>
      <T size={15} weight={600} lh={1.4}>
        ¿Qué pasa con {objeto.queSe}?
      </T>
      <View style={{ gap: 8 }}>
        {MOTIVOS.map((m) => {
          const elegido = motivo === m.clave;
          return (
            <Pressable
              key={m.clave}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegido }}
              accessibilityLabel={`${m.etiqueta}. ${m.ayuda}`}
              onPress={() => {
                setMotivo(m.clave);
                setError('');
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: elegido ? 2 : 1,
                borderColor: elegido ? C.green : C.input,
                backgroundColor: elegido ? C.greenTint : C.white,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <T size={15} weight={700}>
                  {m.etiqueta}
                </T>
                <T size={12.5} lh={1.35} color={C.muted}>
                  {m.ayuda}
                </T>
              </View>
              {elegido ? <Icon name="check" size={20} color={C.greenDark} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Field
        label="Cuéntanos qué pasó (opcional)"
        value={detalle}
        onChangeText={(t) => {
          setDetalle(t);
          setError('');
        }}
        multiline
        h={80}
        maxLength={MAX_DETALLE}
        placeholder="Por ejemplo: me insultó dos veces"
      />
      {error ? (
        <T size={13} weight={600} color={C.red} accessibilityRole="alert">
          {error}
        </T>
      ) : null}
      <Btn label={enviando ? 'Enviando…' : 'Enviar reporte'} h={50} disabled={!motivo || enviando} onPress={() => void enviar()} />
      <T size={12} lh={1.4} color={C.muted} style={{ textAlign: 'center' }}>
        Tu reporte es privado: la otra persona no se entera de que fuiste tú.
      </T>
    </ScrollView>
  );
}
