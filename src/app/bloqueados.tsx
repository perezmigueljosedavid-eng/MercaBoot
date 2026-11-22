import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { cargarBloqueos, desbloquear, useBloqueados } from '../lib/seguridad';
import { fechaCorta } from '../ui/bits';
import { BackBtn, Btn, Card, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/**
 * Personas que bloqueaste. Una persona bloqueada no puede escribirte ni hacerte pedidos nuevos (y tú tampoco a ella) y no se entera
 * de que la bloqueaste. Aquí puedes desbloquearla cuando quieras.
 * Autor: José David Pérez Miguel
 */
export default function Bloqueados() {
  const lista = useBloqueados();
  const [cargando, setCargando] = useState(true);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    void cargarBloqueos(true).then(() => {
      if (vivo) setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  async function quitar(id: string) {
    if (quitando) return;
    setQuitando(id);
    setError('');
    const err = await desbloquear(id);
    setQuitando(null);
    if (err) setError(err);
  }

  return (
    <Screen contentStyle={{ padding: 20, gap: 16 }} bottomInset>
      <BackBtn />
      <T size={24} weight={800} ls={-0.02}>
        Personas bloqueadas
      </T>
      <T size={14} lh={1.5} color={C.muted}>
        Una persona bloqueada ya no puede escribirte ni hacerte pedidos nuevos, y tú tampoco a ella. No se entera de que la bloqueaste. Los pedidos que ya estaban en marcha se pueden terminar con normalidad.
      </T>
      {error ? (
        <T size={13} weight={600} color={C.red} accessibilityRole="alert">
          {error}
        </T>
      ) : null}
      {lista.length === 0 ? (
        <Card style={{ gap: 6, padding: 18 }}>
          <T size={15} weight={700}>
            {cargando ? 'Buscando…' : 'No has bloqueado a nadie'}
          </T>
          {cargando ? null : (
            <T size={13.5} lh={1.45} color={C.muted}>
              Si alguien te escribe feo, entra a la conversación, toca los tres puntos de arriba (⋮) y elige «Bloquear». También puedes reportarlo desde ahí.
            </T>
          )}
        </Card>
      ) : (
        lista.map((b) => (
          <Card key={b.usuarioId} style={{ gap: 12, padding: 16 }}>
            <View style={{ gap: 2 }}>
              <T size={16} weight={700}>
                {b.nombre}
              </T>
              {b.negocio ? (
                <T size={13} color={C.muted}>
                  Negocio: {b.negocio}
                </T>
              ) : null}
              <T size={12} color={C.muted}>
                Bloqueada el {fechaCorta(b.desde)}
              </T>
            </View>
            <Btn
              label={quitando === b.usuarioId ? 'Desbloqueando…' : 'Desbloquear'}
              variant="outline"
              h={44}
              r={12}
              size={14}
              disabled={quitando !== null}
              onPress={() => void quitar(b.usuarioId)}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
