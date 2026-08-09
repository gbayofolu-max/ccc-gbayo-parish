'use client';

import { usePathname } from 'next/navigation';
import NehemiahChat from './NehemiahChat';

export default function NehemiahChatGate() {
  const pathname = usePathname();
  if (pathname === '/nehemiah') return null;
  return <NehemiahChat />;
}