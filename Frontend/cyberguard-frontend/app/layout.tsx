import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import LanguageToggle from "@/components/layout/LanguageToggle";
export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.5,
  maximumScale: 5,
  userScalable: true,
};



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geist has no Arabic glyphs; browsers fall back to this font for Arabic text only.
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  preload: false,
});

export const metadata: Metadata = {
  title: "CyberGuard",
  description: "Cybersecurity awareness and AI risk training",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* AuthProvider wraps the whole app here so that EVERY page,
            no matter which one, can check login status or call
            login()/logout() via the useAuth() hook. This is the one
            spot in the whole project where that connection is made. */}
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <LanguageToggle />
        </LanguageProvider>
      </body>
    </html>
  );
}
