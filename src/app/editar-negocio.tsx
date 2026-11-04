import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { minutosEnPalabras, OPCIONES_APARTADO } from '../lib/pedidos';
import { correoValido, telefonoValido, useStore } from '../store';
import { FotoCampo } from '../ui/FotoCampo';
import { GiroCampo } from '../ui/GiroCampo';
import { BackBtn, Btn, Card, Field, goBack, Screen, SelectField, Toggle } from '../ui/kit';
import { T } from '../ui/T';
import { UbicacionCampo, type DatosUbicacion } from '../ui/UbicacionCampo';
import { C } from '../ui/theme';

/** Todo lo que el comerciante puede cambiar de su negocio. */
export default function EditarNegocio() {
  const { negocio, actualizarNegocio, leerDatosPago, guardarDatosPago } = useStore();
  const [logo, setLogo] = useState<string | undefined>(negocio?.logoUri);
  const [nombre, setNombre] = useState(negocio?.nombre ?? '');
  const [giro, setGiro] = useState(negocio?.giro ?? '');
  const [descripcion, setDescripcion] = useState(negocio?.descripcion ?? '');
  const [telefono, setTelefono] = useState(negocio?.telefono ?? '');
  const [correo, setCorreo] = useState(negocio?.correo ?? '');
  const [horario, setHorario] = useState(negocio?.horario ?? '');
  const [aDomicilio, setADomicilio] = useState(negocio?.aDomicilio ?? false);
  const [zona, setZona] = useState(negocio?.zonaEntrega ?? '');
  const [ubic, setUbic] = useState<DatosUbicacion>({
    direccion: negocio?.direccion ?? '',
    lat: negocio?.lat,
    lng: negocio?.lng,
    mapsUrl: negocio?.mapsUrl,
  });
  // Pedidos y apartado
  const [aceptaPedidos, setAceptaPedidos] = useState(negocio?.aceptaPedidos ?? true);
  const [apartadoMin, setApartadoMin] = useState(negocio?.apartadoMin ?? 60);
  const [aceptaTransf, setAceptaTransf] = useState(negocio?.aceptaTransferencia ?? false);
  const [datosPago, setDatosPago] = useState('');
  const [pagoCargado, setPagoCargado] = useState(false); // ya se leyeron los datos guardados
  const [pagoTocado, setPagoTocado] = useState(false); // el comerciante los escribió o cambió
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Los datos de pago son privados (están en otra tabla): se leen aparte.
  useEffect(() => {
    let vivo = true;
    leerDatosPago().then((t) => {
      if (!vivo || t == null) return;
      setDatosPago((actual) => actual || t);
      setPagoCargado(true);
    });
    return () => {
      vivo = false;
    };
  }, [leerDatosPago]);

  const tiempos = useMemo(() => [...new Set([...OPCIONES_APARTADO, apartadoMin])].sort((a, b) => a - b), [apartadoMin]);

  if (!negocio) return null;

  const tocar = <A,>(set: (v: A) => void) => (v: A) => {
    set(v);
    setError('');
    setGuardado(false);
  };

  async function guardar() {
    if (!nombre.trim()) return setError('Escribe el nombre del negocio.');
    if (!giro.trim()) return setError('Escribe qué tipo de negocio es.');
    if (telefono.trim() && !telefonoValido(telefono)) return setError('El teléfono debe tener 10 dígitos.');
    if (correo.trim() && !correoValido(correo)) return setError('Escribe un correo válido o déjalo vacío.');
    if (aceptaPedidos && aceptaTransf && (pagoCargado || pagoTocado) && !datosPago.trim())
      return setError('Escribe a dónde te pueden transferir (banco, CLABE o número de cuenta y nombre), o apaga «Pago por transferencia».');
    setGuardando(true);
    // Primero los datos de pago (solo si se tocaron), luego el resto del negocio.
    if (pagoTocado) {
      const errPago = await guardarDatosPago(datosPago);
      if (errPago) {
        setGuardando(false);
        return setError(errPago);
      }
    }
    const err = await actualizarNegocio({
      logoUri: logo,
      nombre,
      giro: giro.trim(),
      descripcion: descripcion.trim() || undefined,
      telefono: telefono.trim() ? telefono.replace(/\D/g, '') : undefined,
      correo: correo.trim() ? correo.trim().toLowerCase() : undefined,
      horario: horario.trim() || undefined,
      aDomicilio,
      zonaEntrega: aDomicilio ? zona.trim() || undefined : undefined,
      direccion: ubic.direccion.trim() || undefined,
      lat: ubic.lat,
      lng: ubic.lng,
      mapsUrl: ubic.mapsUrl,
      aceptaPedidos,
      apartadoMin,
      aceptaTransferencia: aceptaTransf,
    });
    setGuardando(false);
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
          <T size={12} lh={1.4} color={C.muted} style={{ marginTop: -8 }}>
            Así los clientes ven qué tan cerca estás y pueden pedir indicaciones para llegar.
          </T>
          <UbicacionCampo
            value={ubic}
            nombre={nombre || negocio.nombre}
            onChange={(u) => {
              setUbic(u);
              setError('');
              setGuardado(false);
            }}
          />
        </Card>

        <Card style={{ gap: 14, padding: 16 }}>
          <T size={16} weight={700}>
            Pedidos y apartado
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T size={15} weight={700}>
                Recibir pedidos por la app
              </T>
              <T size={12} lh={1.4} color={C.muted}>
                Si lo apagas, los clientes ven tu negocio pero no pueden apartar productos.
              </T>
            </View>
            <Toggle value={aceptaPedidos} onChange={tocar(setAceptaPedidos)} label="Recibir pedidos por la app" />
          </View>

          {aceptaPedidos ? (
            <>
              <View style={{ gap: 6 }}>
                <SelectField
                  label="¿Cuánto tiempo guardas un pedido?"
                  value={minutosEnPalabras(apartadoMin)}
                  options={tiempos.map(minutosEnPalabras)}
                  onChange={(o) => {
                    const min = tiempos[tiempos.map(minutosEnPalabras).indexOf(o)];
                    if (min) tocar(setApartadoMin)(min);
                  }}
                />
                <T size={12} lh={1.4} color={C.muted}>
                  Si el cliente no llega o no paga en ese tiempo, el pedido se cancela solo y el producto vuelve a estar a la venta. Tú también puedes darle 30 minutos más desde el pedido.
                </T>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T size={15} weight={700}>
                    Pago por transferencia
                  </T>
                  <T size={12} lh={1.4} color={C.muted}>
                    El cliente te transfiere y te avisa; tú confirmas que llegó. El pago en persona (efectivo) siempre está disponible.
                  </T>
                </View>
                <Toggle value={aceptaTransf} onChange={tocar(setAceptaTransf)} label="Pago por transferencia" />
              </View>
              {aceptaTransf ? (
                <View style={{ gap: 6 }}>
                  <Field
                    label="Datos para que te transfieran"
                    placeholder="Ej. BBVA · CLABE 0123 4567 8901 2345 67 · A nombre de María López"
                    value={datosPago}
                    onChangeText={(t) => {
                      setDatosPago(t);
                      setPagoTocado(true);
                      setError('');
                      setGuardado(false);
                    }}
                    multiline
                    h={76}
                    maxLength={500}
                  />
                  <T size={12} lh={1.4} color={C.muted}>
                    🔒 Solo los ve un cliente cuando aceptas su pedido con transferencia. No salen en tu perfil.
                  </T>
                </View>
              ) : null}
            </>
          ) : null}
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
        <Btn label={guardando ? 'Guardando…' : 'Guardar cambios'} onPress={guardando ? undefined : guardar} />
      </View>
    </Screen>
  );
}
