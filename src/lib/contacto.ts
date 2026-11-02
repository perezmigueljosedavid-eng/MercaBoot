import { Linking } from 'react-native';

/** Abre la app de teléfono con el número marcado. */
export function abrirTelefono(tel: string) {
  Linking.openURL(`tel:${tel.replace(/[^\d+]/g, '')}`).catch(() => {});
}
