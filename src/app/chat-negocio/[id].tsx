import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ChatView } from '../../ui/ChatView';

/** Chat del cliente con un negocio (el id de la ruta es el del negocio). */
export default function ChatNegocio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatView modo="cliente" id={id} showBack />;
}
