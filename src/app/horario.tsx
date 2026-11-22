import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HorarioSemana, RangoHorario } from '../data/tipos';
import { useBoti } from '../lib/boti';
import {
  abiertoSegun,
  copiarDia,
  cuandoTexto,
  DIAS,
  horaAMinutos,
  horaBonita,
  minutosAHora,
  ordenarSemana,
  ORDEN_DIAS,
  PLANTILLAS,
  ponerDia,
  proximoCambio,
  revisarSemana,
  semanaVacia,
  sinHorario,
  textoHorario,
} from '../lib/horario';
import { useAhora } from '../lib/usarAhora';
import { useStore } from '../store';
import { Casilla } from '../ui/Casilla';
import { Confirmar } from '../ui/Dialogo';
import { Hoja } from '../ui/Hoja';
import { Icon } from '../ui/Icon';
import { BackBtn, Btn, Card, Chip, goBack, Screen, Toggle } from '../ui/kit';
import { SelectorHora } from '../ui/SelectorHora';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/** Qué hora se está eligiendo: de qué día, qué tramo (0 o 1) y si es la de abrir (0) o la de cerrar (1). */
interface Eligiendo {
  dia: number;
  tramo: number;
  cual: 0 | 1;
}

/** Botón con la hora; al tocarlo se abre la lista de horas. */
function Pastilla({ titulo, hora, etiqueta, onPress }: { titulo: string; hora: string; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        height: 58,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.input,
        backgroundColor: pressed ? C.grey : C.white,
        paddingHorizontal: 12,
        justifyContent: 'center',
      })}
    >
      <T size={11} weight={600} color={C.muted}>
        {titulo}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <T size={15} weight={700} numberOfLines={1}>
          {horaBonita(hora)}
        </T>
        <Icon name="down" size={16} color={C.muted} />
      </View>
    </Pressable>
  );
}

const copiaDeTramos = (rangos: RangoHorario[] | null | undefined): RangoHorario[] => (rangos ?? []).map((r) => [r[0], r[1]] as RangoHorario);

/**
 * Horario: el comerciante pone sus horas una sola vez y Mercaboot abre y cierra el negocio sola. Los clientes ven el
 * horario escrito y, cuando está cerrado, a qué hora vuelve a abrir.
 * Nada se guarda hasta tocar «Guardar horario».
 * Autor: José David Pérez Miguel
 */
export default function Horario() {
  const { negocio, guardarHorario } = useStore();
  const insets = useSafeAreaInsets();
  const { decir } = useBoti();

  const [semana, setSemana] = useState<HorarioSemana>(() => negocio?.horarioSemana ?? semanaVacia());
  // Quien nunca puso horario empieza con «abrir y cerrar solo» encendido: es para lo que sirve esta pantalla
  const [auto, setAuto] = useState<boolean>(() => negocio?.horarioAuto ?? negocio?.horarioSemana == null);
  const [cambiado, setCambiado] = useState(false);
  const [eligiendo, setEligiendo] = useState<Eligiendo | null>(null);
  const [copiando, setCopiando] = useState<number | null>(null);
  const [destinos, setDestinos] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [preguntaSalir, setPreguntaSalir] = useState(false);

  const hayHorario = !sinHorario(semana);
  const ahora = useAhora(30);
  const abiertoAhora = useMemo(() => (hayHorario ? abiertoSegun(semana, ahora) : null), [semana, hayHorario, ahora]);
  const siguiente = useMemo(() => (hayHorario ? proximoCambio(semana, ahora) : null), [semana, hayHorario, ahora]);

  if (!negocio) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 12 }}>
        <BackBtn />
        <T size={16} weight={700}>
          Esta pantalla es para cuentas con negocio.
        </T>
      </Screen>
    );
  }

  const salir = () => {
    if (cambiado && !guardando) setPreguntaSalir(true);
    else goBack('/comerciante');
  };

  const cambiar = (s: HorarioSemana) => {
    setSemana(s);
    setCambiado(true);
    setError('');
  };

  const alternarDia = (dia: number, abre: boolean) => {
    if (!abre) {
      cambiar(ponerDia(semana, dia, null));
      return;
    }
    // Se propone lo mismo que el primer día que ya abre (o de 8:00 a 20:00) y luego se ajusta
    const modelo = ORDEN_DIAS.map((d) => semana[d]).find((r) => r && r.length > 0);
    cambiar(ponerDia(semana, dia, modelo ? copiaDeTramos(modelo) : [['08:00', '20:00']]));
  };

  const ponerHora = (e: Eligiendo, hora: string) => {
    const rangos = copiaDeTramos(semana[e.dia]);
    if (!rangos[e.tramo]) return;
    rangos[e.tramo][e.cual] = hora;
    cambiar(ponerDia(semana, e.dia, rangos));
  };

  const agregarTramo = (dia: number) => {
    const rangos = copiaDeTramos(semana[dia]);
    if (rangos.length === 0 || rangos.length >= 2) return;
    // El segundo horario empieza 2 horas después de que cierra el primero (lo normal: cerrar a comer y volver)
    const fin = horaAMinutos(rangos[0][1]) ?? 14 * 60;
    const ini = Math.min(Math.ceil((fin + 120) / 15) * 15, 22 * 60);
    rangos.push([minutosAHora(ini), minutosAHora(Math.min(ini + 4 * 60, 1440))]);
    cambiar(ponerDia(semana, dia, rangos));
  };

  const quitarTramo = (dia: number, tramo: number) => {
    const rangos = copiaDeTramos(semana[dia]);
    rangos.splice(tramo, 1);
    cambiar(ponerDia(semana, dia, rangos.length > 0 ? rangos : null));
  };

  const abrirCopia = (dia: number) => {
    setDestinos([]);
    setCopiando(dia);
  };

  const aplicarCopia = () => {
    if (copiando == null || destinos.length === 0) return;
    cambiar(copiarDia(semana, copiando, destinos));
    setCopiando(null);
  };

  const alternarDestino = (d: number) => setDestinos((l) => (l.includes(d) ? l.filter((x) => x !== d) : [...l, d]));

  const aplicarPlantilla = (s: HorarioSemana) => cambiar(s.map((d) => (d ? copiaDeTramos(d) : null)));

  async function guardar() {
    if (guardando) return;
    const ordenada = ordenarSemana(semana);
    const problema = revisarSemana(ordenada);
    if (problema && (auto || hayHorario)) {
      setError(problema);
      return;
    }
    setGuardando(true);
    setError('');
    const falla = await guardarHorario(auto, ordenada);
    setGuardando(false);
    if (falla) {
      setError(falla);
      return;
    }
    setCambiado(false);
    decir(auto ? 'Listo: tu negocio abre y cierra solo con tu horario.' : 'Horario guardado. Tus clientes ya lo ven.', { pose: 'palma', emocion: 'celebra', ms: 4500 });
    goBack('/comerciante');
  }

  /** Lo que pasa con un día: el texto debajo del nombre cuando está cerrado. */
  const diaCerrado = (dia: number) => {
    const r = semana[dia];
    return !r || r.length === 0;
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ paddingBottom: 200 + insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 16 }}>
          <BackBtn onPress={salir} />
          <T size={18} weight={700}>
            Horario
          </T>
        </View>

        <View style={{ gap: 16, paddingTop: 4, paddingHorizontal: 20 }}>
          <T size={14} lh={1.5} color={C.greyText}>
            Pon tus horas una sola vez. Tus clientes verán a qué hora abres, y si quieres, Mercaboot abre y cierra tu negocio por ti.
          </T>

          {/* automático */}
          <Card style={{ gap: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={16} weight={700}>
                  Abrir y cerrar solo
                </T>
                <T size={13} lh={1.4} color={C.muted}>
                  {auto
                    ? 'Tu negocio se abre y se cierra solo con este horario. Si un día cierras antes, lo cierras tú a mano desde tu pantalla de inicio.'
                    : 'Tus clientes ven este horario, pero tú abres y cierras a mano desde tu pantalla de inicio.'}
                </T>
              </View>
              <Toggle
                big
                value={auto}
                onChange={(v) => {
                  setAuto(v);
                  setCambiado(true);
                  setError('');
                }}
                label="Abrir y cerrar solo"
              />
            </View>
            {negocio.horario && !negocio.horarioSemana ? (
              <T size={12} lh={1.4} color={C.muted}>
                Ahora tu horario dice: «{negocio.horario}». Al guardar, se cambia por el que armes aquí.
              </T>
            ) : null}
          </Card>

          {/* plantillas */}
          <View style={{ gap: 8 }}>
            <T size={13} weight={700} color={C.greyText}>
              {hayHorario ? 'Cambiar a un horario común' : 'Empieza con un horario común'}
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} keyboardShouldPersistTaps="handled">
              {PLANTILLAS.map((p) => (
                <Chip key={p.id} label={p.nombre} h={40} px={14} size={13} onPress={() => aplicarPlantilla(p.semana)} />
              ))}
            </ScrollView>
          </View>

          {/* días */}
          <View style={{ gap: 10 }}>
            {ORDEN_DIAS.map((dia) => {
              const rangos = semana[dia] ?? [];
              const cerrado = diaCerrado(dia);
              return (
                <Card key={dia} r={16} style={{ gap: 12, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1, gap: 1 }}>
                      <T size={16} weight={700}>
                        {DIAS[dia]}
                      </T>
                      <T size={12} color={cerrado ? C.muted : C.greenDark}>
                        {cerrado ? 'Cerrado' : 'Abierto'}
                      </T>
                    </View>
                    <Toggle value={!cerrado} onChange={(v) => alternarDia(dia, v)} label={`${DIAS[dia]}: ${cerrado ? 'cerrado, tocar para abrir' : 'abierto, tocar para cerrar'}`} />
                  </View>

                  {rangos.map((r, i) => {
                    const a = horaAMinutos(r[0]) ?? 0;
                    const b = horaAMinutos(r[1]) ?? 0;
                    const pasa = b <= a;
                    return (
                      <View key={i} style={{ gap: 6 }}>
                        {rangos.length > 1 ? (
                          <T size={12} weight={700} color={C.muted}>
                            {i === 0 ? 'Primer horario' : 'Segundo horario'}
                          </T>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Pastilla
                            titulo="Abre"
                            hora={r[0]}
                            etiqueta={`${DIAS[dia]}, hora de abrir: ${horaBonita(r[0])}. Tocar para cambiar`}
                            onPress={() => setEligiendo({ dia, tramo: i, cual: 0 })}
                          />
                          <Pastilla
                            titulo="Cierra"
                            hora={r[1]}
                            etiqueta={`${DIAS[dia]}, hora de cerrar: ${horaBonita(r[1])}. Tocar para cambiar`}
                            onPress={() => setEligiendo({ dia, tramo: i, cual: 1 })}
                          />
                          {rangos.length > 1 ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Quitar el ${i === 0 ? 'primer' : 'segundo'} horario del ${DIAS[dia].toLowerCase()}`}
                              onPress={() => quitarTramo(dia, i)}
                              hitSlop={6}
                              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.redTint, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Icon name="trash" size={18} color={C.red} />
                            </Pressable>
                          ) : null}
                        </View>
                        {pasa ? (
                          <T size={12} lh={1.35} color={C.amberText}>
                            Pasa de medianoche: cierra a las {horaBonita(r[1])} del día siguiente.
                          </T>
                        ) : null}
                      </View>
                    );
                  })}

                  {!cerrado ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {rangos.length < 2 ? <Chip label="+ Otro horario (por ejemplo, después de comer)" h={38} px={12} size={12} onPress={() => agregarTramo(dia)} /> : null}
                      <Chip label="Copiar a otros días" h={38} px={12} size={12} onPress={() => abrirCopia(dia)} />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>

          {/* resumen */}
          <Card style={{ gap: 8, padding: 16, backgroundColor: C.greenTint, borderColor: C.greenTint }}>
            <T size={13} weight={700} color={C.greenDark}>
              Así lo verán tus clientes
            </T>
            <T size={15} weight={700} lh={1.4}>
              {hayHorario ? textoHorario(semana) : 'Marca al menos un día en que abres.'}
            </T>
            {hayHorario && auto ? (
              <T size={13} lh={1.45} color={C.greyText}>
                Si guardas ahora, tu negocio quedará {abiertoAhora ? 'abierto' : 'cerrado'}.
                {siguiente ? ` Después ${siguiente.abre ? 'se abrirá' : 'se cerrará'} ${cuandoTexto(siguiente.en, ahora)}.` : ''} La hora es la de Oaxaca.
              </T>
            ) : null}
          </Card>
        </View>
      </Screen>

      <View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 + insets.bottom, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }}
      >
        {error ? (
          <T size={13} weight={600} lh={1.4} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
        <Btn label={guardando ? 'Guardando…' : 'Guardar horario'} h={52} disabled={guardando || !cambiado} onPress={guardar} />
      </View>

      {/* elegir hora */}
      {eligiendo ? (
        <SelectorHora
          visible
          titulo={`${DIAS[eligiendo.dia]}: ${eligiendo.cual === 0 ? '¿a qué hora abres?' : '¿a qué hora cierras?'}`}
          valor={semana[eligiendo.dia]?.[eligiendo.tramo]?.[eligiendo.cual] ?? '08:00'}
          incluirMedianoche={eligiendo.cual === 1}
          onElegir={(h) => {
            ponerHora(eligiendo, h);
            setEligiendo(null);
          }}
          onCerrar={() => setEligiendo(null)}
        />
      ) : null}

      {/* copiar un día a otros */}
      <Hoja visible={copiando != null} titulo={copiando != null ? `Copiar el horario del ${DIAS[copiando].toLowerCase()} a…` : ''} onCerrar={() => setCopiando(null)} alto="85%">
        {copiando != null ? (
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            <T size={13} lh={1.4} color={C.muted}>
              {textoHorario(ponerDia(semanaVacia(), copiando, semana[copiando]))}
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Lunes a viernes" h={38} px={14} size={13} onPress={() => setDestinos([1, 2, 3, 4, 5].filter((d) => d !== copiando))} />
              <Chip label="Toda la semana" h={38} px={14} size={13} onPress={() => setDestinos([0, 1, 2, 3, 4, 5, 6].filter((d) => d !== copiando))} />
              <Chip label="Ninguno" h={38} px={14} size={13} onPress={() => setDestinos([])} />
            </View>
            <View>
              {ORDEN_DIAS.filter((d) => d !== copiando).map((d) => (
                <Pressable
                  key={d}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: destinos.includes(d) }}
                  onPress={() => alternarDestino(d)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 48 }}
                >
                  <Casilla marcada={destinos.includes(d)} />
                  <T size={15} weight={600}>
                    {DIAS[d]}
                  </T>
                </Pressable>
              ))}
            </View>
            <Btn
              label={destinos.length > 0 ? `Copiar a ${destinos.length} ${destinos.length === 1 ? 'día' : 'días'}` : 'Elige los días'}
              h={50}
              disabled={destinos.length === 0}
              onPress={aplicarCopia}
            />
          </ScrollView>
        ) : null}
      </Hoja>

      <Confirmar
        visible={preguntaSalir}
        titulo="¿Salir sin guardar?"
        texto="Hiciste cambios en tu horario que todavía no se guardan."
        confirmar="Salir sin guardar"
        cancelar="Seguir editando"
        peligro
        onCancelar={() => setPreguntaSalir(false)}
        onConfirmar={() => {
          setPreguntaSalir(false);
          goBack('/comerciante');
        }}
      />
    </View>
  );
}
