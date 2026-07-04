import type { Metadata } from "next";
import { Playfair_Display, Inter, Space_Mono } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"], 
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
})

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mango - Candidates, Employer & University Career Platform",
  description: "Hiring and talent analytics for the Mango Career OS.",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable} ${mono.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
