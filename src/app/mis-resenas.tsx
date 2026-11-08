import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store';
import { fechaCorta } from '../ui/bits';
import { Confirmar } from '../ui/Dialogo';
import { BackBtn, Btn, Card, Screen, Tag } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

export default function MisResenas() {
  const { s, cuenta, borrarResena } = useStore();
  const mias = s.resenas.filter((r) => r.autorId === cuenta?.id).sort((a, b) => b.fecha - a.fecha);
  const [quitarId, setQuitarId] = useState<string | null>(null); // negocio cuya reseña se va a quitar
  const [error, setError] = useState('');
  const nombreQuitar = quitarId ? (s.negocios.find((x) => x.id === quitarId)?.nombre ?? 'este negocio') : '';

  return (
    <Screen bottomInset contentStyle={{ gap: 14, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 16 }}>
        <BackBtn />
        <T size={18} weight={700}>
          Mis reseñas
        </T>
      </View>
      <View style={{ gap: 12, paddingHorizontal: 20 }}>
        {mias.length === 0 ? (
          <Card style={{ padding: 20, gap: 6 }}>
            <T size={16} weight={700}>
              Aún no has dejado reseñas
            </T>
            <T size={14} lh={1.45} color={C.muted}>
              Abre un negocio, entra a “Reseñas” y cuéntanos cómo te fue.
            </T>
          </Card>
        ) : (
          mias.map((r) => {
            const n = s.negocios.find((x) => x.id === r.negocioId);
            return (
              <Card key={r.id} style={{ gap: 8, padding: 14 }}>
                <Pressable accessibilityRole="link" accessibilityLabel={`Abrir ${n?.nombre ?? 'el negocio'}`} onPress={() => router.push(`/negocio/${r.negocioId}`)} style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <T size={15} weight={700} style={{ flexShrink: 1 }}>
                      {n?.nombre ?? 'Negocio'}
                    </T>
                    <T size={14} weight={700} color={C.amber}>
                      {'★'.repeat(r.estrellas)}
                      <T size={14} weight={700} color={C.off}>
                        {'★'.repeat(5 - r.estrellas)}
                      </T>
                    </T>
                  </View>
                  <T size={12} color={C.muted}>
                    {fechaCorta(r.fecha)}
                  </T>
                </Pressable>
                  {r.etiquetas.length ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {r.etiquetas.map((e) => (
                        <Tag key={e} bg={C.greenTint} fg={C.greenDark}>
                          {e}
                        </Tag>
                      ))}
                    </View>
                  ) : null}
                  {r.comentario ? (
                    <T size={14} lh={1.45}>
                      {r.comentario}
                    </T>
                  ) : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Btn label="Editar" variant="outline" h={42} r={12} size={14} flex={1} onPress={() => router.push(`/resena/${r.negocioId}`)} />
                  <Btn label="Quitar" variant="outline" h={42} r={12} size={14} flex={1} onPress={() => setQuitarId(r.negocioId)} />
                </View>
              </Card>
            );
          })
        )}
        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
      </View>

      <Confirmar
        visible={quitarId != null}
        titulo="¿Quitar tu reseña?"
        texto={`Dejará de verse en «${nombreQuitar}». Puedes escribir otra cuando quieras.`}
        confirmar="Sí, quitarla"
        peligro
        onCancelar={() => setQuitarId(null)}
        onConfirmar={async () => {
          const id = quitarId;
          setQuitarId(null);
          if (!id) return;
          const err = await borrarResena(id);
          setError(err ?? '');
        }}
      />
    </Screen>
  );
}
