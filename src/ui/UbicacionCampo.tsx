import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { abrirMapas, resolverEnlaceMapas, textoCoord } from '../lib/geo';
import { posicionActual } from '../lib/ubicacion';
import { Icon } from './Icon';
import { Btn, Field } from './kit';
import { T } from './T';
import { C } from './theme';

export interface DatosUbicacion {
  direccion: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
}

const MENSAJE_PERMISO = 'No pudimos obtener tu ubicación. Revisa que el permiso de ubicación esté activado y vuelve a intentarlo.';

/**
 * Tres formas de decir dónde está un negocio: ubicación del teléfono, enlace/coordenadas de Google Maps,
 * o solo la dirección escrita (para negocios que no aparecen en Google Maps).
 */
export function UbicacionCampo({
  value,
  onChange,
  nombre = 'Mi negocio',
}: {
  value: DatosUbicacion;
  onChange: (v: DatosUbicacion) => void;
  nombre?: string;
}) {
  const [pegado, setPegado] = useState('');
  const [mostrarPegar, setMostrarPegar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const tiene = typeof value.lat === 'number' && typeof value.lng === 'number';

  async function usarMiUbicacion() {
    setMsg(null);
    setOcupado(true);
    const r = await posicionActual();
    setOcupado(false);
    if ('coords' in r) {
      onChange({ ...value, lat: r.coords.lat, lng: r.coords.lng });
      setMsg({ ok: true, texto: 'Listo, guardamos el punto donde estás ahora.' });
    } else {
      setMsg({ ok: false, texto: MENSAJE_PERMISO });
    }
  }

  async function usarEnlace() {
    const texto = pegado.trim();
    if (!texto) return;
    setMsg(null);
    setOcupado(true);
    const esEnlace = /^https?:\/\//i.test(texto);
    const c = await resolverEnlaceMapas(texto);
    setOcupado(false);
    if (c) {
      onChange({ ...value, lat: c.lat, lng: c.lng, mapsUrl: esEnlace ? texto : value.mapsUrl });
      setMsg({ ok: true, texto: 'Listo, guardamos el punto del mapa.' });
      setPegado('');
      setMostrarPegar(false);
    } else if (esEnlace) {
      onChange({ ...value, mapsUrl: texto });
      setMsg({
        ok: false,
        texto:
          'Guardamos el enlace para que los clientes puedan abrirlo, pero no pudimos leer el punto exacto. Para que aparezca la distancia, usa «Usar mi ubicación actual» estando en tu negocio.',
      });
      setPegado('');
      setMostrarPegar(false);
    } else {
      setMsg({ ok: false, texto: 'No reconocimos eso. Pega el enlace de Google Maps o las coordenadas, por ejemplo 17.03512, -96.75034.' });
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Dirección o referencia"
        value={value.direccion}
        onChangeText={(t) => onChange({ ...value, direccion: t })}
        placeholder="Ej. Calle Hidalgo 12, frente a la iglesia"
        multiline
        h={64}
      />

      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          padding: 12,
          borderRadius: 12,
          backgroundColor: tiene ? C.greenTint : C.grey,
          alignItems: 'flex-start',
        }}
      >
        <Icon name={tiene ? 'pin' : 'info'} size={20} color={tiene ? C.green : C.greyText} />
        <View style={{ flex: 1, gap: 2 }}>
          {tiene ? (
            <>
              <T size={14} weight={700} color={C.greenDark}>
                Punto guardado en el mapa
              </T>
              <T size={12} color={C.greenDark}>
                {textoCoord({ lat: value.lat as number, lng: value.lng as number })}
              </T>
            </>
          ) : (
            <>
              <T size={14} weight={700} color={C.greyText}>
                {value.mapsUrl ? 'Enlace de Google Maps guardado' : 'Sin punto en el mapa'}
              </T>
              <T size={12} lh={1.4} color={C.greyText}>
                {value.mapsUrl
                  ? 'Los clientes pueden abrirlo con «Cómo llegar».'
                  : 'No pasa nada: los clientes verán tu dirección escrita y te encontrarán igual. Si más adelante quieres que vean la distancia, agrega el punto.'}
              </T>
            </>
          )}
        </View>
      </View>

      <Btn
        label={ocupado ? 'Buscando…' : 'Usar mi ubicación actual'}
        variant="outline"
        h={46}
        r={12}
        size={14}
        weight={600}
        onPress={ocupado ? undefined : usarMiUbicacion}
      />
      <T size={12} color={C.muted} style={{ marginTop: -6 }}>
        Hazlo estando dentro de tu negocio para que el punto sea exacto.
      </T>

      {mostrarPegar ? (
        <View style={{ gap: 10 }}>
          <Field
            label="Enlace de Google Maps o coordenadas"
            value={pegado}
            onChangeText={setPegado}
            placeholder="https://maps.google.com/…  o  17.03512, -96.75034"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn label="Cancelar" variant="outline" h={44} r={12} size={14} weight={600} flex={1} onPress={() => setMostrarPegar(false)} />
            <Btn label={ocupado ? 'Leyendo…' : 'Guardar'} h={44} r={12} size={14} weight={600} flex={1} onPress={ocupado ? undefined : usarEnlace} />
          </View>
        </View>
      ) : (
        <Btn label="Pegar enlace de Google Maps" variant="outline" h={46} r={12} size={14} weight={600} onPress={() => setMostrarPegar(true)} />
      )}

      {tiene || value.mapsUrl ? (
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => abrirMapas({ nombre, ...value })}>
            <T size={13} weight={700} color={C.green}>
              Ver en Google Maps
            </T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              onChange({ direccion: value.direccion });
              setMsg(null);
            }}
          >
            <T size={13} weight={700} color={C.red}>
              Quitar punto
            </T>
          </Pressable>
        </View>
      ) : null}

      {msg ? (
        <T size={13} lh={1.4} color={msg.ok ? C.greenDark : C.amberText}>
          {msg.texto}
        </T>
      ) : null}
    </View>
  );
}
