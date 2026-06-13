import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Srinivas R C | Portfolio",
  description: "Building production-grade systems at student scale.",
};

import WebVitalsTracker from "@/components/analytics/WebVitalsTracker";
import dynamic from "next/dynamic";

const CustomCursor = dynamic(() => import("@/components/home/CustomCursor"), { ssr: false });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${space.variable} ${mono.variable} font-space antialiased`}>
        {/* Global noise grain overlay for premium matte texture */}
        <div className="noise-overlay" aria-hidden="true" />
        {/* Custom cursor */}
        <CustomCursor />
        <WebVitalsTracker />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
