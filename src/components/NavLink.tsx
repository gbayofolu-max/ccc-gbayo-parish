"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname() ?? "";
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  const baseClasses =
    "text-white/90 hover:text-gold transition-colors text-sm font-medium tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]";

  const activeClasses = "text-gold font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]";

  return (
    <Link href={href} className={isActive ? `${baseClasses} ${activeClasses}` : baseClasses}>
      {children}
      {isActive && <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-gold" />}
    </Link>
  );
}