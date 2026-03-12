import type { Metadata } from "next";
import { IBM_Plex_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono"
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-orbitron"
});

export const metadata: Metadata = {
  title: "whalenet",
  description: "Scaffolded Next.js app"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plexMono.variable} ${orbitron.variable} bg-[#060501] text-neutral-100`}
      >
        {children}
      </body>
    </html>
  );
}
