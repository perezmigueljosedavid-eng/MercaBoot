import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ETIQUETAS_RESENA, ETIQUETAS_RESENA_INICIALES, TEXTO_ESTRELLAS } from '../../data/contenido';
import { useStore } from '../../store';
import { Confirmar } from '../../ui/Dialogo';
import { BackBtn, Btn, Chip, goBack, Screen } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C, FONT } from '../../ui/theme';

export default function DejarResena() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, cuenta, agregarResena, borrarResena } = useStore();
  const n = s.negocios.find((x) => x.id === id);
  // Si ya opinaste de este negocio, aquí cambias tu reseña (solo cuenta una por persona y negocio).
  const previa = cuenta ? s.resenas.find((r) => r.negocioId === id && r.autorId === cuenta.id) : undefined;
  const [estrellas, setEstrellas] = useState(previa?.estrellas ?? 4);
  const [etiquetas, setEtiquetas] = useState<string[]>(previa ? previa.etiquetas : ETIQUETAS_RESENA_INICIALES);
  const [comentario, setComentario] = useState(previa?.comentario ?? '');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [quitando, setQuitando] = useState(false);
  const [quitar_, setQuitar] = useState(false);

  if (!n) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 12 }}>
        <BackBtn />
        <T size={16} weight={700}>
          Este negocio ya no está disponible.
        </T>
      </Screen>
    );
  }

  const esMio = !!cuenta && n.duenoId === cuenta.id;

  const alternar = (e: string) => {
    setError('');
    setEtiquetas((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]));
  };

  async function publicar() {
    if (!n) return;
    if (esMio) return setError('No puedes calificar tu propio negocio.');
    setError('');
    setEnviando(true);
    const err = await agregarResena({ negocioId: n.id, estrellas, etiquetas, comentario: comentario.trim() });
    setEnviando(false);
    if (err) return setError(err);
    goBack(`/negocio/${n.id}`);
  }

  async function quitar() {
    if (!n) return;
    setQuitando(true);
    const err = await borrarResena(n.id);
    setQuitando(false);
    if (err) return setError(err);
    goBack(`/negocio/${n.id}`);
  }

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 16 }}>
        <BackBtn />
        <T size={18} weight={700}>
          {previa ? 'Editar mi reseña' : 'Dejar reseña'}
        </T>
      </View>
      <View style={{ flex: 1, gap: 22, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Logo uri={n.logoUri} nombre={n.nombre} size={72} r={20} />
          <T size={20} weight={800} style={{ textAlign: 'center' }}>
            ¿Cómo te fue en {n.nombre}?
          </T>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable
                key={i}
                accessibilityRole="radio"
                accessibilityLabel={`${i} ${i === 1 ? 'estrella' : 'estrellas'}`}
                accessibilityState={{ selected: i === estrellas }}
                onPress={() => {
                  setError('');
                  setEstrellas(i);
                }}
                style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
              >
                <T size={36} color={i <= estrellas ? C.amber : C.off} style={{ lineHeight: 42 }}>
                  ★
                </T>
              </Pressable>
            ))}
          </View>
          <T size={14} color={C.muted}>
            {TEXTO_ESTRELLAS[estrellas]}
          </T>
        </View>

        <View style={{ gap: 10 }}>
          <T size={14} weight={600}>
            ¿Qué te gustó?
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ETIQUETAS_RESENA.map((e) => (
              <Chip key={e} label={e} h={38} px={14} size={13} tone="green" border={C.input} active={etiquetas.includes(e)} onPress={() => alternar(e)} />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <T size={14} weight={600}>
            Cuéntanos más (opcional)
          </T>
          <TextInput
            value={comentario}
            onChangeText={(t) => {
              setComentario(t);
              setError('');
            }}
            maxLength={600}
            multiline
            numberOfLines={4}
            placeholder="Escribe tu experiencia…"
            placeholderTextColor={C.placeholder}
            accessibilityLabel="Cuéntanos más"
            style={{
              minHeight: 110,
              paddingVertical: 14,
              paddingHorizontal: 16,
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
        </View>

        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}

        <View style={{ flex: 1 }} />
        <View style={{ gap: 10 }}>
          <Btn label={enviando ? 'Guardando…' : previa ? 'Guardar cambios' : 'Publicar reseña'} onPress={enviando ? undefined : publicar} />
          {previa ? <Btn label={quitando ? 'Quitando…' : 'Quitar mi reseña'} variant="danger" onPress={quitando ? undefined : () => setQuitar(true)} /> : null}
        </View>
      </View>

      <Confirmar
        visible={quitar_}
        titulo="¿Quitar tu reseña?"
        texto={`Dejará de verse en «${n.nombre}». Puedes escribir otra cuando quieras.`}
        confirmar="Sí, quitarla"
        peligro
        onCancelar={() => setQuitar(false)}
        onConfirmar={() => {
          setQuitar(false);
          quitar();
        }}
      />
    </Screen>
  );
}
