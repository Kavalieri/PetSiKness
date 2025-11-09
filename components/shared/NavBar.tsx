'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Mascotas', href: '/pets' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
            🐾 Pet SiKness
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                               (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile Navigation (simplified - sin hamburger menu) */}
          <div className="flex md:hidden space-x-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                               (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
