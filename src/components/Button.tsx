'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
};

export default function Button({ href, children, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'inline-block rounded-md px-6 py-3 text-lg font-medium transition-colors focus:outline-none focus:ring-2';

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-400',
    secondary: 'bg-[#F5C518] text-gray-900 hover:bg-[#D4A017] focus:ring-[#D4A017]',
  };

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </Link>
  );
}