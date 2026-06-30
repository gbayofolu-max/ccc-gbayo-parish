// src/components/NavLink.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const baseClasses =
    "text-white/80 hover:text-gold transition-colors text-sm font-medium tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold";

  const activeClasses = "text-gold font-semibold";

  return (
    <Link href={href} className={isActive ? `${baseClasses} ${activeClasses}` : baseClasses}>
      {children}
      {/* Optional active underline */}
      {isActive && <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-gold" />}
    </Link>
  );
}