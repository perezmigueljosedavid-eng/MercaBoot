import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { Rol } from '../data/tipos';
import type { AltaNegocio } from '../store';
import { correoValido, telefonoValido, useStore } from '../store';
import { BackBtn, Btn, Field, Screen } from '../ui/kit';
import { ConfirmarReclamo, NegocioForm, useNegocioForm } from '../ui/NegocioForm';
import { T } from '../ui/T';
import { C } from '../ui/theme';

export default function Registro() {
  const params = useLocalSearchParams<{ rol?: string; reclamar?: string }>();
  const { registrar, comprobarReclamo } = useStore();
  const negocioForm = useNegocioForm(params.reclamar);

  const [rol, setRol] = useState<Rol>(params.rol === 'comerciante' || params.reclamar ? 'comerciante' : 'cliente');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Negocio del directorio con código correcto, esperando que la persona confirme «¿Es tu negocio?»
  const [pendiente, setPendiente] = useState<AltaNegocio | null>(null);

  const limpiar = <A,>(set: (v: A) => void) => (v: A) => {
    set(v);
    setError('');
  };

  async function crear() {
    if (!nombre.trim()) return setError('Escribe tu nombre completo.');
    if (!correoValido(correo)) return setError('Escribe un correo válido.');
    if (!telefonoValido(telefono)) return setError('El teléfono debe tener 10 dígitos.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');

    let negocio: AltaNegocio | undefined;
    if (rol === 'comerciante') {
      const v = negocioForm.validar();
      if ('error' in v) return setError(v.error);
      negocio = v.alta;
      if ('reclamarId' in v.alta) {
        // Primero se revisa el código; solo si es correcto se pregunta «¿Es tu negocio?»
        setCargando(true);
        const errCodigo = await comprobarReclamo(v.alta.reclamarId, v.alta.codigo);
        setCargando(false);
        if (errCodigo) return setError(errCodigo);
        return setPendiente(v.alta);
      }
    }
    await enviar(negocio);
  }

  async function enviar(negocio?: AltaNegocio) {
    setCargando(true);
    const err = await registrar({ nombre, correo, telefono, password, rol, negocio });
    setCargando(false);
    if (err) return setError(err);
    router.replace(rol === 'cliente' ? '/cliente' : '/comerciante');
  }

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 16 }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
        <BackBtn />
      </View>
      <View style={{ flex: 1, gap: 16, paddingTop: 8, paddingHorizontal: 24, paddingBottom: 16 }}>
        <T size={28} weight={800} ls={-0.02}>
          Crea tu cuenta
        </T>
        <Pressable accessibilityRole="link" onPress={() => router.replace('/iniciar-sesion')}>
          <T size={13} lh={1.45} color={C.muted}>
            Con una sola cuenta compras y vendes. ¿Ya te registraste como cliente y ahora quieres vender, o al revés?{' '}
            <T size={13} weight={700} color={C.green}>
              Inicia sesión
            </T>{' '}
            y cambia de modo desde tu perfil, sin crear otra cuenta.
          </T>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: C.seg }}>
          {(['cliente', 'comerciante'] as Rol[]).map((r) => {
            const on = rol === r;
            return (
              <Pressable
                key={r}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setRol(r);
                  setError('');
                }}
                style={{ flex: 1, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.white : 'transparent' }}
              >
                <T size={14} weight={on ? 700 : 600} color={on ? C.ink : C.greyText}>
                  {r === 'cliente' ? 'Cliente' : 'Comerciante'}
                </T>
              </Pressable>
            );
          })}
        </View>

        <Field label="Nombre completo" h={50} gap={6} placeholder="Tu nombre" value={nombre} onChangeText={limpiar(setNombre)} autoCapitalize="words" />
        <Field
          label="Correo electrónico"
          h={50}
          gap={6}
          placeholder="tucorreo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={correo}
          onChangeText={limpiar(setCorreo)}
        />
        <Field label="Teléfono" h={50} gap={6} placeholder="10 dígitos" keyboardType="phone-pad" value={telefono} onChangeText={limpiar(setTelefono)} />
        <Field
          label="Contraseña"
          h={50}
          gap={6}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={limpiar(setPassword)}
        />

        {rol === 'comerciante' ? (
          <View style={{ gap: 16 }}>
            <View style={{ height: 1, backgroundColor: C.line }} />
            <T size={20} weight={800} ls={-0.01}>
              Tu negocio
            </T>

            <NegocioForm f={negocioForm} onCambio={() => setError('')} />
          </View>
        ) : (
          <T size={13} lh={1.45} color={C.muted}>
            Si eliges Comerciante, también te pediremos los datos de tu negocio.
          </T>
        )}

        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}

        <View style={{ flex: 1, minHeight: 8 }} />
        <Btn label={cargando ? 'Creando…' : 'Crear cuenta'} onPress={cargando ? undefined : crear} />
        <T size={12} lh={1.4} color={C.muted} style={{ textAlign: 'center' }}>
          Por ahora tus datos se guardan solo en este teléfono y no se comparten con nadie.
        </T>
      </View>

      <ConfirmarReclamo
        visible={!!pendiente}
        nombre={negocioForm.negocioElegido?.nombre ?? 'este negocio'}
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => {
          const alta = pendiente;
          setPendiente(null);
          if (alta) void enviar(alta);
        }}
      />
    </Screen>
  );
}
