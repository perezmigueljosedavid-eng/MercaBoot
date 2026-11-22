import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import {
  activarAvisos,
  avisosDisponibles,
  escucharAvisos,
  fijarRutaActual,
  leerLocal,
  marcarPreguntado,
  registrarSiEstaActivo,
} from '../lib/avisosTelefono';
import { useStore } from '../store';
import { Hoja } from './Hoja';
import { Btn } from './kit';
import { T } from './T';
import { C } from './theme';

/**
 * Lo que hace funcionar los avisos al teléfono mientras la sesión está abierta (no dibuja nada en pantalla, salvo la
 * pregunta amable de la primera vez):
 *  · escucha cuando la persona toca un aviso y abre el chat o el pedido;
 *  · mantiene al día el «código» de este teléfono en la base de datos;
 *  · la primera vez, ya dentro de la app, pregunta si quiere recibir avisos (una sola vez; después se cambia en Perfil).
 * Si el APK se armó sin Firebase, no hace nada.
 * Autor: José David Pérez Miguel
 */
export function AvisosAlTelefono() {
  const { cuenta, avisar } = useStore();
  const ruta = usePathname();
  const uid = cuenta?.id ?? null;
  const esComerciante = cuenta?.rol === 'comerciante';
  const [preguntar, setPreguntar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  // La pregunta solo aparece en las pantallas principales, nunca a mitad de un chat o de un pedido
  const enInicio = /^\/(cliente|comerciante)(\/|$)/.test(ruta);

  useEffect(() => {
    fijarRutaActual(ruta);
  }, [ruta]);

  useEffect(() => {
    if (!uid || !avisosDisponibles()) return;
    const dejar = escucharAvisos();
    void registrarSiEstaActivo();
    return dejar;
  }, [uid]);

  useEffect(() => {
    if (!uid || !enInicio || !avisosDisponibles()) return;
    let vivo = true;
    const espera = setTimeout(() => {
      void leerLocal().then((l) => {
        if (vivo && !l.activo && !l.preguntado) setPreguntar(true);
      });
    }, 2500);
    return () => {
      vivo = false;
      clearTimeout(espera);
    };
  }, [uid, enInicio]);

  const cerrar = () => {
    setPreguntar(false);
    void marcarPreguntado();
  };

  const aceptar = async () => {
    if (ocupado) return;
    setOcupado(true);
    const r = await activarAvisos();
    setOcupado(false);
    setPreguntar(false);
    if (r === 'ok') avisar('Listo: te avisaremos en este teléfono.');
    else if (r === 'sin-permiso') avisar('Android no dejó mostrar avisos. Puedes activarlos después en Perfil → Avisos al teléfono.');
    else if (r === 'error') avisar('No pudimos activar los avisos ahora. Inténtalo después en Perfil → Avisos al teléfono.');
  };

  if (!preguntar) return null;
  return (
    <Hoja visible titulo="¿Te avisamos?" onCerrar={cerrar} alto="70%">
      <View style={{ gap: 14, paddingHorizontal: 20, paddingBottom: 8 }}>
        <T size={15} lh={1.5}>
          {esComerciante
            ? 'Para que no se te pase ningún cliente: te mandamos un aviso al teléfono cuando te llegue un pedido o un mensaje, aunque la app esté cerrada.'
            : 'Para que no tengas que abrir la app a cada rato: te mandamos un aviso cuando una tienda te conteste, cuando tu pedido cambie y cuando una tienda que sigues publique una promoción.'}
        </T>
        <T size={12.5} lh={1.45} color={C.muted}>
          Sin avisos de noche (de 10 pm a 7 am). Lo puedes cambiar cuando quieras en Perfil → Avisos al teléfono.
        </T>
        <View style={{ gap: 10 }}>
          <Btn label={ocupado ? 'Activando…' : 'Sí, avísenme'} onPress={() => void aceptar()} disabled={ocupado} />
          <Btn label="Ahora no" variant="outline" onPress={cerrar} disabled={ocupado} />
        </View>
      </View>
    </Hoja>
  );
}
