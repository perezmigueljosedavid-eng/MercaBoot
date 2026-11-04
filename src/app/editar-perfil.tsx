import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore } from '../store';
import { FotoCampo } from '../ui/FotoCampo';
import { BackBtn, Btn, Card, Field, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

type Aviso = { ok: boolean; texto: string } | null;

function Mensaje({ m }: { m: Aviso }) {
  if (!m) return null;
  return (
    <T size={13} weight={600} lh={1.4} color={m.ok ? C.greenDark : C.red}>
      {m.texto}
    </T>
  );
}

/** Datos de la cuenta: foto, nombre, correo, teléfono y contraseña. Sirve para clientes y comerciantes. */
export default function EditarPerfil() {
  const { cuenta, actualizarCuenta, cambiarPassword } = useStore();
  const [nombre, setNombre] = useState(cuenta?.nombre ?? '');
  const [telefono, setTelefono] = useState(cuenta?.telefono ?? '');
  const [datos, setDatos] = useState<Aviso>(null);
  const [guardando, setGuardando] = useState(false);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [clave, setClave] = useState<Aviso>(null);
  const [cambiando, setCambiando] = useState(false);

  if (!cuenta) return null;

  async function guardar() {
    setGuardando(true);
    const err = await actualizarCuenta({ nombre, telefono });
    setGuardando(false);
    setDatos(err ? { ok: false, texto: err } : { ok: true, texto: 'Guardamos tus datos.' });
  }

  async function cambiarFoto(uri: string | undefined) {
    const err = await actualizarCuenta({ fotoUri: uri });
    if (err) setDatos({ ok: false, texto: err });
  }

  async function guardarClave() {
    if (nueva !== repetida) return setClave({ ok: false, texto: 'Las contraseñas nuevas no coinciden.' });
    setCambiando(true);
    const err = await cambiarPassword(actual, nueva);
    setCambiando(false);
    if (err) return setClave({ ok: false, texto: err });
    setClave({ ok: true, texto: 'Listo, cambiaste tu contraseña.' });
    setActual('');
    setNueva('');
    setRepetida('');
  }

  return (
    <Screen bottomInset contentStyle={{ gap: 18, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 16 }}>
        <BackBtn />
        <T size={18} weight={700}>
          Mis datos
        </T>
      </View>

      <View style={{ gap: 18, paddingHorizontal: 20 }}>
        <Card style={{ gap: 16, padding: 16 }}>
          <FotoCampo
            titulo="Foto de perfil"
            uri={cuenta.fotoUri}
            nombre={cuenta.nombre}
            redondo
            onChange={cambiarFoto}
          />
          <Field label="Nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" textContentType="name" />
          <View style={{ gap: 6 }}>
            <T size={14} weight={600}>
              Correo electrónico
            </T>
            <View style={{ minHeight: 50, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.grey }}>
              <T size={15} color={C.greyText}>
                {cuenta.correo}
              </T>
            </View>
            <T size={12} lh={1.4} color={C.muted}>
              Tu correo es tu usuario para entrar, por eso no se puede cambiar.
            </T>
          </View>
          <Field
            label="Teléfono (10 dígitos)"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            maxLength={14}
          />
          <Mensaje m={datos} />
          <Btn label={guardando ? 'Guardando…' : 'Guardar cambios'} onPress={guardando ? undefined : guardar} />
        </Card>

        <Card style={{ gap: 14, padding: 16 }}>
          <T size={16} weight={700}>
            Cambiar contraseña
          </T>
          <Field label="Contraseña actual" value={actual} onChangeText={setActual} secureTextEntry autoCapitalize="none" />
          <Field label="Contraseña nueva (mínimo 8 caracteres)" value={nueva} onChangeText={setNueva} secureTextEntry autoCapitalize="none" />
          <Field label="Repite la contraseña nueva" value={repetida} onChangeText={setRepetida} secureTextEntry autoCapitalize="none" />
          <Mensaje m={clave} />
          <Btn label={cambiando ? 'Cambiando…' : 'Cambiar contraseña'} variant="outline" onPress={cambiando ? undefined : guardarClave} />
        </Card>
      </View>
    </Screen>
  );
}
