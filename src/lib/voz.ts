import * as Speech from 'expo-speech';

/**
 * La voz de Boti: usa la voz en español que ya trae el teléfono o el navegador, pero más aguda y un poquito
 * más lenta para que suene tierna. Nunca guarda ni envía lo que dice: solo lo lee en voz alta.
 */
const TONO = 1.8;
const RAPIDEZ = 0.95;

let vozElegida: string | undefined;
let buscada = false;

/** Busca una voz en español de México (o de cualquier lugar) la primera vez que Boti habla. */
async function buscarVoz() {
  if (buscada) return;
  buscada = true;
  try {
    const voces = await Speech.getAvailableVoicesAsync();
    const es = voces.filter((v) => v.language?.toLowerCase().startsWith('es'));
    const mx = es.filter((v) => v.language?.toLowerCase().replace('_', '-') === 'es-mx');
    vozElegida = (mx[0] ?? es[0])?.identifier;
  } catch {
    /* se usa la voz que el sistema elija */
  }
}

/** Boti dice el texto en voz alta (si ya estaba hablando, se calla y empieza de nuevo). */
export async function hablarBoti(texto: string, alEmpezar?: () => void, alTerminar?: () => void) {
  try {
    await buscarVoz();
    void Speech.stop();
    Speech.speak(texto, {
      language: 'es-MX',
      voice: vozElegida,
      pitch: TONO,
      rate: RAPIDEZ,
      onStart: alEmpezar,
      onDone: alTerminar,
      onStopped: alTerminar,
      onError: alTerminar,
    });
  } catch {
    alTerminar?.();
  }
}

export function callarBoti() {
  try {
    void Speech.stop();
  } catch {
    /* nada que callar */
  }
}
