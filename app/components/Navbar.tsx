"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignOutButton, UserButton, useAuth } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  const links = [
    { href: "/", label: "Home" },
    { href: "/search", label: "Search" },
    { href: "/discover", label: "Discover" },
    ...(isSignedIn ? [{ href: "/my-books", label: "My Books" }] : []),
  ];

  return (
    <nav className="bg-charcoal border-b border-light-border">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-[family-name:var(--font-cormorant)] text-xl tracking-wide text-accent"
        >
          The Class Bookshelf
        </Link>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wider uppercase transition-colors ${
                  pathname === link.href
                    ? "text-accent border-b border-accent"
                    : "text-warm-gray hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <UserButton />
              <SignOutButton>
                <button className="text-xs tracking-wider uppercase bg-light-border text-cream px-3 py-1.5 rounded hover:bg-warm-gray/30 transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="text-sm tracking-wider uppercase text-warm-gray hover:text-cream transition-colors">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}
