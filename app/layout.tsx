import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MainLayout from "@/src/components/layout/MainLayout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Aspiring AI Engineer building highly optimized agentic systems and full-stack applications. Based in Bengaluru, Karnataka.";

export const metadata: Metadata = {
  title: "Srinivas R C — AI/ML Engineer & Full-Stack Developer",
  description,
  openGraph: {
    title: "Srinivas R C — AI/ML Engineer & Full-Stack Developer",
    description,
    type: "website",
  },
};

import { ScrollProvider } from "@/src/contexts/ScrollStore";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ScrollProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </ScrollProvider>
      </body>
    </html>
  );
}
