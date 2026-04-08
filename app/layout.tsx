import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, Lora, Special_Elite } from "next/font/google";
import SyncUser from "./components/SyncUser";
import Navbar from "./components/Navbar";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
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
      className={`${playfair.variable} ${lora.variable} ${specialElite.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider>
          <SyncUser />
          <Navbar />
          <main className="flex-1">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
