import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import Constants from 'expo-constants';
import { BackBtn, Card, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/**
 * «Acerca de Mercaboot»: quién la hizo, qué datos usa la app y para qué, las reglas de la comunidad y los créditos de lo que
 * usa de otras personas. Se puede abrir sin iniciar sesión (desde la bienvenida) para que cualquiera lea la privacidad antes de crear
 * su cuenta.
 * Autor: José David Pérez Miguel
 */

function Punto({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <T size={14} color={C.green} weight={800}>
        •
      </T>
      <T size={14} lh={1.5} color={C.greyText} style={{ flex: 1 }}>
        {children}
      </T>
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: 10, padding: 16 }}>
      <T size={16} weight={800}>
        {titulo}
      </T>
      {children}
    </Card>
  );
}

function abrir(url: string) {
  void Linking.openURL(url).catch(() => {});
}

export default function AcercaDe() {
  const version = Constants.expoConfig?.version ?? '5.0.0';

  return (
    <Screen bottomInset contentStyle={{ gap: 16, paddingHorizontal: 20, paddingBottom: 28 }}>
      <View style={{ paddingTop: 8, marginLeft: -8 }}>
        <BackBtn />
      </View>

      <View style={{ gap: 4 }}>
        <T size={28} weight={800} ls={-0.02}>
          Mercaboot
        </T>
        <T size={14} color={C.muted}>
          Versión {version} · «Mercaboot 2»
        </T>
        <T size={14} lh={1.5} color={C.greyText} style={{ marginTop: 6 }}>
          Lo que hay hoy en los negocios de tu comunidad, antes de salir de casa: productos, precios, horarios, pedidos apartados y chat con el
          negocio.
        </T>
      </View>

      <Seccion titulo="Quién la hizo">
        <T size={14} lh={1.5}>
          <T size={14} weight={700}>
            Autor principal:
          </T>{' '}
          José David Pérez Miguel
        </T>
        <T size={14} lh={1.5}>
          <T size={14} weight={700}>
            Segunda autora:
          </T>{' '}
          Izebel Altamirano Carreño
        </T>
        <T size={13} lh={1.5} color={C.muted}>
          Nació como proyecto de la materia de Inteligencia Artificial de la UABJO, en Oaxaca. © 2026 José David Pérez Miguel. Todos los derechos
          reservados.
        </T>
        <Pressable accessibilityRole="link" onPress={() => abrir('https://github.com/perezmigueljosedavid-eng')} hitSlop={8}>
          <T size={13} weight={700} color={C.green}>
            Contacto para permisos: perfil de GitHub «perezmigueljosedavid-eng» ›
          </T>
        </Pressable>
      </Seccion>

      <Seccion titulo="Tu privacidad">
        <Punto>Guardamos lo que tú nos das: tu nombre, correo y teléfono, tu negocio y tus productos (si vendes), tus pedidos, mensajes y reseñas. Todo está en la nube (Supabase) y solo lo ven las personas que deben verlo.</Punto>
        <Punto>La ubicación de tu teléfono se usa en el teléfono para decirte qué tan cerca está cada negocio; no se guarda. Si eres comerciante, el punto de tu negocio sí es público: así te encuentran.</Punto>
        <Punto>La cámara solo se usa cuando tú la abres para leer un código de barras o un QR. No se guardan fotos ni video.</Punto>
        <Punto>Los avisos al teléfono son opcionales. Si los activas, se guarda un identificador de tu teléfono solo para mandártelos; se borra cuando los apagas o cierras sesión.</Punto>
        <Punto>Las ideas y recetas con inteligencia artificial (cuando están activadas) mandan el texto que escribes a un proveedor de IA para armar la respuesta. Y si un comerciante importa su lista desde una foto, esa foto también se manda para leerla y no se guarda. No escribas ni fotografíes datos personales.</Punto>
        <Punto>Mercaboot no cobra ni guarda tarjetas, y no mueve dinero: cada pago va directo al negocio. Los datos de transferencia y los links de pago son privados y solo llegan al cliente de un pedido aceptado.</Punto>
        <Punto>No vendemos tus datos ni mostramos anuncios.</Punto>
      </Seccion>

      <Seccion titulo="Reglas de la comunidad">
        <Punto>Trata con respeto a todas las personas, en los chats y en las reseñas.</Punto>
        <Punto>Publica solo lo que de verdad vendes, con datos reales. No engañes con precios, pagos o enlaces.</Punto>
        <Punto>Nada ilegal ni peligroso, y nada de spam o propaganda.</Punto>
        <Punto>Si algo te molesta, mantén el dedo sobre un mensaje o usa el menú ⋮ del chat para reportar o bloquear. Los reportes los revisa quien administra Mercaboot.</Punto>
      </Seccion>

      <Seccion titulo="Créditos">
        <Punto>Los nombres de productos que salen al leer un código de barras vienen de Open Food Facts (© colaboradores de Open Food Facts, licencia ODbL).</Punto>
        <Punto>Letra: Plus Jakarta Sans (licencia OFL). Hecha con Expo, React Native y Supabase, cada uno con su propia licencia.</Punto>
        <Pressable accessibilityRole="link" onPress={() => abrir('https://world.openfoodfacts.org')} hitSlop={8}>
          <T size={13} weight={700} color={C.green}>
            Conocer Open Food Facts ›
          </T>
        </Pressable>
      </Seccion>
    </Screen>
  );
}
