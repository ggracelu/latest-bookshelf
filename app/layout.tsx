import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Cormorant_Garamond, Libre_Baskerville, IM_Fell_English } from "next/font/google";
import SyncUser from "./components/SyncUser";
import Navbar from "./components/Navbar";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const baskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const fellEnglish = IM_Fell_English({
  variable: "--font-fell",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Class Bookshelf",
  description: "A shared bookshelf for the class",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${baskerville.variable} ${fellEnglish.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased noise-overlay">
        <ClerkProvider>
          <SyncUser />
          <Navbar />
          <main className="flex-1">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
