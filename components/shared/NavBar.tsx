"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "next-auth";
import { cn } from "@/lib/utils";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Mascotas", href: "/pets" },
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
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
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
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    {item.name}
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
