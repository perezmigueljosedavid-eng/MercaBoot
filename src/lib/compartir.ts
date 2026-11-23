import { Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { cartelHtml, enlaceDeNegocio, enlaceDeWhatsApp, mensajeParaCompartir, nombreDeArchivoCartel } from './enlaces';

/**
 * Compartir un negocio: la hoja de «Compartir» del teléfono, WhatsApp, copiar el enlace y el cartel con QR (imprimir o PDF).
 * Todas devuelven `null` si salió bien o el texto (en español sencillo) que hay que mostrarle a la persona si algo falló.
 * Autor: José David Pérez Miguel
 */

export type NegocioParaCompartir = { id: string; nombre: string; giro?: string };

/** Copia el enlace del negocio. Devuelve el aviso que se le muestra a la persona. */
export async function copiarEnlace(id: string): Promise<string> {
  try {
    await Clipboard.setStringAsync(enlaceDeNegocio(id));
    return 'Enlace copiado. Pégalo en WhatsApp o donde quieras.';
  } catch {
    return 'No pudimos copiar el enlace.';
  }
}

/** Abre la hoja de «Compartir» del teléfono con el mensaje y el enlace. */
export async function compartirNegocio(n: NegocioParaCompartir): Promise<string | null> {
  try {
    await Share.share({ message: mensajeParaCompartir(n.nombre, n.id) });
    return null;
  } catch {
    // Sin hoja de compartir (por ejemplo, algunos navegadores): se deja el enlace copiado
    const r = await copiarEnlace(n.id);
    return r.startsWith('Enlace copiado') ? 'No se pudo abrir «Compartir», pero copié el enlace. Pégalo donde quieras.' : r;
  }
}

/** Abre WhatsApp con el mensaje ya escrito para que la persona elija a quién mandarlo. */
export async function compartirPorWhatsApp(n: NegocioParaCompartir): Promise<string | null> {
  try {
    await Linking.openURL(enlaceDeWhatsApp(mensajeParaCompartir(n.nombre, n.id)));
    return null;
  } catch {
    return 'No pudimos abrir WhatsApp. Usa «Compartir» o «Copiar enlace».';
  }
}

/** Abre la pantalla de impresión del teléfono con el cartel (ahí también se puede «Guardar como PDF»). */
export async function imprimirCartel(n: NegocioParaCompartir): Promise<string | null> {
  try {
    await Print.printAsync({ html: cartelHtml(n) });
    return null;
  } catch {
    return 'No pudimos abrir la impresión. Prueba con «Compartir cartel en PDF».';
  }
}

/** Arma el cartel como PDF y abre la hoja de «Compartir» (WhatsApp, correo, Drive, una imprenta…). */
export async function compartirCartelPdf(n: NegocioParaCompartir): Promise<string | null> {
  try {
    const { uri } = await Print.printToFileAsync({ html: cartelHtml(n), width: 612, height: 792 });
    let archivo = uri;
    try {
      // Con un nombre claro (Cartel-Mercaboot-mi-tienda.pdf) en vez del que le pone el sistema
      const f = new File(uri);
      await f.move(new File(Paths.cache, nombreDeArchivoCartel(n.nombre)), { overwrite: true });
      archivo = f.uri;
    } catch {
      /* se manda con el nombre que tenga */
    }
    if (!(await Sharing.isAvailableAsync())) return 'Este teléfono no puede compartir archivos. Usa «Imprimir cartel».';
    await Sharing.shareAsync(archivo, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Cartel de tu negocio' });
    return null;
  } catch {
    return 'No pudimos armar el cartel. Intenta de nuevo.';
  }
}
