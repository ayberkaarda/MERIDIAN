import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { Preloader } from "@/components/ui/Preloader";
import { Cursor } from "@/components/ui/Cursor";
import { Nav } from "@/components/ui/Nav";
import { ProgressRail } from "@/components/ui/ProgressRail";
import { copy } from "@/data/copy";
import { SceneMount } from "@/components/canvas/SceneMount";
import { SceneScrollBridge } from "@/hooks/SceneScrollBridge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MERIDIAN",
  description: "MERIDIAN",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a href="#main" className="skip-link">{copy.navigation.skipLink}</a>
        <AppProviders>
          <SceneScrollBridge />
          <SceneMount />
          <Preloader />
          <Cursor />
          <Nav />
          <ProgressRail />
          <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
