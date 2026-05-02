'use client';

import Link from 'next/link';

interface FloatingButtonProps {
  href: string;
  children: React.ReactNode;
}

export default function FloatingButton({ href, children }: FloatingButtonProps) {
  return (
    <Link
      href={href}
      className="inline-block bg-primary text-white rounded-full px-7 py-2.5 text-sm font-medium animate-float"
    >
      {children}
    </Link>
  );
}
