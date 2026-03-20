import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from '@clerk/themes'

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Calhame - CFO Dashboard",
  description: "CFO dashboard built for Quickbooks integrations and data visualization.",
  icons: {
    icon: "/calhame-financial-logo.svg"
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        theme: shadcn
      }}
    >
      <html lang="en">
        <body
          className={`${inter.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
