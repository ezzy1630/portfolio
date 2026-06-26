import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ezzy Rappeport — Kinetic Fluid Canvas",
  description:
    "AI systems and consumer iOS software at scale. A real-time WebGL fluid portfolio.",
  keywords: [
    "Ezzy Rappeport",
    "AI systems",
    "iOS",
    "SwiftUI",
    "MonkeyClaw",
    "FlowE",
    "Argyph",
    "WebGL",
    "fluid simulation",
  ],
  authors: [{ name: "Ezzy Rappeport" }],
  openGraph: {
    title: "Ezzy Rappeport — Kinetic Fluid Canvas",
    description: "AI systems and consumer iOS software at scale.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${display.variable} ${mono.variable} antialiased bg-[#050507] text-[#f5f5f7] overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
