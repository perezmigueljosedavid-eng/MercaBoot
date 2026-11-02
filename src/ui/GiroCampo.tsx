import React, { useState } from 'react';
import { View } from 'react-native';
import { GIRO_OTRO, GIROS } from '../data/contenido';
import { Field, SelectField } from './kit';

const OPCIONES = [...GIROS.map((g) => g.nombre), GIRO_OTRO];

/** Tipo de negocio: una lista amplia o la opción de escribir uno propio. */
export function GiroCampo({
  value,
  onChange,
  label = 'Tipo de negocio',
}: {
  value: string;
  onChange: (giro: string) => void;
  label?: string;
}) {
  const conocido = GIROS.some((g) => g.nombre === value);
  const [otro, setOtro] = useState(!conocido && value.trim() !== '');
  const seleccion = otro ? GIRO_OTRO : conocido ? value : GIROS[0].nombre;

  return (
    <View style={{ gap: 12 }}>
      <SelectField
        label={label}
        value={seleccion}
        options={OPCIONES}
        onChange={(o) => {
          if (o === GIRO_OTRO) {
            setOtro(true);
            onChange(conocido ? '' : value);
          } else {
            setOtro(false);
            onChange(o);
          }
        }}
      />
      {otro ? (
        <Field
          label="¿Qué tipo de negocio es?"
          placeholder="Ej. Venta de flores, Taller de bicicletas…"
          value={value}
          onChangeText={onChange}
          autoCapitalize="sentences"
        />
      ) : null}
    </View>
  );
}
