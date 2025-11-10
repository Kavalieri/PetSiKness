"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "next-auth";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import { Home, PawPrint, UtensilsCrossed, Apple } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Mascotas", href: "/pets", icon: PawPrint },
  { name: "Alimentos", href: "/foods", icon: Apple },
  { name: "Alimentación", href: "/feeding", icon: UtensilsCrossed },
];

interface NavBarProps {
  user?: User | null;
}

export function NavBar({ user }: NavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-foreground hover:text-foreground/80 transition-colors"
          >
            🐾 Pet SiKness
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user &&
              navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}

            <ThemeToggle />
            {user && <UserMenu user={user} />}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center space-x-2">
            {user &&
              navigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-2 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                    title={item.name}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="sr-only md:not-sr-only">{item.name}</span>
                  </Link>
                );
              })}

            <ThemeToggle />
            {user && <UserMenu user={user} />}
          </div>
        </div>
      </div>
    </nav>
  );
}
