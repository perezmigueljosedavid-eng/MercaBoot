import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ChatView } from '../../ui/ChatView';

/** Chat del comerciante con un cliente (el id de la ruta es el de la conversación). */
export default function ChatConCliente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatView modo="comerciante" id={id} showBack />;
}
