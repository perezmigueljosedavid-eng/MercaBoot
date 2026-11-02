import React, { useState } from 'react';
import { View } from 'react-native';
import { correoValido, telefonoValido, useStore } from '../store';
import { FotoCampo } from '../ui/FotoCampo';
import { GiroCampo } from '../ui/GiroCampo';
import { BackBtn, Btn, Card, Field, goBack, Screen, Toggle } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/** Todo lo que el comerciante puede cambiar de su negocio. */
export default function EditarNegocio() {
  const { negocio, actualizarNegocio } = useStore();
  const [logo, setLogo] = useState<string | undefined>(negocio?.logoUri);
  const [nombre, setNombre] = useState(negocio?.nombre ?? '');
  const [giro, setGiro] = useState(negocio?.giro ?? '');
  const [descripcion, setDescripcion] = useState(negocio?.descripcion ?? '');
  const [telefono, setTelefono] = useState(negocio?.telefono ?? '');
  const [correo, setCorreo] = useState(negocio?.correo ?? '');
  const [horario, setHorario] = useState(negocio?.horario ?? '');
  const [aDomicilio, setADomicilio] = useState(negocio?.aDomicilio ?? false);
  const [zona, setZona] = useState(negocio?.zonaEntrega ?? '');
  const [direccion, setDireccion] = useState(negocio?.direccion ?? '');
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);

  if (!negocio) return null;

  const tocar = <A,>(set: (v: A) => void) => (v: A) => {
    set(v);
    setError('');
    setGuardado(false);
  };

  function guardar() {
    if (!nombre.trim()) return setError('Escribe el nombre del negocio.');
    if (!giro.trim()) return setError('Escribe qué tipo de negocio es.');
    if (telefono.trim() && !telefonoValido(telefono)) return setError('El teléfono debe tener 10 dígitos.');
    if (correo.trim() && !correoValido(correo)) return setError('Escribe un correo válido o déjalo vacío.');
    const err = actualizarNegocio({
      logoUri: logo,
      nombre,
      giro: giro.trim(),
      descripcion: descripcion.trim() || undefined,
      telefono: telefono.trim() ? telefono.replace(/\D/g, '') : undefined,
      correo: correo.trim() ? correo.trim().toLowerCase() : undefined,
      horario: horario.trim() || undefined,
      aDomicilio,
      zonaEntrega: aDomicilio ? zona.trim() || undefined : undefined,
      direccion: direccion.trim() || undefined,
    });
    if (err) return setError(err);
    setGuardado(true);
    goBack('/comerciante/perfil');
  }

  return (
    <Screen bottomInset contentStyle={{ gap: 16, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 16 }}>
        <BackBtn />
        <T size={18} weight={700}>
          Mi negocio
        </T>
      </View>

      <View style={{ gap: 16, paddingHorizontal: 20 }}>
        <Card style={{ gap: 16, padding: 16 }}>
          <FotoCampo titulo="Logo del negocio" uri={logo} nombre={nombre || negocio.nombre} onChange={tocar(setLogo)} />
          <Field label="Nombre del negocio" value={nombre} onChangeText={tocar(setNombre)} autoCapitalize="words" />
          <GiroCampo value={giro} onChange={tocar(setGiro)} />
          <Field
            label="Descripción (opcional)"
            placeholder="Ej. Carnes frescas todos los días, cortes a tu gusto"
            value={descripcion}
            onChangeText={tocar(setDescripcion)}
            multiline
            h={64}
          />
        </Card>

        <Card style={{ gap: 16, padding: 16 }}>
          <T size={16} weight={700}>
            Contacto y horario
          </T>
          <Field label="Teléfono del negocio" placeholder="10 dígitos" keyboardType="phone-pad" value={telefono} onChangeText={tocar(setTelefono)} />
          <Field
            label="Correo del negocio (opcional)"
            placeholder="negocio@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={correo}
            onChangeText={tocar(setCorreo)}
          />
          <Field label="Horario" placeholder="Ej. Lunes a sábado de 7:00 a 20:00" value={horario} onChangeText={tocar(setHorario)} />
        </Card>

        <Card style={{ gap: 14, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T size={15} weight={700}>
                Entrega a domicilio
              </T>
              <T size={12} color={C.muted}>
                Los clientes podrán filtrar los negocios que entregan.
              </T>
            </View>
            <Toggle value={aDomicilio} onChange={tocar(setADomicilio)} label="Entrega a domicilio" />
          </View>
          {aDomicilio ? (
            <Field label="¿A dónde entregas? (opcional)" placeholder="Ej. Todo San Francisco Javier" value={zona} onChangeText={tocar(setZona)} />
          ) : null}
        </Card>

        <Card style={{ gap: 14, padding: 16 }}>
          <T size={16} weight={700}>
            ¿Dónde estás?
          </T>
          <Field
            label="Dirección o referencia"
            placeholder="Ej. Calle Hidalgo 12, frente a la iglesia"
            value={direccion}
            onChangeText={tocar(setDireccion)}
            autoCapitalize="sentences"
          />
        </Card>

        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
        {guardado ? (
          <T size={14} weight={600} color={C.greenDark}>
            Guardado.
          </T>
        ) : null}
        <Btn label="Guardar cambios" onPress={guardar} />
      </View>
    </Screen>
  );
}
