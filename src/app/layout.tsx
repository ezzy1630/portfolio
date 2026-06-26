import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kinetic Fluid Canvas — Portfolio",
  description:
    "A real-time WebGL fluid portfolio. Built with Three.js, custom GLSL, GSAP and Lenis.",
  keywords: [
    "portfolio",
    "WebGL",
    "Three.js",
    "fluid simulation",
    "creative developer",
  ],
  authors: [{ name: "Kinetic Fluid Canvas" }],
  openGraph: {
    title: "Kinetic Fluid Canvas — Portfolio",
    description: "A real-time WebGL fluid portfolio.",
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
        className={`${display.variable} antialiased bg-[#030303] text-[#f5f5f7] overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
